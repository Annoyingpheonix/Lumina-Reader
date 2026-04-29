
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Book } from '../types';
import { ShoppingBag, Star, Search, X, Filter, Tag, BookOpen, ChevronRight, Check, Award, Clock, ExternalLink, Loader2, Globe, AlertCircle } from 'lucide-react';

interface StoreProps {
  books: Book[];
  onPurchase: (book: Book) => void;
  themeColor: string;
}

const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full animate-pulse">
        <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-700" />
        <div className="p-4 flex-1 flex flex-col gap-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
    </div>
);

export const Store: React.FC<StoreProps> = ({ books: initialBooks, onPurchase, themeColor }) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [apiBooks, setApiBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDescriptionLoading, setIsDescriptionLoading] = useState(false);
  const cache = useRef<Record<string, Book[]>>({});

  const categories = ['All', 'Fiction', 'Science', 'History', 'Romance', 'Mystery', 'Fantasy', 'Technology', 'Thriller', 'Biography'];
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Initial load: show pre-defined books instantly
    if (apiBooks.length === 0) {
      setApiBooks(initialBooks);
    }
  }, []);

  useEffect(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchBooks = async () => {
      setError('');
      
      const categoryQuery = selectedCategory.toLowerCase();
      const googleQuery = searchQuery ? searchQuery : `subject:${categoryQuery === 'all' ? 'fiction' : categoryQuery}`;
      
      // Check cache first
      if (cache.current[googleQuery]) {
        setApiBooks(cache.current[googleQuery]);
        return;
      }

      setIsLoading(true);
      
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(googleQuery)}&maxResults=20&langRestrict=en`, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
           if (res.status === 429) {
             setError('The store is currently busy. Showing offline content.');
             if (apiBooks.length === 0) setApiBooks(initialBooks);
             setIsLoading(false);
             return;
           }
           throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();
        
        if (data.items && !controller.signal.aborted) {
            const mapped = data.items.map((item: any) => ({
                id: item.id,
                title: item.volumeInfo.title || 'Untitled',
                author: item.volumeInfo.authors?.[0] || 'Unknown Author',
                coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || `https://via.placeholder.com/300x450?text=No+Cover`,
                content: item.volumeInfo.description || 'No description available.',
                progress: 0,
                totalPages: item.volumeInfo.pageCount || 250,
                category: item.volumeInfo.categories?.[0] || 'General',
                price: item.saleInfo?.listPrice?.amount || (Math.floor(Math.random() * 10) + 4.99),
                rating: Number(item.volumeInfo.averageRating || (Math.random() * 2 + 3).toFixed(1)),
                reviews: [],
                bookmarks: []
            }));
            cache.current[googleQuery] = mapped;
            setApiBooks(mapped);
        } else if (!data.items && !controller.signal.aborted) {
            // If no results from API, and it was a specific search, clear results
            if (searchQuery || categoryQuery !== 'all') {
                setApiBooks([]);
            } else if (categoryQuery === 'all') {
                setApiBooks(initialBooks);
            }
        }
      } catch (err: any) { 
        if (err.name !== 'AbortError') {
            console.error('Store Fetch Error:', err);
            // If the store is empty, always fallback to initial books so the user sees something
            if (apiBooks.length === 0 || (!searchQuery && categoryQuery === 'all')) {
                setApiBooks(initialBooks);
            }
            setError('We are having trouble connecting to the store. Showing offline collection.'); 
        }
      }
      finally { if (!controller.signal.aborted) setIsLoading(false); }
    };

    const debounce = setTimeout(fetchBooks, 500);
    return () => { clearTimeout(debounce); controller.abort(); };
  }, [searchQuery, selectedCategory, initialBooks]);

  const featuredBook = useMemo(() => apiBooks.length > 0 ? apiBooks[0] : null, [apiBooks]);

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-500">
      
      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Responsive Hero Section */}
      {featuredBook && !searchQuery && selectedCategory === 'All' && !isLoading && (
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-${themeColor}-600 to-purple-700 text-white shadow-xl mb-10`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center p-6 md:p-12 gap-6 md:gap-12">
             <div className="w-40 md:w-64 flex-shrink-0 shadow-2xl rounded-lg overflow-hidden md:-rotate-3 border-2 md:border-4 border-white/20">
                <img src={featuredBook.coverUrl} alt={featuredBook.title} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider mb-3">
                    <Award size={14} /> Featured Read
                </div>
                <h1 className="text-2xl md:text-4xl font-serif font-bold mb-2 line-clamp-2 leading-tight">{featuredBook.title}</h1>
                <p className="text-lg md:text-xl text-white/80 mb-6 italic">by {featuredBook.author}</p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <button onClick={() => setSelectedBook(featuredBook)} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2">Details</button>
                    <button onClick={() => onPurchase(featuredBook)} className={`px-6 py-3 bg-black/20 hover:bg-black/30 text-white rounded-xl font-bold text-sm backdrop-blur-md flex items-center justify-center gap-2 border border-white/20`}>Get for ${featuredBook.price}</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Responsive Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div className="relative flex-1 max-w-xl group">
            <Search size={20} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
                type="text" 
                placeholder="Search the book store..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none shadow-sm transition-all"
            />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0 no-scrollbar">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${
                        selectedCategory === cat 
                        ? `bg-${themeColor}-600 text-white shadow-xl shadow-${themeColor}-500/20` 
                        : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Grid Optimized for Small Screens */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-10">
        {isLoading ? (
            Array.from({length: 12}).map((_, i) => <SkeletonCard key={i} />)
        ) : apiBooks.length > 0 ? (
            apiBooks.map(book => (
                <div key={book.id} className="group flex flex-col h-full">
                    <div className="aspect-[2/3] rounded-[2rem] overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-700 mb-4 relative cursor-pointer ring-1 ring-black/5" onClick={() => setSelectedBook(book)}>
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPurchase(book); }}
                            className={`absolute bottom-4 right-4 p-3 bg-white text-slate-900 rounded-2xl shadow-xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-${themeColor}-600 hover:text-white`}
                        >
                            <ShoppingBag size={20} />
                        </button>
                    </div>
                    <div className="flex flex-col flex-1 px-1">
                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 cursor-pointer hover:text-indigo-500 transition-colors text-sm md:text-base leading-tight" onClick={() => setSelectedBook(book)}>{book.title}</h3>
                        <p className="text-[10px] md:text-xs text-slate-400 font-medium mb-3 truncate italic">by {book.author}</p>
                        <div className="mt-auto flex items-center justify-between">
                            <span className="font-black text-slate-900 dark:text-white text-base">${book.price}</span>
                            <div className={`flex items-center gap-1 text-[10px] font-bold text-white bg-amber-500/90 px-2 py-1 rounded-lg backdrop-blur-sm`}>
                                <Star size={10} fill="currentColor" /> {book.rating}
                            </div>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="col-span-full py-20 text-center bg-white/50 dark:bg-slate-800/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800/50">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={32} className="text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No results found</h3>
                <p className="text-slate-500 max-w-sm mx-auto">We couldn't find any books matching your criteria. Try searching for something else or browse categories.</p>
                <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className={`mt-8 px-6 py-3 bg-${themeColor}-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-${themeColor}-500/20`}
                >
                    Reset Filters
                </button>
            </div>
        )}
      </div>

      {/* Responsive Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative max-h-[90vh]">
                <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 p-2 bg-black/5 rounded-full z-10"><X size={20} /></button>
                <div className="w-full md:w-2/5 bg-slate-100 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
                    <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-32 md:w-48 shadow-2xl rounded-lg" />
                </div>
                <div className="w-full md:w-3/5 p-6 overflow-y-auto">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded mb-2 inline-block">{selectedBook.category}</span>
                    <h2 className="text-xl md:text-2xl font-bold mb-1 leading-tight">{selectedBook.title}</h2>
                    <p className="text-sm text-slate-500 mb-4">{selectedBook.author}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6 line-clamp-4">{selectedBook.content}</p>
                    <div className="flex gap-3">
                        <button onClick={() => onPurchase(selectedBook)} className={`flex-1 py-3 bg-${themeColor}-600 text-white rounded-xl font-bold text-sm shadow-lg`}>Purchase for ${selectedBook.price}</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
