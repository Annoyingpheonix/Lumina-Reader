
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Book } from '../types';
import { ShoppingBag, Star, Search, X, Filter, Tag, BookOpen, ChevronRight, Check, Award, Clock, ExternalLink, Loader2, Globe } from 'lucide-react';

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

  const categories = ['All', 'Fiction', 'Science', 'History', 'Romance', 'Mystery', 'Fantasy', 'Technology', 'Thriller', 'Biography'];
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchBooks = async () => {
      setIsLoading(true);
      setError('');
      const googleQuery = searchQuery ? searchQuery : `subject:${selectedCategory === 'All' ? 'fiction' : selectedCategory}`;
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(googleQuery)}&maxResults=20&langRestrict=en`, { signal: controller.signal });
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
                rating: item.volumeInfo.averageRating || (Math.random() * 2 + 3).toFixed(1),
                reviews: []
            }));
            setApiBooks(mapped);
        }
      } catch (err: any) { if (err.name !== 'AbortError') setError('Failed to load store.'); }
      finally { if (!controller.signal.aborted) setIsLoading(false); }
    };

    const debounce = setTimeout(fetchBooks, 500);
    return () => { clearTimeout(debounce); controller.abort(); };
  }, [searchQuery, selectedCategory]);

  const featuredBook = useMemo(() => apiBooks.length > 0 ? apiBooks[0] : null, [apiBooks]);

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-500">
      
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
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
        <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-3 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search store..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0"><Filter size={16} /></div>
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                        selectedCategory === cat 
                        ? `bg-${themeColor}-600 text-white shadow-lg` 
                        : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Grid Optimized for Small Screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {isLoading ? (
            Array.from({length: 8}).map((_, i) => <SkeletonCard key={i} />)
        ) : (
            apiBooks.map(book => (
                <div key={book.id} className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                    <div className="aspect-[2/3] relative cursor-pointer" onClick={() => setSelectedBook(book)}>
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute bottom-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white">
                            <ShoppingBag size={14} onClick={(e) => { e.stopPropagation(); onPurchase(book); }} />
                        </div>
                    </div>
                    <div className="p-3 md:p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white line-clamp-2 mb-1 cursor-pointer hover:text-indigo-500" onClick={() => setSelectedBook(book)}>{book.title}</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 mb-2 truncate">{book.author}</p>
                        <div className="mt-auto flex items-center justify-between">
                            <span className="font-bold text-xs md:text-sm">${book.price}</span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                                <Star size={10} fill="currentColor" /> {book.rating}
                            </div>
                        </div>
                    </div>
                </div>
            ))
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
