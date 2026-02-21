
import React, { useState, useEffect, useMemo } from 'react';
import { Book, Review } from '../types';
import { BookOpen, Plus, X, Upload, Image as ImageIcon, FileText, Loader2, Star, MessageSquarePlus, Clock, ArrowRight, Edit2, Save, Play, Trash2, SortAsc, Filter, Grid, List as ListIcon, Search } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

const pdfJS = (pdfjsLib as any).default || pdfjsLib;
if (typeof window !== 'undefined' && !pdfJS.GlobalWorkerOptions.workerSrc) {
  pdfJS.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

interface LibraryProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onUpload: (data: { title: string; author: string; category: string; coverUrl: string; content: string }) => void;
  onAddReview: (book: Book, rating: number, comment: string) => void;
  onUpdateBook: (book: Book) => void;
  onDelete: (bookId: string) => void;
  themeColor: string;
}

export const Library: React.FC<LibraryProps> = ({ books, onSelectBook, onUpload, onAddReview, onUpdateBook, onDelete, themeColor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing file...');
  
  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author' | 'progress'>('recent');
  const [filterQuery, setFilterQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredBooks = useMemo(() => {
    let result = books.filter(b => 
      b.title.toLowerCase().includes(filterQuery.toLowerCase()) || 
      b.author.toLowerCase().includes(filterQuery.toLowerCase())
    );
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.title.localeCompare(b.title);
        case 'author': return a.author.localeCompare(b.author);
        case 'progress': return b.progress - a.progress;
        case 'recent': return (b.lastRead || 0) - (a.lastRead || 0);
        default: return 0;
      }
    });
    
    return result;
  }, [books, filterQuery, sortBy]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileType = file.name.toLowerCase();
    if (fileType.endsWith('.pdf')) await handlePdfUpload(file);
    else if (fileType.endsWith('.epub')) await handleEpubUpload(file);
    else if (fileType.endsWith('.txt')) await handleTxtUpload(file);
    e.target.value = '';
  };

  const handlePdfUpload = async (file: File) => {
    setIsProcessing(true);
    setLoadingMessage('Parsing PDF...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfJS.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      
      // Extract cover from first page
      let coverUrl = '';
      try {
        const page1 = await pdf.getPage(1);
        const viewport = page1.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (context) {
            await page1.render({ canvasContext: context, viewport: viewport }).promise;
            coverUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      } catch (err) {
        console.error("Failed to generate cover:", err);
      }

      let fullContent = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        setLoadingMessage(`Reading Page ${i}/${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullContent += pageText + '\n\n';
      }
      onUpload({ title: file.name.replace('.pdf', ''), author: 'Imported PDF', category: 'PDF', coverUrl: coverUrl, content: fullContent });
      setIsModalOpen(false);
    } catch (e) { 
        console.error(e);
        alert("Failed to parse PDF"); 
    }
    finally { setIsProcessing(false); }
  };

  const handleTxtUpload = async (file: File) => {
    setIsProcessing(true);
    setLoadingMessage('Reading text file...');
    try {
      const text = await file.text();
      onUpload({ title: file.name.replace('.txt', ''), author: 'Text File', category: 'General', coverUrl: '', content: text });
      setIsModalOpen(false);
    } catch (e) { alert("Failed to read file"); }
    finally { setIsProcessing(false); }
  };

  const handleEpubUpload = async (file: File) => {
    // Basic EPUB logic for visual placeholders
    alert("EPUB analysis started for: " + file.name);
  };

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">My Library</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter library..." 
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2`}><Plus size={20} /> Add Book</button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <SortAsc size={16} className="text-slate-400" />
            <select value={sortBy} onChange={(e: any) => setSortBy(e.target.value)} className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-slate-500 outline-none cursor-pointer">
              <option value="recent">Recent</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}><Grid size={16}/></button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}><ListIcon size={16}/></button>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-400">No books found</h3>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-8" : "space-y-4"}>
          {filteredBooks.map(book => (
            <div key={book.id} className={viewMode === 'grid' ? "group flex flex-col" : "flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all"}>
              <div 
                className={viewMode === 'grid' ? "aspect-[2/3] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-300 mb-3 relative cursor-pointer" : "w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"}
                onClick={() => onSelectBook(book)}
              >
                <img src={book.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={book.title} />
                {book.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                    <div className={`h-full bg-${themeColor}-500 transition-all duration-500`} style={{ width: `${book.progress}%` }} />
                  </div>
                )}
                {viewMode === 'grid' && book.progress > 0 && (
                   <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded text-[9px] font-bold text-white border border-white/10">{Math.round(book.progress)}%</div>
                )}
              </div>
              
              <div className={viewMode === 'grid' ? "flex-1 min-w-0" : "flex-1 min-w-0"}>
                <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-0.5 truncate cursor-pointer hover:text-indigo-500 text-sm md:text-base" onClick={() => onSelectBook(book)}>{book.title}</h3>
                <p className="text-[10px] md:text-xs text-slate-500 truncate mb-2">{book.author}</p>
                {viewMode === 'list' && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-[120px] h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                       <div className={`h-full bg-${themeColor}-500 transition-all duration-500`} style={{ width: `${book.progress}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{Math.round(book.progress)}%</span>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-auto">
                    <button 
                      onClick={() => onSelectBook(book)} 
                      className={`p-1.5 rounded-lg text-${themeColor}-600 hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-900/20 transition-all`}
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                    <button 
                      onClick={() => onDelete(book.id)} 
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal (Responsive) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg">Import to Library</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1"><X size={24} className="text-slate-400 hover:text-slate-900" /></button>
              </div>
              
              <div className="p-6">
                 {isProcessing ? (
                   <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className={`w-12 h-12 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-${themeColor}-600 animate-spin mb-4`} />
                      <h4 className="font-bold mb-1">{loadingMessage}</h4>
                      <p className="text-xs text-slate-500">Processing file metadata...</p>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:border-indigo-500 transition-colors relative">
                        <Upload size={40} className="text-slate-300 mb-3 group-hover:text-indigo-500 transition-colors" />
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Tap to upload file</h4>
                        <p className="text-[10px] text-slate-500 mt-1">PDF, EPUB, or TXT</p>
                        <input type="file" accept=".pdf,.epub,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                         <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                            <FileText size={20} className="mx-auto mb-2 text-indigo-500" />
                            <div className="text-[9px] font-bold uppercase tracking-wider">PDF</div>
                         </div>
                         <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                            <BookOpen size={20} className="mx-auto mb-2 text-rose-500" />
                            <div className="text-[9px] font-bold uppercase tracking-wider">EPUB</div>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
