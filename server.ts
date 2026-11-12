import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // Gemini API client helper (lazy-initialized so missing key never crashes startup)
  const apiKey = process.env.GEMINI_API_KEY || '';
  const getAiClient = () =>
    new GoogleGenAI({
      apiKey: apiKey || 'placeholder_key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

  // AI Smart Caption endpoint
  app.post('/api/ai/caption', async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageBase64, mimeType, topic, style } = req.body;

      if (!apiKey) {
        // Fallback realistic caption if API key is not yet set
        const fallbacks = [
          "Quiet moments between the noise. Morning reflections in monochrome. #minimalism #tokyostudio #perspective",
          "Shadows aligning with the architecture. Designed for solitude and purpose. #aesthetic #brutalismluxe #echointelligence",
          "Tactile materials and analog thoughts. Studio details on honed granite. #workspace #designsystems #fluid",
          "Where the basalt cliffs meet the northern tides. Boundless horizon. #nordicscape #solitude #editorial",
          "Precision craft at the intersection of form and acoustics. #audiophile #minimalist #echodesign",
        ];
        const randomCaption = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        res.json({ caption: randomCaption });
        return;
      }

      const promptInstructions = `You are the lead editor and creative director for Fluid, a modern, highly discerning aesthetic platform by ECHO Intelligence.
Write a concise, natural, non-cringe caption for a social media post.
Rules:
- NEVER use generic influencer cliches (no "living my best life", no "vibes", no "chasing sunsets", no cringe questions like "what do you think?").
- Tone: Effortless, understated, poetic yet grounded, modern, observant.
- Length: 1 to 2 short sentences maximum.
- End with exactly 3 relevant, aesthetic, lowercase hashtags (e.g. #minimal #archdaily #echostudio).
- Output ONLY the final caption with the hashtags, nothing else.`;

      let responseText = '';

      if (imageBase64 && mimeType) {
        // Clean base64 if it has data URL prefix
        const base64Data = imageBase64.includes(';base64,')
          ? imageBase64.split(';base64,')[1]
          : imageBase64;

        const response = await getAiClient().models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              text: `${promptInstructions}\nAnalyze this photo and write the caption:`,
            },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        });
        responseText = response.text || '';
      } else {
        const response = await getAiClient().models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${promptInstructions}\nTheme or context: ${topic || style || 'minimalist contemporary lifestyle & architecture'}.`,
        });
        responseText = response.text || '';
      }

      const cleanCaption = responseText.trim().replace(/^"|"$/g, '');
      res.json({ caption: cleanCaption || "Curated moments in natural light. #minimalism #fluid #echointelligence" });
    } catch {
      res.json({
        caption: "Geometry and silence. Form follows intention. #minimalism #fluid #echointelligence",
      });
    }
  });

  // Gemini Google Search Grounding: Live External Social & News Pulse
  app.post('/api/pulse', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        topics = ['Technology', 'Design', 'Architecture', 'Culture'],
        sources = ['news', 'x', 'instagram', 'facebook'],
      } = req.body;

      const topicsList = Array.isArray(topics) && topics.length > 0 ? topics : ['Technology', 'Design', 'Architecture'];
      const sourcesList = Array.isArray(sources) && sources.length > 0 ? sources : ['news', 'x', 'instagram', 'facebook'];

      if (!apiKey || apiKey.length < 10 || apiKey.includes('YOUR_API_KEY')) {
        // High quality realistic grounded references if API key is not present or invalid
        const defaultPulse = [
          {
            id: 'pulse_demo_1',
            source: 'news' as const,
            sourceName: 'Reuters Technology',
            title: 'Breakthrough in Silicon Photonics Enables 10x Bandwidth for Next-Gen Compute Clusters',
            summary: 'Engineers report major reductions in optical latency and thermal dissipation in experimental datacenter interconnects.',
            url: 'https://www.reuters.com/technology',
            timestamp: '24m ago',
            topic: 'Technology',
            tags: ['technology', 'hardware', 'compute'],
            likesCount: 0,
          },
          {
            id: 'pulse_demo_2',
            source: 'x' as const,
            sourceName: '@sama on X',
            title: 'Observations on scaling laws, reasoning depth, and agentic workflows',
            summary: 'Discussion surrounding frontier reasoning models and their real-time application in automated software architecture.',
            url: 'https://x.com',
            timestamp: '1h ago',
            topic: 'Technology',
            tags: ['technology', 'ai', 'software'],
            likesCount: 0,
          },
          {
            id: 'pulse_demo_3',
            source: 'instagram' as const,
            sourceName: 'Architectural Digest on IG',
            title: 'Inside Studio Mumbai’s Cast Bronze and Local Teak Pavilion',
            summary: 'A study in tactile natural materials blending rain-screen joinery with deep meditative courtyards.',
            url: 'https://www.instagram.com',
            timestamp: '3h ago',
            topic: 'Architecture',
            tags: ['architecture', 'design', 'minimalism'],
            likesCount: 0,
          },
          {
            id: 'pulse_demo_4',
            source: 'facebook' as const,
            sourceName: 'NASA Jet Propulsion Laboratory',
            title: 'New High-Resolution Spectral Imagery Captured by James Webb Space Telescope',
            summary: 'Astrophysicists identify previously uncatalogued hydrocarbon signatures in distant protoplanetary disks.',
            url: 'https://www.facebook.com/NASAJPL',
            timestamp: '5h ago',
            topic: 'Science',
            tags: ['science', 'astronomy', 'space'],
            likesCount: 0,
          },
        ];
        res.json({ items: defaultPulse });
        return;
      }

      const prompt = `Search the live web using Google Search for the most current, breaking, and trending public posts, stories, and articles published today or this week regarding topics: ${topicsList.join(', ')}.
Target source platforms to include: ${sourcesList.join(', ')}.

Return a structured JSON array containing 5 to 8 distinct trending items.
Each item must strictly have:
- "source": one of "news", "x", "instagram", "facebook"
- "sourceName": name of the publisher or creator (e.g. "Bloomberg", "@karpathy on X", "Vogue on IG", "NASA on FB")
- "title": a clear, compelling headline or post hook
- "summary": a 2-sentence summary of the story or discussion
- "topic": the primary topic (e.g. Technology, Architecture, Cinema, Music, Science, Finance)
- "tags": an array of 2-3 lowercase keyword tags (e.g. ["tech", "ai"])
- "timestamp": relative time string (e.g. "18m ago", "1h ago", "3h ago")

Format the response strictly as valid JSON without markdown fences or additional chat text.`;

      const response = await getAiClient().models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Extract grounded URLs from candidates[0].groundingMetadata.groundingChunks
      const groundingChunks = (response.candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
      const webLinks = groundingChunks
        .map((c: any) => c.web)
        .filter((w: any) => w && w.uri);

      const rawText = response.text || '';
      let parsedItems: any[] = [];

      try {
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedItems = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn('Failed to parse JSON directly from Gemini Search Grounding response:', err);
      }

      if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
        // Fallback structured items based on returned web chunks
        parsedItems = webLinks.slice(0, 5).map((w: any, idx: number) => ({
          source: (idx % 2 === 0 ? 'news' : 'x') as any,
          sourceName: w.title || 'Live Web Source',
          title: w.title || 'Trending Cultural & Technology Development',
          summary: 'Latest updates and discussions curated in real-time via ECHO Search Grounding.',
          topic: topicsList[idx % topicsList.length] || 'Technology',
          tags: ['pulse', 'trending'],
          timestamp: 'Just now',
          url: w.uri,
        }));
      }

      // Enrich items with IDs and grounded URLs
      const enrichedItems = parsedItems.map((item, index) => {
        const matchedLink = webLinks[index % Math.max(1, webLinks.length)];
        const fallbackUrl = item.source === 'x'
          ? 'https://x.com'
          : item.source === 'instagram'
          ? 'https://www.instagram.com'
          : item.source === 'facebook'
          ? 'https://www.facebook.com'
          : 'https://news.google.com';

        return {
          id: `pulse_${Date.now()}_${index}`,
          source: (['news', 'x', 'instagram', 'facebook'].includes(item.source) ? item.source : 'news') as any,
          sourceName: item.sourceName || (item.source === 'x' ? 'X Post' : 'Live News'),
          title: item.title || 'Trending Story',
          summary: item.summary || 'Real-time social intelligence curated by Fluid.',
          url: item.url || (matchedLink?.uri) || fallbackUrl,
          timestamp: item.timestamp || 'Recent',
          topic: item.topic || topicsList[0] || 'General',
          tags: Array.isArray(item.tags) ? item.tags : ['culture'],
          likesCount: 0,
        };
      });

      res.json({ items: enrichedItems });
    } catch {
      res.json({
        items: [
          {
            id: 'pulse_err_1',
            source: 'news',
            sourceName: 'Fluid Intelligence',
            title: 'Real-time social index updating in background',
            summary: 'Live pulse stream will reconnect momentarily with fresh external stories.',
            url: 'https://news.google.com',
            timestamp: 'Just now',
            topic: 'System',
            tags: ['intelligence', 'fluid'],
            likesCount: 0,
          },
        ],
      });
    }
  });

  // URL Embed Preview endpoint (detects Instagram, X, Facebook, and News links)
  app.post('/api/url-preview', async (req: Request, res: Response): Promise<void> => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'Valid URL is required' });
        return;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      } catch {
        res.status(400).json({ error: 'Invalid URL format' });
        return;
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      let source: 'news' | 'x' | 'instagram' | 'facebook' | 'web' = 'web';
      let domainName = hostname.replace('www.', '');

      if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
        source = 'x';
        domainName = 'X (Twitter)';
      } else if (hostname.includes('instagram.com')) {
        source = 'instagram';
        domainName = 'Instagram';
      } else if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
        source = 'facebook';
        domainName = 'Facebook';
      } else if (
        hostname.includes('reuters.com') ||
        hostname.includes('bloomberg.com') ||
        hostname.includes('nytimes.com') ||
        hostname.includes('theverge.com') ||
        hostname.includes('techcrunch.com') ||
        hostname.includes('bbc.com')
      ) {
        source = 'news';
      }

      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      let author = '';
      if (source === 'x' && pathSegments.length > 0) {
        author = `@${pathSegments[0]}`;
      } else if (source === 'instagram' && pathSegments.length > 0) {
        author = `@${pathSegments[0]}`;
      }

      res.json({
        url: parsedUrl.href,
        domain: domainName,
        source,
        author: author || undefined,
        title: `${domainName} Post / Article`,
        description: `External reference from ${domainName} embedded natively inside Fluid.`,
        publishedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      console.error('URL Preview error:', err);
      res.status(500).json({ error: 'Could not generate URL preview' });
    }
  });

  // AI Tag extraction for post affinity & telemetry
  app.post('/api/ai/extract-tags', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;
      if (!text || !apiKey || apiKey.length < 10 || apiKey.includes('YOUR_API_KEY')) {
        // Fallback default tags
        const words = (text || '')
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length > 3)
          .slice(0, 3);
        res.json({ tags: words.length > 0 ? words : ['general', 'design'] });
        return;
      }

      const response = await getAiClient().models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Extract 2 to 4 concise lowercase single-word topic tags (e.g. ["tech", "cinema", "design", "music"]) representing the core subjects in this text: "${text}".
Return ONLY a JSON array of strings.`,
      });

      const responseText = response.text || '';
      const match = responseText.match(/\[[\s\S]*\]/);
      let tags = ['general'];
      if (match) {
        try {
          tags = JSON.parse(match[0]);
        } catch {
          // ignore
        }
      }
      res.json({ tags: Array.isArray(tags) ? tags.map((t: string) => String(t).toLowerCase().trim()) : ['general'] });
    } catch {
      res.json({ tags: ['design', 'culture'] });
    }
  });

  // Mount Vite middleware in development or serve static in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fluid Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
