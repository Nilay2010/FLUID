import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Loader2, Sparkles, User, ArrowRight, LogOut, Camera, Globe, Compass, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_TOPICS = [
  'Technology',
  'Cinema',
  'Music',
  'Science',
  'Sports',
  'Finance',
  'Architecture',
  'Design',
  'Fashion',
  'Philosophy',
];

const AVAILABLE_SOURCES: { id: 'news' | 'x' | 'instagram' | 'facebook'; label: string; desc: string }[] = [
  { id: 'news', label: 'Live News', desc: 'Curated journalism & breaking developments' },
  { id: 'x', label: 'X (Twitter)', desc: 'Frontier tech commentary & public discourse' },
  { id: 'instagram', label: 'Instagram', desc: 'Visual architecture, culture & editorial design' },
  { id: 'facebook', label: 'Facebook', desc: 'Institutional updates & global community labs' },
];

export const UsernameOnboardingModal: React.FC = () => {
  const { firebaseUser, completeOnboarding, checkUsernameAvailable, logout } = useAuth();

  // Wizard step: 1: Identity (@username & Avatar), 2: Interests (3+), 3: Preferred Sources
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Extract suggested username from email or displayName
  const initialUsername = useMemo(() => {
    if (firebaseUser?.email) {
      return firebaseUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');
    }
    if (firebaseUser?.displayName) {
      return firebaseUser.displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
    }
    return '';
  }, [firebaseUser]);

  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || '');
  const [bio, setBio] = useState('Visual creator on Fluid · ECHO Intelligence');
  const [avatarUrl, setAvatarUrl] = useState(
    firebaseUser?.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  );

  // User selections
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Technology', 'Design', 'Architecture']);
  const [selectedSources, setSelectedSources] = useState<('news' | 'x' | 'instagram' | 'facebook')[]>([
    'news',
    'x',
    'instagram',
    'facebook',
  ]);

  // Uniqueness validation state
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Debounced username check
  useEffect(() => {
    let active = true;
    const clean = username.trim().toLowerCase();

    if (!clean) {
      setIsValid(false);
      setValidationMessage('Enter a unique handle');
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setValidationMessage('');

    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailable(clean);
      if (!active) return;
      setIsChecking(false);
      if (res.available) {
        setIsValid(true);
        setValidationMessage(`@${clean} is available`);
      } else {
        setIsValid(false);
        setValidationMessage(res.reason || 'This handle is not available');
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username, checkUsernameAvailable]);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const toggleSource = (source: 'news' | 'x' | 'instagram' | 'facebook') => {
    if (selectedSources.includes(source)) {
      if (selectedSources.length === 1) return; // Must keep at least 1
      setSelectedSources(selectedSources.filter((s) => s !== source));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const handleFinishOnboarding = async () => {
    if (selectedTopics.length < 3 || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await completeOnboarding({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim() || username.trim(),
        bio: bio.trim(),
        avatarUrl,
        interests: selectedTopics,
        preferredSources: selectedSources,
      });
    } catch (err: unknown) {
      console.error('Error completing onboarding:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save User Profile. Please try again.';
      setSubmissionError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between items-center px-4 py-8 select-none relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-neutral-800/15 via-transparent to-transparent pointer-events-none blur-3xl" />

      {/* Top Header */}
      <div className="w-full max-w-[440px] flex items-center justify-between z-10">
        <div>
          <span className="text-xl font-light tracking-[0.35em] text-white uppercase">
            FLUID
          </span>
          <div className="text-[9px] tracking-[0.25em] uppercase text-neutral-500 font-mono">
            BY ECHO INTELLIGENCE
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 active:scale-95 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Switch Account</span>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="w-full max-w-[440px] my-auto py-6 z-10">
        <div className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-neutral-800/60 text-[10px] font-mono tracking-wider uppercase">
            <span className={step === 1 ? 'text-white font-semibold' : 'text-neutral-500'}>
              1. Handle
            </span>
            <div className="flex-1 h-px bg-neutral-800" />
            <span className={step === 2 ? 'text-white font-semibold' : 'text-neutral-500'}>
              2. Interests (3+)
            </span>
            <div className="flex-1 h-px bg-neutral-800" />
            <span className={step === 3 ? 'text-white font-semibold' : 'text-neutral-500'}>
              3. Sources
            </span>
          </div>

          {/* STEP 1: Handle & Profile Details */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1.5 text-center">
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  Claim your User ID
                </h1>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-[340px] mx-auto">
                  Your distinct identifier across Fluid and the ECHO social graph.
                </p>
              </div>

              {/* Avatar Preview & Customizer */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-900 shadow-lg">
                    <img
                      src={avatarUrl}
                      alt={displayName || 'Avatar'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newUrl = prompt('Paste image URL for your avatar:', avatarUrl);
                      if (newUrl && newUrl.trim()) {
                        setAvatarUrl(newUrl.trim());
                      }
                    }}
                    title="Change Avatar URL"
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center border-2 border-black hover:scale-105 active:scale-90 transition-transform shadow-md cursor-pointer"
                  >
                    <Camera className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
                <span className="text-[11px] text-neutral-400">
                  {firebaseUser?.email || 'Authenticated Creator'}
                </span>
              </div>

              <div className="space-y-4">
                {/* User ID / Handle Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                    <span>User ID / Handle *</span>
                    <span className="text-[10px] text-neutral-500 font-sans">3-20 chars</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-neutral-500 text-sm font-semibold select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
                        setUsername(cleaned);
                      }}
                      placeholder="your.handle"
                      autoFocus
                      required
                      maxLength={20}
                      className={`w-full bg-[#18181A] border rounded-xl pl-8 pr-10 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                        isChecking
                          ? 'border-neutral-700'
                          : isValid
                          ? 'border-emerald-500/80 focus:border-emerald-500'
                          : username
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-neutral-800 focus:border-neutral-600'
                      }`}
                    />
                    <div className="absolute right-3 flex items-center">
                      {isChecking ? (
                        <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                      ) : isValid ? (
                        <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                      ) : username ? (
                        <X className="w-4 h-4 text-rose-400 stroke-[2.5]" />
                      ) : null}
                    </div>
                  </div>
                  <div className="text-[11px] min-h-[16px] px-1 text-neutral-400">
                    <span className={isValid ? 'text-emerald-400 font-medium' : username ? 'text-rose-400' : 'text-neutral-500'}>
                      {validationMessage}
                    </span>
                  </div>
                </div>

                {/* Display Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Public Name"
                    required
                    maxLength={40}
                    className="w-full bg-[#18181A] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                  />
                </div>

                {/* Bio Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                    <span>Bio</span>
                    <span className="text-[10px] text-neutral-500 font-sans">{bio.length}/150</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 150))}
                    rows={2}
                    placeholder="Visual director, architectural photographer..."
                    className="w-full bg-[#18181A] border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  disabled={!isValid || isChecking}
                  onClick={() => setStep(2)}
                  className="w-full h-11 bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-100 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg cursor-pointer mt-2"
                >
                  <span>Continue to Interests</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select 3+ Interest Topics */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-mono uppercase tracking-wider">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Choose 3+ Interests ({selectedTopics.length} selected)</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  Curate your Feed DNA
                </h1>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-[340px] mx-auto">
                  Fluid's For You algorithm uses your selections to ground live stories and recommend relevant creators.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {AVAILABLE_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.97] cursor-pointer ${
                        isSelected
                          ? 'bg-white text-black border-white font-medium shadow-md'
                          : 'bg-[#18181A] border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{topic}</span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-black stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-neutral-700" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 h-11 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs rounded-xl font-medium active:scale-95 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={selectedTopics.length < 3}
                  onClick={() => setStep(3)}
                  className="flex-1 h-11 bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-100 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg cursor-pointer"
                >
                  <span>Select External Sources</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preferred External Sources */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-sky-400 font-mono uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5" />
                  <span>External Pulse Sources</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  Live Grounding Sources
                </h1>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-[340px] mx-auto">
                  Select which platforms Gemini Search Grounding will index for your real-time Pulse stream.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {AVAILABLE_SOURCES.map((source) => {
                  const isSelected = selectedSources.includes(source.id);
                  return (
                    <div
                      key={source.id}
                      onClick={() => toggleSource(source.id)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'bg-neutral-900/90 border-neutral-700 text-white'
                          : 'bg-[#18181A] border-neutral-800/80 text-neutral-400 opacity-60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          <span>{source.label}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400">{source.desc}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-white text-black border-white'
                            : 'border-neutral-700 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {submissionError && (
                <div className="p-3 bg-rose-950/60 border border-rose-900/80 rounded-xl text-rose-300 text-xs">
                  {submissionError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 h-11 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs rounded-xl font-medium active:scale-95 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || selectedSources.length === 0}
                  onClick={handleFinishOnboarding}
                  className="flex-1 h-11 bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-100 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Fluid Community</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="text-center space-y-1 z-10 pt-2 select-none">
        <div className="text-[9px] tracking-[0.25em] uppercase text-neutral-500 font-mono">
          FROM
        </div>
        <div className="text-xs font-semibold tracking-[0.18em] text-neutral-300 uppercase">
          ECHO INTELLIGENCE
        </div>
        <div className="text-[10px] text-neutral-600">
          Real-User Social Platform · v2.5
        </div>
      </footer>
    </div>
  );
};
