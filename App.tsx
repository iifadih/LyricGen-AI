
import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Sparkles, 
  Globe, 
  Type as FontIcon, 
  Loader2, 
  Image as ImageIcon, 
  ExternalLink, 
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Download
} from 'lucide-react';
import { Language, SongData, GeneratedAsset } from './types';
import * as gemini from './services/geminiService';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(Language.Arabic);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [song, setSong] = useState<SongData | null>(null);
  const [cover, setCover] = useState<GeneratedAsset | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const has = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(has);
    } catch (error) {
      console.error("Error checking API key status", error);
    }
  };

  const handleOpenKeyPicker = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    } catch (error) {
      console.error("Error opening key picker", error);
    }
  };

  const handleGenerateSong = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSong(null);
    setCover(null);
    try {
      const data = await gemini.generateSong(topic, language, useSearch);
      setSong(data);
      setCover({ type: 'image', url: '', loading: true });
      const imageUrl = await gemini.generateCoverImage(data.imagePrompt);
      setCover({ type: 'image', url: imageUrl, loading: false });
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please check your topic or try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = async () => {
    if (!cover?.url || !editPrompt) return;
    setCover(prev => prev ? { ...prev, loading: true } : null);
    try {
      const newUrl = await gemini.editImage(cover.url, editPrompt);
      setCover({ type: 'image', url: newUrl, loading: false });
      setEditMode(false);
      setEditPrompt('');
    } catch (e) {
      setCover(prev => prev ? { ...prev, loading: false, error: 'Failed to edit image' } : null);
    }
  };

  const handleDownloadImage = () => {
    if (!cover?.url) return;
    const link = document.createElement('a');
    link.href = cover.url;
    link.download = `${song?.title.replace(/\s+/g, '-').toLowerCase() || 'song-cover'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFormattedLyrics = (lyrics: string) => {
    if (!lyrics) return null;
    const sections = lyrics.split(/\n\n+/);
    
    return sections.map((section, idx) => {
      const lines = section.split('\n');
      const firstLine = lines[0].trim();
      
      const isHeader = firstLine.startsWith('[') && firstLine.endsWith(']');
      const headerText = isHeader ? firstLine.replace(/[\[\]]/g, '') : null;
      const contentLines = isHeader ? lines.slice(1) : lines;

      return (
        <div key={idx} className="mb-10 last:mb-0 group/section relative">
          {headerText && (
            <div className={`mb-4 flex ${language === Language.Arabic ? 'justify-end' : 'justify-start'}`}>
              <span className="px-4 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-[0.3em] border border-violet-500/20 rounded-md shadow-sm">
                {headerText}
              </span>
            </div>
          )}
          <div 
            className={`space-y-3 ${language === Language.Arabic ? 'text-right font-arabic' : 'text-left'} transition-all duration-500`}
          >
            {contentLines.map((line, lIdx) => (
              <p key={lIdx} className="text-zinc-200 text-xl lg:text-2xl font-medium leading-relaxed tracking-tight">
                {line}
              </p>
            ))}
          </div>
          <div className={`absolute -inset-y-2 w-[2px] bg-violet-500/20 opacity-0 group-hover/section:opacity-100 transition-opacity ${language === Language.Arabic ? '-right-6' : '-left-6'}`} />
        </div>
      );
    });
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-violet-500/20">
            <ShieldCheck className="w-10 h-10 text-violet-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Access Restricted</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              To use SongCraft AI, please select a paid Google Cloud Project API key to enable high-quality generation.
            </p>
          </div>
          <button
            onClick={handleOpenKeyPicker}
            className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-600/20"
          >
            Authenticate Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 pb-20 overflow-x-hidden">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-zinc-800/50 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-600/20">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              SONGCRAFT AI
            </h1>
          </div>
          <button 
            onClick={handleOpenKeyPicker}
            className="group flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all text-xs font-semibold"
          >
            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
            Key Config
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <section className="lg:col-span-4 space-y-8">
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-8 rounded-[2rem] space-y-8 backdrop-blur-sm shadow-xl">
            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Language (Mandatory)
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-medium focus:ring-2 focus:ring-violet-500 outline-none appearance-none transition-all cursor-pointer"
                >
                  {Object.values(Language).map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <FontIcon className="w-3.5 h-3.5" /> Story / Topic
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What story should this song tell?"
                className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder-zinc-700 focus:ring-2 focus:ring-violet-500 outline-none resize-none transition-all leading-relaxed"
              />
            </div>

            <button
              onClick={() => setUseSearch(!useSearch)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                useSearch ? 'bg-violet-600/10 border-violet-500/50 text-violet-100' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${useSearch ? 'bg-violet-500 text-white' : 'bg-zinc-900'}`}>
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Search Grounding</p>
                  <p className="text-[10px] opacity-60">Use facts from the web</p>
                </div>
              </div>
              <CheckCircle2 className={`w-5 h-5 transition-opacity ${useSearch ? 'opacity-100' : 'opacity-0'}`} />
            </button>

            <button
              onClick={handleGenerateSong}
              disabled={loading || !topic.trim()}
              className="group w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-violet-900/20 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
              Generate Song
            </button>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-12">
          {!song && !loading && (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-zinc-800/50 rounded-[3rem] p-12 bg-zinc-900/10 backdrop-blur-sm">
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center ring-1 ring-zinc-800 shadow-inner">
                <Music className="w-10 h-10 text-zinc-700" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-zinc-300">Start Your Composition</h2>
                <p className="text-zinc-600 max-w-sm mx-auto leading-relaxed">Choose a language and tell your story to generate professional lyrics and cover art.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center space-y-8 text-center bg-zinc-900/5 rounded-[3rem] border border-zinc-800/30">
              <div className="relative">
                <div className="w-28 h-28 border-[3px] border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
                <Music className="w-10 h-10 text-violet-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white">Composing...</h3>
                <p className="text-zinc-500 font-medium">Harmonizing lyrics, structure, and artistic vision.</p>
              </div>
            </div>
          )}

          {song && (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000">
              <div className="space-y-6">
                <div className="inline-flex gap-2">
                  {song.styles.map((style, i) => (
                    <span key={i} className="px-3 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/20">
                      {style}
                    </span>
                  ))}
                </div>
                <h2 className={`text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none ${language === Language.Arabic ? 'font-arabic text-right' : ''}`}>
                  {song.title}
                </h2>
                <p className="text-xl text-zinc-500 leading-relaxed font-medium italic">
                  "{song.moodDescription}"
                </p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-b from-violet-600/10 to-transparent rounded-[3rem] blur-xl opacity-30 transition-opacity group-hover:opacity-60" />
                <div className="relative bg-zinc-900/40 border border-zinc-800/60 rounded-[3rem] p-10 lg:p-20 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Music className="w-32 h-32" />
                  </div>
                  
                  <div className="relative z-10">
                    {renderFormattedLyrics(song.lyrics)}
                  </div>
                </div>
              </div>

              {song.groundingSources && song.groundingSources.length > 0 && (
                <div className="space-y-5 p-8 bg-blue-500/5 rounded-[2rem] border border-blue-500/10">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Research Sources
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {song.groundingSources.map((source: any, i: number) => (
                      <a
                        key={i}
                        href={source.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-400 text-xs hover:text-white hover:bg-zinc-800 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {source.web.title || 'Referenced Source'}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Cinematic Cover Art (16:9)
                    </h4>
                    {cover?.url && (
                      <button 
                        onClick={handleDownloadImage}
                        className="flex items-center gap-2 text-[10px] font-black uppercase text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <Download className="w-3 h-3" /> Download Image
                      </button>
                    )}
                  </div>
                  <div className="aspect-[16/9] bg-zinc-950 rounded-[2rem] overflow-hidden border border-zinc-800 relative group shadow-2xl">
                    {cover?.loading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-10 gap-3">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Painting...</span>
                      </div>
                    ) : cover?.url ? (
                      <>
                        <img src={cover.url} alt="Song Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 flex gap-3">
                          <button 
                            onClick={() => setEditMode(true)}
                            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl border border-white/20 backdrop-blur-xl transition-all"
                          >
                            Refine Wide Image
                          </button>
                          <button 
                            onClick={handleDownloadImage}
                            className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 backdrop-blur-xl transition-all"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                  
                  {editMode && (
                    <div className="animate-in slide-in-from-top-2 p-5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
                      <input 
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-violet-500"
                        placeholder="Add some rain, make it neon..."
                      />
                      <div className="flex gap-2">
                        <button onClick={handleEditImage} className="flex-1 py-3 bg-violet-600 text-white font-bold text-[10px] uppercase rounded-lg">Apply</button>
                        <button onClick={() => setEditMode(false)} className="flex-1 py-3 bg-zinc-800 text-zinc-500 font-bold text-[10px] uppercase rounded-lg">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
