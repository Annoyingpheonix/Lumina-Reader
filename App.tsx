
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Book, User } from './types';
import { MOCK_USER, INITIAL_STORE_BOOKS } from './constants';
import { Reader } from './views/Reader';
import { Library } from './views/Library';
import { Store } from './views/Store';
import { Social } from './views/Social';
import { Profile } from './views/Profile';
import { 
  BookOpen, ShoppingBag, Users, User as UserIcon, Search, 
  X, CheckCircle, AlertCircle, Info, Command, ArrowRight, 
  Sparkles, Shield, Zap
} from 'lucide-react';

// --- Toast Component ---
interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgClass = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

    return (
        <div className={`fixed bottom-24 right-6 sm:bottom-6 sm:right-6 z-[100] ${bgClass} text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4`}>
            <Icon size={20} />
            <p className="text-sm font-medium">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={16} /></button>
        </div>
    );
};

// --- Command Palette Component ---
const CommandPalette: React.FC<{ 
  books: Book[], 
  onClose: () => void, 
  onSelect: (b: Book) => void,
  themeColor: string
}> = ({ books, onClose, onSelect, themeColor }) => {
  const [query, setQuery] = useState('');
  
  const filtered = useMemo(() => {
    if (!query) return [];
    return books.filter(b => 
      b.title.toLowerCase().includes(query.toLowerCase()) || 
      b.author.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }, [query, books]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-start justify-center pt-12 md:pt-24 px-4" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <Search size={20} className="text-slate-400" />
          <input 
            autoFocus
            type="text" 
            placeholder="Search everything..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-base md:text-lg text-slate-800 dark:text-white"
          />
          <button onClick={onClose} className="md:hidden p-1"><X size={20} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {query && filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400 italic">No results found for "{query}"</div>
          )}
          {filtered.map(book => (
            <button 
              key={book.id}
              onClick={() => onSelect(book)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors border-b border-slate-50 dark:border-slate-800 last:border-none"
            >
              <img src={book.coverUrl} className="w-8 h-12 md:w-10 md:h-14 object-cover rounded shadow-sm" alt={book.title} />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-800 dark:text-white truncate">{book.title}</div>
                <div className="text-xs text-slate-500 truncate">{book.author}</div>
              </div>
            </button>
          ))}
          {!query && (
            <div className="p-8 text-center text-slate-400">
              <div className="flex justify-center gap-6 mb-4">
                <div className="flex flex-col items-center gap-1">
                  <BookOpen size={24} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Library</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShoppingBag size={24} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Store</span>
                </div>
              </div>
              <p className="text-xs md:text-sm">Type to search library and store.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lumina_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [library, setLibrary] = useState<Book[]>(() => {
    const saved = localStorage.getItem('lumina_library');
    return saved ? JSON.parse(saved) : [INITIAL_STORE_BOOKS[0]];
  });

  const [currentView, setCurrentView] = useState<'library' | 'store' | 'social' | 'profile' | 'reader'>('library');
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('lumina_theme');
    return saved ? JSON.parse(saved) : { blueLightFilter: false, darkMode: false, primaryColor: 'indigo' };
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsCommandOpen(false);
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('lumina_user', JSON.stringify(user));
    localStorage.setItem('lumina_library', JSON.stringify(library));
    localStorage.setItem('lumina_theme', JSON.stringify(theme));
    if (theme.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [user, library, theme]);

  const handleBookSelect = (book: Book) => {
    const updatedBook = { ...book, lastRead: Date.now() };
    setLibrary(lib => lib.map(b => b.id === book.id ? updatedBook : b));
    setActiveBook(updatedBook);
    setCurrentView('reader');
    setIsCommandOpen(false);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setLibrary(lib => lib.map(b => b.id === updatedBook.id ? updatedBook : b));
    setActiveBook(updatedBook);
  };

  const themeColor = theme.primaryColor || 'indigo';

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 font-sans">
        <div className={`w-20 h-20 bg-${themeColor}-600 rounded-3xl flex items-center justify-center shadow-2xl mb-8 animate-bounce`}>
          <BookOpen className="text-white" size={40} />
        </div>
        <h1 className="text-5xl font-bold tracking-tighter mb-4 text-slate-900 dark:text-white">Lumina</h1>
        <p className="text-lg md:text-xl text-slate-500 text-center max-w-md mb-12">The world's most intelligent reading companion. Powered by Gemini.</p>
        <button 
          onClick={() => setUser(MOCK_USER)}
          className={`w-full max-w-xs py-4 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-full font-bold text-lg shadow-xl shadow-${themeColor}-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2`}
        >
          Get Started <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 relative overflow-hidden`}>
      <style>{`
        .mobile-bottom-nav {
           padding-bottom: env(safe-area-inset-bottom, 0.5rem);
        }
      `}</style>

      {theme.blueLightFilter && <div className="fixed inset-0 bg-amber-500/10 pointer-events-none z-[200] mix-blend-multiply" />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {isCommandOpen && (
        <CommandPalette 
          books={[...library, ...INITIAL_STORE_BOOKS]} 
          onClose={() => setIsCommandOpen(false)} 
          onSelect={handleBookSelect}
          themeColor={themeColor}
        />
      )}

      {/* Reader View Overlay */}
      {currentView === 'reader' && activeBook && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 animate-in slide-in-from-bottom duration-500">
          <Reader 
            book={activeBook} 
            onBack={() => setCurrentView('library')} 
            onUpdateProgress={(id, p) => {
               const updated = { ...activeBook, progress: p };
               handleUpdateBook(updated);
            }}
            onUpdateBook={handleUpdateBook}
            themeColor={themeColor}
          />
        </div>
      )}

      {/* Sidebar Nav (Desktop) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col fixed h-full z-10">
        <div className="p-8">
            <div className="flex items-center gap-3 mb-12">
                <div className={`w-8 h-8 bg-${themeColor}-600 rounded-lg flex items-center justify-center shadow-md`}>
                    <BookOpen className="text-white" size={18} />
                </div>
                <span className="font-bold text-2xl dark:text-white tracking-tighter">Lumina</span>
            </div>

            <nav className="space-y-2">
                {[
                    { id: 'library', icon: BookOpen, label: 'Library' },
                    { id: 'store', icon: ShoppingBag, label: 'Store' },
                    { id: 'social', icon: Users, label: 'Community' },
                    { id: 'profile', icon: UserIcon, label: 'Profile' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id as any)}
                        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${
                            currentView === item.id 
                                ? `bg-${themeColor}-50 dark:bg-${themeColor}-900/20 text-${themeColor}-600 dark:text-${themeColor}-400 font-bold` 
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <item.icon size={22} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>

        <button 
          onClick={() => setIsCommandOpen(true)}
          className="mx-6 mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
        >
          <Search size={18} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Search...</span>
          <div className="ml-auto text-[9px] font-bold opacity-30 tracking-tight">⌘ K</div>
        </button>

        <div className="mt-auto p-8 border-t border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <img src={user.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                <div className="overflow-hidden">
                    <div className="text-sm font-bold truncate dark:text-white">{user.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Standard
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-0 pb-20 md:pb-0 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {currentView === 'library' && (
                <Library 
                    books={library} 
                    onSelectBook={handleBookSelect} 
                    onUpload={(d) => setLibrary([...library, { ...d, id: Date.now().toString(), progress: 0, rating: 0, reviews: [], totalPages: 100 } as any])} 
                    onUpdateBook={(b) => setLibrary(lib => lib.map(bl => bl.id === b.id ? b : bl))}
                    onAddReview={() => {}}
                    onDelete={(id) => setLibrary(lib => lib.filter(b => b.id !== id))}
                    themeColor={themeColor}
                />
            )}
            {currentView === 'store' && <Store books={INITIAL_STORE_BOOKS} onPurchase={(b) => { setLibrary([...library, b]); setToast({message: "Added to Library!", type: "success"}); }} themeColor={themeColor} />}
            {currentView === 'social' && <Social user={user} books={INITIAL_STORE_BOOKS} themeColor={themeColor} />}
            {currentView === 'profile' && (
                <Profile 
                    user={user} 
                    onLogout={() => setUser(null)}
                    theme={theme}
                    themeColor={themeColor}
                    onToggleTheme={(k) => setTheme(t => ({ ...t, [k]: !t[k] }))}
                    onUpdateColor={(c) => setTheme(t => ({ ...t, primaryColor: c }))}
                    onUpdateUser={(u) => setUser(u)}
                />
            )}
          </div>
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-40 flex justify-around p-3 mobile-bottom-nav">
        {[
            { id: 'library', icon: BookOpen },
            { id: 'store', icon: ShoppingBag },
            { id: 'social', icon: Users },
            { id: 'profile', icon: UserIcon },
        ].map(item => (
            <button 
                key={item.id} 
                onClick={() => setCurrentView(item.id as any)}
                className={`p-2.5 rounded-2xl transition-all active:scale-90 ${currentView === item.id ? `text-${themeColor}-600 bg-${themeColor}-50 dark:bg-${themeColor}-900/30` : 'text-slate-400'}`}
            >
                <item.icon size={22} />
            </button>
        ))}
        <button onClick={() => setIsCommandOpen(true)} className="p-2.5 text-slate-400 active:scale-90"><Search size={22} /></button>
      </nav>
    </div>
  );
};

export default App;
