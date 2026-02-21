
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Book, VoiceName, ChatMessage, Bookmark } from '../types';
import { generateSpeech, decodePCM, decodeAudioData, encodePCM, analyzeText } from '../services/ai';
import { 
  Play, Pause, MessageSquare, ArrowLeft, Loader2, Sparkles, Volume2, Share2, 
  Check, Bookmark as BookmarkIcon, Trash2, X, Plus, List, Lock, Zap, Search, 
  Edit2, Save, Type, Sun, Moon, Coffee, ChevronsUpDown, Maximize2, Minimize2, 
  Mic, MicOff, BookOpen, VolumeX, EyeOff, Eye, Hash, Info, FileText, FastForward, Timer,
  ChevronLeft, Flag
} from 'lucide-react';

interface ReaderProps {
  book: Book;
  onBack: () => void;
  onUpdateProgress: (bookId: string, progress: number) => void;
  onUpdateBook: (book: Book) => void;
  themeColor: string;
}

const BASE_WPM = 180; // Standard reading speed at 1.0x rate

export const Reader: React.FC<ReaderProps> = ({ book, onBack, onUpdateProgress, onUpdateBook, themeColor }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [menuTab, setMenuTab] = useState<'chapters' | 'bookmarks'>('chapters');
  
  // Voice State - Default to TRUE for AI Voice
  const [useAiVoice, setUseAiVoice] = useState(() => {
    const stored = localStorage.getItem('lumina_reader_use_ai');
    return stored !== null ? stored === 'true' : true; 
  });
  
  const [selectedAiVoice, setSelectedAiVoice] = useState(() => localStorage.getItem('lumina_reader_ai_voice') || 'Puck');
  
  // Speed State (stored as WPM)
  const [wpm, setWpm] = useState(() => parseInt(localStorage.getItem('lumina_reader_wpm') || '180'));
  const rate = useMemo(() => wpm / BASE_WPM, [wpm]);

  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Reader Settings
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'parchment' | 'dark'>(() => (localStorage.getItem('lumina_reader_theme') as any) || 'light');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('lumina_font_size') || '20'));
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>(() => (localStorage.getItem('lumina_font_family') as any) || 'serif');
  const [lineHeight, setLineHeight] = useState(() => parseFloat(localStorage.getItem('lumina_line_height') || '1.8'));
  const [pageWidth, setPageWidth] = useState(() => localStorage.getItem('lumina_page_width') || 'max-w-3xl');
  const [showSettings, setShowSettings] = useState(false);

  // Feature States
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [chapterSummaries, setChapterSummaries] = useState<Record<number, string>>({});
  const [isSummarizing, setIsSummarizing] = useState<number | null>(null);

  // Live Buddy State
  const [isBuddyActive, setIsBuddyActive] = useState(false);
  const [isBuddyListening, setIsBuddyListening] = useState(false);
  const [buddyStatus, setBuddyStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const buddyAudioContextRef = useRef<AudioContext | null>(null);
  const buddyStreamRef = useRef<MediaStream | null>(null);
  const buddySessionRef = useRef<any>(null);
  const buddyNextStartTimeRef = useRef(0);
  const buddySourcesSet = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);

  // Parsing
  const { words, blocks } = useMemo(() => {
    const flatWords: string[] = [];
    const parsedBlocks: any[] = [];
    const rawParas = book.content.split(/\n\s*\n/);
    let currentIndex = 0;

    rawParas.forEach((para) => {
        const pWords = para.trim().split(/\s+/);
        if (pWords.length > 0) {
            parsedBlocks.push({ type: 'text', content: pWords, startIndex: currentIndex });
            flatWords.push(...pWords);
            currentIndex += pWords.length;
        }
    });

    return { words: flatWords, blocks: parsedBlocks };
  }, [book.content]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const results: number[] = [];
    words.forEach((word, idx) => {
      if (word.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push(idx);
      }
    });
    setSearchResults(results.slice(0, 50));
  }, [searchQuery, words]);

  // Handle Live Playback Rate Update
  useEffect(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.playbackRate.value = rate;
    }
  }, [rate]);

  // Auto-scroll active word into view
  useEffect(() => {
    if (activeWordIndex > 0 && isPlaying) {
      const element = document.getElementById(`word-${activeWordIndex}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const inView = rect.top >= window.innerHeight * 0.3 && rect.bottom <= window.innerHeight * 0.7;
        if (!inView) {
             element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activeWordIndex, isPlaying]);

  const handleChapterSummarize = async (blockIdx: number) => {
    setIsSummarizing(blockIdx);
    const block = blocks[blockIdx];
    const text = block.content.join(' ');
    const summary = await analyzeText(text, "Please provide a concise, engaging 2-sentence summary of this passage.");
    setChapterSummaries(prev => ({ ...prev, [blockIdx]: summary }));
    setIsSummarizing(null);
  };

  const toggleBookmark = () => {
    const existingIndex = (book.bookmarks || []).findIndex(b => b.wordIndex === activeWordIndex);
    let newBookmarks = [...(book.bookmarks || [])];
    
    if (existingIndex !== -1) {
      newBookmarks.splice(existingIndex, 1);
    } else {
      const preview = words.slice(activeWordIndex, activeWordIndex + 8).join(' ') + '...';
      newBookmarks.push({
        id: Date.now().toString(),
        wordIndex: activeWordIndex,
        previewText: preview,
        createdAt: Date.now()
      });
      newBookmarks.sort((a, b) => a.wordIndex - b.wordIndex);
    }
    onUpdateBook({ ...book, bookmarks: newBookmarks });
  };

  // Sync index on mount
  useEffect(() => {
    const savedIndex = Math.floor((book.progress / 100) * words.length) || 0;
    setActiveWordIndex(savedIndex);
  }, [book.id, words.length]);

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('lumina_reader_wpm', wpm.toString());
    localStorage.setItem('lumina_reader_ai_voice', selectedAiVoice);
    localStorage.setItem('lumina_reader_use_ai', String(useAiVoice));
    localStorage.setItem('lumina_reader_theme', readerTheme);
    localStorage.setItem('lumina_font_size', fontSize.toString());
    localStorage.setItem('lumina_font_family', fontFamily);
    localStorage.setItem('lumina_line_height', lineHeight.toString());
    localStorage.setItem('lumina_page_width', pageWidth);
  }, [wpm, selectedAiVoice, useAiVoice, readerTheme, fontSize, fontFamily, lineHeight, pageWidth]);

  // --- Voice Buddy (Gemini Live API) ---
  const toggleBuddy = async () => {
    if (isBuddyActive) stopBuddy();
    else startBuddy();
  };

  const stopBuddy = () => {
    setIsBuddyActive(false);
    setIsBuddyListening(false);
    setBuddyStatus('idle');
    if (buddySessionRef.current) buddySessionRef.current.close();
    if (buddyStreamRef.current) buddyStreamRef.current.getTracks().forEach(t => t.stop());
    buddySourcesSet.current.forEach(s => s.stop());
    buddySourcesSet.current.clear();
  };

  const startBuddy = async () => {
    try {
      setBuddyStatus('listening');
      setIsBuddyActive(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      buddyStreamRef.current = stream;
      if (!buddyAudioContextRef.current) buddyAudioContextRef.current = new AudioContext();
      const outCtx = buddyAudioContextRef.current;
      const inCtx = new AudioContext({ sampleRate: 16000 });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are a Reading Buddy for the book "${book.title}". Context: "${words.slice(activeWordIndex, activeWordIndex + 300).join(' ')}"`
        },
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const processor = inCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encodePCM(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(processor);
            processor.connect(inCtx.destination);
            setIsBuddyListening(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64) {
              setBuddyStatus('speaking');
              buddyNextStartTimeRef.current = Math.max(buddyNextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decodePCM(base64), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.start(buddyNextStartTimeRef.current);
              buddyNextStartTimeRef.current += audioBuffer.duration;
              buddySourcesSet.current.add(source);
              source.onended = () => {
                buddySourcesSet.current.delete(source);
                if (buddySourcesSet.current.size === 0) setBuddyStatus('idle');
              };
            }
          }
        }
      });
      buddySessionRef.current = await sessionPromise;
    } catch (err) { console.error(err); stopBuddy(); }
  };

  const stopAllPlayback = () => {
    window.speechSynthesis.cancel();
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
    setIsBuffering(false);
  };

  const togglePlay = () => {
    if (isPlaying) stopAllPlayback();
    else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      if (useAiVoice) playAiVoiceLoop();
      else playBrowserVoice();
    }
  };

  const playBrowserVoice = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(words.slice(activeWordIndex).join(' '));
    utterance.rate = rate;
    utterance.onboundary = (e) => {
      if (e.name === 'word') setActiveWordIndex(prev => prev + 1);
    };
    window.speechSynthesis.speak(utterance);
  };

  const getNextTextChunk = (startIndex: number, wordList: string[]) => {
    if (startIndex >= wordList.length) return null;
    let endIndex = startIndex;
    const minWords = 15;
    const maxWords = 60;
    let wordsInChunk = 0;
    for (let i = startIndex; i < wordList.length; i++) {
        wordsInChunk++;
        const word = wordList[i];
        const isTerminator = /[.!?]"?$/.test(word);
        if (wordsInChunk >= minWords && isTerminator) {
            endIndex = i + 1;
            break;
        }
        if (wordsInChunk >= maxWords) {
            endIndex = i + 1;
            break;
        }
    }
    if (endIndex === startIndex && startIndex < wordList.length) {
        endIndex = Math.min(startIndex + minWords, wordList.length);
    }
    return {
        text: wordList.slice(startIndex, endIndex).join(' '),
        length: endIndex - startIndex
    };
  };

  const playAiVoiceLoop = async () => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    let currentIdx = activeWordIndex;
    let nextChunkInfo = getNextTextChunk(currentIdx, words);
    if (!nextChunkInfo) return;
    setIsBuffering(true);
    let nextAudioPromise: Promise<string | undefined | null> = generateSpeech(nextChunkInfo.text, selectedAiVoice);

    try {
      while (isPlayingRef.current && currentIdx < words.length) {
        const base64 = await nextAudioPromise;
        setIsBuffering(false);
        if (!base64 || !isPlayingRef.current) break;

        const currentChunkLen = nextChunkInfo!.length;
        const nextIdx = currentIdx + currentChunkLen;
        nextChunkInfo = getNextTextChunk(nextIdx, words);
        
        if (nextChunkInfo) {
            nextAudioPromise = generateSpeech(nextChunkInfo.text, selectedAiVoice);
        } else {
            nextAudioPromise = Promise.resolve(null);
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        const buffer = await decodeAudioData(decodePCM(base64), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = rate;
        source.connect(ctx.destination);
        audioSourceRef.current = source;

        const startTime = ctx.currentTime;
        source.start(startTime);
        
        const duration = buffer.duration / rate;

        await new Promise<void>((resolve) => {
            let rafId: number;
            const animateProgress = () => {
                if (!isPlayingRef.current) {
                    cancelAnimationFrame(rafId);
                    source.stop();
                    resolve();
                    return;
                }
                const elapsed = ctx.currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const offset = Math.floor(progress * currentChunkLen);
                const visualIndex = currentIdx + offset;
                setActiveWordIndex((prev) => {
                    if (visualIndex > prev && visualIndex < nextIdx) {
                        return visualIndex;
                    }
                    return prev;
                });
                if (progress < 1) {
                    rafId = requestAnimationFrame(animateProgress);
                } else {
                    resolve();
                }
            };
            rafId = requestAnimationFrame(animateProgress);
            source.onended = () => {
                cancelAnimationFrame(rafId);
                resolve();
            };
        });

        if (!isPlayingRef.current) break;
        currentIdx = nextIdx;
        setActiveWordIndex(currentIdx);
      }
    } catch (e) { 
        console.error(e); 
        stopAllPlayback();
    }
  };

  const getThemeClasses = () => {
    switch (readerTheme) {
      case 'sepia': return 'bg-[#f4ecd8] text-[#5b4636] selection:bg-[#d5c4a1]';
      case 'parchment': return 'bg-[#f8f1e7] text-[#443322] parchment-texture shadow-inner selection:bg-[#e3d0b1]';
      case 'dark': return 'bg-slate-950 text-slate-300 selection:bg-indigo-900';
      default: return 'bg-white text-slate-900 selection:bg-indigo-100';
    }
  };

  const getFontStack = () => {
    switch(fontFamily) {
        case 'serif': return 'font-serif';
        case 'mono': return 'font-mono text-[0.9em]';
        default: return 'font-sans';
    }
  };

  return (
    <div className={`flex flex-col h-full transition-all duration-500 overflow-hidden relative ${getThemeClasses()}`}>
      <style>{`
        .parchment-texture {
          background-image: url('https://www.transparenttextures.com/patterns/old-mathematics.png');
          background-blend-mode: multiply;
        }
        .buddy-pulse { animation: buddy-pulse 2s infinite ease-in-out; }
        @keyframes buddy-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; filter: blur(4px); }
          50% { transform: scale(1.1); opacity: 1; filter: blur(0px); }
        }
        .reader-header {
           padding-top: env(safe-area-inset-top, 1rem);
        }
        .reader-footer {
           padding-bottom: env(safe-area-inset-bottom, 1rem);
        }
        /* Highlight Transition */
        .word-highlight {
           transition: background-color 0.15s ease, color 0.15s ease;
           border-radius: 4px;
        }
      `}</style>

      {/* Header */}
      {!focusMode && (
        <div className={`flex items-center justify-between px-4 pb-4 border-b z-20 backdrop-blur-md reader-header transition-colors duration-300 ${readerTheme === 'dark' ? 'border-white/10' : 'border-black/5'}`}>
          <div className="flex items-center gap-3">
            <button 
                onClick={onBack} 
                className={`flex items-center gap-2 pr-4 pl-2 py-2 rounded-full transition-colors ${readerTheme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-slate-900'}`}
            >
                <ChevronLeft size={24} />
                <span className="font-medium text-sm hidden md:block">Back</span>
            </button>
            <div className="h-6 w-px bg-current opacity-20"></div>
            <h2 className="font-serif font-bold text-xs md:text-sm truncate max-w-[150px] md:max-w-md opacity-90">{book.title}</h2>
          </div>
          <div className="flex items-center gap-1 md:gap-3">
            <button 
              onClick={() => setShowSearch(!showSearch)} 
              className={`p-2 rounded-full hover:opacity-70 transition-colors ${showSearch ? `text-${themeColor}-500 bg-${themeColor}-50/10` : 'opacity-60'}`}
              title="Search Text"
            >
              <Search size={20} />
            </button>
            <button 
              onClick={toggleBookmark}
              className={`p-2 rounded-full hover:opacity-70 transition-colors ${(book.bookmarks || []).some(b => b.wordIndex === activeWordIndex) ? `text-${themeColor}-500 fill-current` : 'opacity-60'}`}
              title="Bookmark Current Location"
            >
              <BookmarkIcon size={20} fill={(book.bookmarks || []).some(b => b.wordIndex === activeWordIndex) ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={() => { setShowChapterMenu(true); setMenuTab('chapters'); }} 
              className="p-2 rounded-full hover:opacity-70 opacity-60 transition-colors"
              title="Table of Contents"
            >
              <List size={20} />
            </button>
            <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={`p-2 rounded-full hover:opacity-70 transition-colors ${showSettings ? `text-${themeColor}-500` : 'opacity-60'}`}
                title="Reading Settings"
            >
                <Type size={20} />
            </button>
            <button 
              onClick={toggleBuddy}
              className={`p-2 rounded-full transition-all flex items-center gap-2 ${isBuddyActive ? `bg-${themeColor}-600 text-white shadow-lg` : 'bg-black/5 dark:bg-white/5 opacity-80'}`}
              title="AI Reading Buddy"
            >
              <Mic size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Persistent Floating Back Button (Visible when Focus Mode or Scrolled) */}
      {focusMode && (
         <button 
            onClick={() => setFocusMode(false)}
            className="fixed top-6 left-6 p-3 bg-black/40 backdrop-blur-md text-white rounded-full z-50 hover:bg-black/60 transition-colors shadow-lg group"
            title="Exit Focus Mode"
         >
             <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
         </button>
      )}

      {/* Search Bar Overlay */}
      {showSearch && !focusMode && (
        <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 bg-white/50 dark:bg-black/20 backdrop-blur-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
              autoFocus
              type="text" 
              placeholder="Search words..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/5 dark:bg-white/10 rounded-full border-none outline-none text-sm placeholder-slate-500 text-current"
            />
          </div>
          <button onClick={() => {setShowSearch(false); setSearchQuery('');}}><X size={18} /></button>
        </div>
      )}

      {/* Reader Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative" onClick={() => setShowSettings(false)}>
        <div 
          ref={contentRef}
          className={`${pageWidth} mx-auto px-6 py-12 md:py-24 transition-all duration-300 ${getFontStack()}`}
          style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
        >
          {blocks.map((block, bIdx) => (
            <p key={bIdx} className="mb-6 md:mb-8 text-justify leading-relaxed">
              {block.content.map((word: string, wIdx: number) => {
                const globalIdx = block.startIndex + wIdx;
                const isMatch = searchQuery && word.toLowerCase().includes(searchQuery.toLowerCase());
                const isActive = globalIdx === activeWordIndex;
                const isBookmarked = (book.bookmarks || []).some(b => b.wordIndex === globalIdx);
                return (
                  <span 
                    key={globalIdx} 
                    id={`word-${globalIdx}`}
                    onClick={(e) => { e.stopPropagation(); setActiveWordIndex(globalIdx); }}
                    className={`word-highlight inline-block px-0.5 rounded-sm cursor-pointer relative
                      ${isActive ? `bg-${themeColor}-500/30 text-current font-medium transform scale-105` : ''}
                      ${isMatch ? 'bg-yellow-300 dark:bg-yellow-600/60 text-black dark:text-white' : ''}
                      ${isBookmarked ? `border-b-2 border-${themeColor}-500` : ''}
                    `}
                  >
                    {word}{' '}
                    {isBookmarked && <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 bg-${themeColor}-500 rounded-full`} />}
                  </span>
                );
              })}
            </p>
          ))}
        </div>

        {/* Live Buddy Status Indicator */}
        {isBuddyActive && (
          <div className="fixed bottom-24 md:bottom-32 right-6 md:right-8 z-50 flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-${themeColor}-400 to-purple-600 flex items-center justify-center shadow-2xl buddy-pulse relative cursor-pointer`} onClick={stopBuddy}>
               {buddyStatus === 'speaking' ? <Volume2 className="text-white" size={24} /> : <Sparkles className="text-white" size={24} />}
            </div>
          </div>
        )}

        {/* Exit Focus Mode FAB (Alternative Location) */}
        {focusMode && (
          <button onClick={() => setFocusMode(false)} className="fixed bottom-8 right-8 p-3 bg-black/50 backdrop-blur-md text-white rounded-full z-50 hover:bg-black/70 transition-all shadow-lg">
             <Minimize2 size={24} />
          </button>
        )}
      </div>

      {/* Chapter Menu Modal */}
      {showChapterMenu && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={() => setShowChapterMenu(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] md:max-h-[80vh] animate-in slide-in-from-bottom duration-300 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
               <h3 className="font-bold text-lg md:text-xl flex items-center gap-2 text-slate-900 dark:text-white"><List size={20} /> Menu</h3>
               <button onClick={() => setShowChapterMenu(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><X size={24} /></button>
            </div>
            
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button 
                onClick={() => setMenuTab('chapters')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${menuTab === 'chapters' ? `text-${themeColor}-600 border-b-2 border-${themeColor}-600` : 'text-slate-400 hover:text-slate-600'}`}
              >
                Chapters
              </button>
              <button 
                onClick={() => setMenuTab('bookmarks')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${menuTab === 'bookmarks' ? `text-${themeColor}-600 border-b-2 border-${themeColor}-600` : 'text-slate-400 hover:text-slate-600'}`}
              >
                Bookmarks ({book.bookmarks?.length || 0})
              </button>
            </div>

            {menuTab === 'chapters' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {blocks.map((block, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Section {i + 1}</span>
                      <button 
                        onClick={() => handleChapterSummarize(i)}
                        disabled={isSummarizing === i}
                        className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isSummarizing === i ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Summarize
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">"{block.content.slice(0, 50).join(' ')}..."</p>
                    {chapterSummaries[i] && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl text-xs leading-relaxed animate-in fade-in border border-indigo-100 dark:border-indigo-900">
                          {chapterSummaries[i]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(book.bookmarks || []).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <BookmarkIcon size={32} className="mb-2 opacity-20" />
                    <p className="text-sm italic">No bookmarks yet.</p>
                  </div>
                )}
                {((book.bookmarks || []) as Bookmark[]).map((bm) => (
                  <div 
                    key={bm.id} 
                    onClick={() => { setActiveWordIndex(bm.wordIndex); setShowChapterMenu(false); }} 
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-1">
                        <Flag size={10} />
                        Word {bm.wordIndex}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const newBookmarks = (book.bookmarks || []).filter(b => b.id !== bm.id);
                          onUpdateBook({ ...book, bookmarks: newBookmarks });
                        }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove Bookmark"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-serif italic text-slate-600 dark:text-slate-300 leading-relaxed">"{bm.previewText}"</p>
                    <div className="mt-2 text-[10px] text-slate-400 text-right">
                      {new Date(bm.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Controls */}
      {!focusMode && (
        <div className={`px-6 py-4 border-t z-20 backdrop-blur-xl reader-footer transition-colors duration-300 ${readerTheme === 'dark' ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-black/5'}`}>
          <div className="max-w-4xl mx-auto flex items-center gap-4 md:gap-6">
            <button 
                onClick={togglePlay} 
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg transition-all active:scale-95 bg-${themeColor}-600 text-white hover:bg-${themeColor}-700 ring-4 ring-${themeColor}-100 dark:ring-${themeColor}-900/30`}
            >
              {isBuffering ? <Loader2 size={24} className="animate-spin" /> : isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[10px] font-bold uppercase mb-2 opacity-60">
                <span className="truncate mr-2">Reading Progress</span>
                <span>{Math.round((activeWordIndex / words.length) * 100)}%</span>
              </div>
              <div 
                className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer group"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    setActiveWordIndex(Math.floor(ratio * words.length));
                }}
              >
                <div 
                    className={`h-full bg-${themeColor}-500 transition-all duration-300 relative`} 
                    style={{ width: `${(activeWordIndex / words.length) * 100}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-1.5" />
                </div>
              </div>
            </div>
            <button onClick={() => setFocusMode(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-all" title="Focus Mode">
                <Maximize2 size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel (Bottom Sheet on Mobile, Popover on Desktop) */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:justify-end md:pr-16 md:pb-16 pointer-events-none">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setShowSettings(false)} style={{pointerEvents: 'auto'}}></div>
           <div className="w-full max-w-lg md:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-slate-900 dark:text-white">Display & Audio</h3>
               <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-black/5 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              
              {/* Voice Settings */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Voice Engine</label>
                <div className="flex flex-col gap-3">
                    <button 
                    onClick={() => {
                        setUseAiVoice(!useAiVoice);
                    }}
                    className={`p-3 rounded-xl flex items-center justify-between border-2 transition-all ${useAiVoice ? `border-${themeColor}-500 bg-${themeColor}-50 dark:bg-${themeColor}-900/20` : 'border-slate-200 dark:border-slate-700'}`}
                    >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${useAiVoice ? `bg-${themeColor}-100 text-${themeColor}-600` : 'bg-slate-100 text-slate-500'}`}>
                            <Sparkles size={18} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-sm text-slate-900 dark:text-white">AI Neural Voice</div>
                            <div className="text-[10px] text-slate-500">Gemini 2.5 Flash TTS</div>
                        </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${useAiVoice ? `bg-${themeColor}-600` : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${useAiVoice ? 'translate-x-4' : ''}`} />
                    </div>
                    </button>

                    {useAiVoice && (
                    <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                        {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map((v) => (
                        <button 
                            key={v} 
                            onClick={() => setSelectedAiVoice(v)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold text-center border transition-all ${selectedAiVoice === v ? `bg-${themeColor}-600 text-white border-${themeColor}-600` : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            {v}
                        </button>
                        ))}
                    </div>
                    )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Narration Speed (WPM)</label>
                <div className="flex flex-col gap-3">
                  <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                    <div className={`absolute left-4 text-${themeColor}-500`}><Timer size={18} /></div>
                    <input 
                      type="number" 
                      value={wpm} 
                      onChange={(e) => setWpm(Math.max(50, Math.min(600, parseInt(e.target.value) || 180)))}
                      className="w-full pl-12 pr-16 py-3 bg-transparent border-none font-bold text-lg outline-none text-center"
                    />
                    <div className="absolute right-4 text-[10px] font-bold uppercase text-slate-400">WPM</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Relaxed', val: 130 },
                      { label: 'Standard', val: 180 },
                      { label: 'Speed', val: 250 }
                    ].map((p) => (
                      <button 
                        key={p.val}
                        onClick={() => setWpm(p.val)}
                        className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${wpm === p.val ? `bg-${themeColor}-600 text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Typography</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['serif', 'sans', 'mono'].map((f) => (
                    <button key={f} onClick={() => setFontFamily(f as any)} className={`py-2 rounded-xl text-xs capitalize border-2 transition-all ${fontFamily === f ? `border-${themeColor}-500 bg-${themeColor}-50 dark:bg-slate-800 dark:border-${themeColor}-500` : 'border-transparent bg-slate-100 dark:bg-slate-800'}`}>{f}</button>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                   <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-3 rounded-lg hover:bg-white dark:hover:bg-slate-700"><Minimize2 size={16} /></button>
                   <span className="font-bold text-sm">{fontSize}px</span>
                   <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="p-3 rounded-lg hover:bg-white dark:hover:bg-slate-700"><Maximize2 size={16} /></button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                      {id: 'light', bg: 'bg-white border-slate-200'}, 
                      {id: 'sepia', bg: 'bg-[#f4ecd8] border-[#e0d6c0]'}, 
                      {id: 'parchment', bg: 'bg-[#f8f1e7] border-[#e8dfd3]'}, 
                      {id: 'dark', bg: 'bg-slate-900 border-slate-700'}
                  ].map((t) => (
                    <button 
                        key={t.id} 
                        onClick={() => setReaderTheme(t.id as any)} 
                        className={`h-10 rounded-xl border-2 transition-all relative ${t.bg} ${readerTheme === t.id ? `ring-2 ring-${themeColor}-500 ring-offset-2` : ''}`}
                    >
                        {readerTheme === t.id && <div className={`absolute inset-0 flex items-center justify-center ${t.id === 'dark' ? 'text-white' : 'text-slate-900'}`}><Check size={16} /></div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
