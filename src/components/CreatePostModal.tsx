import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, MapPin, Check, Loader2, Link2, Share2, DownloadCloud } from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { UrlEmbedData } from '../types';
import { UrlEmbedCard } from './UrlEmbedCard';

export const CreatePostModal: React.FC = () => {
  const { isCreateOpen, setIsCreateOpen, createPost } = useSocial();
  const { currentUser } = useAuth();

  const [postMode, setPostMode] = useState<'media' | 'embed'>('media');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5'>('1:1');
  const [caption, setCaption] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');

  // URL Embed state
  const [embedUrlInput, setEmbedUrlInput] = useState<string>('');
  const [embedData, setEmbedData] = useState<UrlEmbedData | null>(null);
  const [isFetchingEmbed, setIsFetchingEmbed] = useState<boolean>(false);

  // Cross-posting toggles
  const [shareToX, setShareToX] = useState<boolean>(false);
  const [shareToMeta, setShareToMeta] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCreateOpen || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageMimeType(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFetchEmbed = async () => {
    if (!embedUrlInput.trim() || isFetchingEmbed) return;
    setIsFetchingEmbed(true);
    try {
      const res = await fetch('/api/url-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: embedUrlInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmbedData(data);
        if (!caption) {
          setCaption(`Referencing: ${data.title} #fluid #pulse`);
        }
        if (!selectedImage && data.imageUrl) {
          setSelectedImage(data.imageUrl);
        }
      }
    } catch (err) {
      console.warn('Embed preview failed:', err);
    } finally {
      setIsFetchingEmbed(false);
    }
  };

  const handleImportFromSocial = () => {
    const pasted = prompt(
      'Paste public post URL from Instagram, X (Twitter), or Facebook to import:',
      'https://x.com/design/status/1789'
    );
    if (pasted && pasted.trim()) {
      setPostMode('embed');
      setEmbedUrlInput(pasted.trim());
      // Trigger fetch automatically
      fetch('/api/url-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pasted.trim() }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setEmbedData(data);
            setCaption(`Imported from ${data.domain}: ${data.title} #imported #fluid`);
          }
        })
        .catch(console.warn);
    }
  };

  const handleGenerateAiCaption = async () => {
    if (isGeneratingAi) return;
    setIsGeneratingAi(true);

    try {
      const response = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage.startsWith('data:') ? selectedImage : undefined,
          mimeType: imageMimeType,
          topic: selectedImage.startsWith('data:')
            ? undefined
            : 'Minimalist creative photography and contemporary visual design on Fluid by ECHO Intelligence',
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      if (data.caption) {
        setCaption(data.caption);
      }
    } catch (err) {
      console.warn('AI Caption failed, using creative fallback:', err);
      setCaption(
        'Light and shadow shaping the stillness. Form follows intention. #minimalism #fluid #echointelligence'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage =
      selectedImage ||
      embedData?.imageUrl ||
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80';

    const crossPostedTo: ('x' | 'instagram' | 'facebook')[] = [];
    if (shareToX) crossPostedTo.push('x');
    if (shareToMeta) crossPostedTo.push('instagram');

    await createPost({
      imageUrl: finalImage,
      caption: caption.trim() || 'Captured on Fluid. #fluid #echointelligence',
      aspectRatio,
      location: location.trim() || undefined,
      embedUrl: embedData?.url || undefined,
      embedData: embedData || undefined,
      crossPostedTo: crossPostedTo.length > 0 ? crossPostedTo : undefined,
    });

    // Reset & close
    setSelectedImage('');
    setCaption('');
    setLocation('');
    setEmbedData(null);
    setEmbedUrlInput('');
    setIsCreateOpen(false);
  };

  const canSubmit = !!selectedImage || !!embedData;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="relative w-full max-w-[500px] bg-[#121212] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#161618]">
          <button
            onClick={() => setIsCreateOpen(false)}
            aria-label="Cancel"
            className="text-neutral-400 hover:text-white text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <h2 className="text-sm font-semibold text-white tracking-tight">Create Post</h2>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              canSubmit
                ? 'text-black bg-white hover:bg-neutral-100 active:scale-95 shadow-md'
                : 'text-neutral-600 bg-neutral-900 cursor-not-allowed'
            }`}
          >
            Share
          </button>
        </div>

        {/* Mode Selector & Quick Import Tool */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-neutral-900 text-xs">
          <div className="flex items-center gap-1 bg-neutral-900/80 p-0.5 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setPostMode('media')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                postMode === 'media'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Media Photo
            </button>
            <button
              type="button"
              onClick={() => setPostMode('embed')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                postMode === 'embed'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Link Embed
            </button>
          </div>

          <button
            type="button"
            onClick={handleImportFromSocial}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-neutral-400" />
            <span>Import Post</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Post Mode: Photo Upload */}
          {postMode === 'media' && (
            <div className="space-y-2">
              {selectedImage ? (
                <div className="relative w-full bg-black rounded-2xl overflow-hidden border border-neutral-800 group">
                  <img
                    src={selectedImage}
                    alt="Upload preview"
                    className={`w-full ${aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-square'} object-cover`}
                  />
                  {/* Aspect ratio badge */}
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md rounded-xl p-1 border border-neutral-700/80 flex items-center gap-1 z-10">
                    <button
                      type="button"
                      onClick={() => setAspectRatio('1:1')}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                        aspectRatio === '1:1' ? 'bg-white text-black font-semibold' : 'text-neutral-300'
                      }`}
                    >
                      1:1
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio('4:5')}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                        aspectRatio === '4:5' ? 'bg-white text-black font-semibold' : 'text-neutral-300'
                      }`}
                    >
                      4:5
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedImage('')}
                    aria-label="Remove image"
                    className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white p-1.5 rounded-full border border-neutral-700 active:scale-90 transition-transform cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square border border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl bg-neutral-900/40 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
                >
                  <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:scale-105 transition-transform mb-3">
                    <Upload className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-sm font-medium text-white mb-1">
                    Select media from device
                  </span>
                  <span className="text-xs text-neutral-400">
                    High-res JPEG, PNG, or WEBP
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Post Mode: URL Embed */}
          {postMode === 'embed' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Paste Post or News URL (X, Instagram, Facebook, News)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="url"
                      value={embedUrlInput}
                      onChange={(e) => setEmbedUrlInput(e.target.value)}
                      placeholder="https://x.com/username/status/..."
                      className="w-full bg-[#18181A] border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchEmbed}
                    disabled={!embedUrlInput.trim() || isFetchingEmbed}
                    className="px-4 bg-white text-black text-xs font-semibold rounded-xl hover:bg-neutral-100 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isFetchingEmbed ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
                  </button>
                </div>
              </div>

              {embedData && (
                <div className="pt-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Embed Preview Card:
                  </span>
                  <UrlEmbedCard embed={embedData} />
                </div>
              )}
            </div>
          )}

          {/* Caption Box with Gemini AI Caption Generator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Caption
              </label>
              <button
                type="button"
                onClick={handleGenerateAiCaption}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-[11px] font-medium text-neutral-200 hover:text-white hover:border-neutral-500 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3 h-3 text-neutral-400 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>✨ AI Caption</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption... Include #hashtags for automatic topic discovery"
              rows={3}
              className="w-full bg-[#18181A] border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Location input */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Location (Optional)
            </label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-3 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location (e.g. Kyoto, Higashiyama)"
                className="w-full bg-[#18181A] border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          {/* Cross-Posting Hub Section */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Connected Cross-Posting Hub</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Auto-Sync</span>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">𝕏</span>
                  <span>Share to X (Twitter)</span>
                </span>
                <input
                  type="checkbox"
                  checked={shareToX}
                  onChange={(e) => setShareToX(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-white focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="flex items-center gap-2">
                  <span className="font-bold text-pink-500">IG</span>
                  <span>Share to Instagram & Facebook</span>
                </span>
                <input
                  type="checkbox"
                  checked={shareToMeta}
                  onChange={(e) => setShareToMeta(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-white focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
