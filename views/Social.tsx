import React, { useState } from 'react';
import { User, Book } from '../types';
import { UserPlus, MessageCircle, Heart, Share2, TrendingUp, Users, BookOpen, Search, MoreHorizontal, Send, Check, X, UserMinus, Mail, Clock, UserCheck } from 'lucide-react';

interface SocialProps {
  user: User;
  books: Book[];
  themeColor: string;
}

// Mock Data Generators
const generateActivities = (books: Book[]) => {
  const activities: any[] = [];
  
  // Convert reviews to activities
  books.forEach(book => {
    book.reviews.forEach(review => {
      activities.push({
        id: `act-${review.id}`,
        type: 'review',
        user: { name: review.userName, avatar: review.userAvatar },
        book: book,
        content: review.comment,
        rating: review.rating,
        date: review.date,
        likes: Math.floor(Math.random() * 50) + 5,
        comments: Math.floor(Math.random() * 10),
        liked: false
      });
    });
  });

  // Add some "Started Reading" activities
  if (books.length > 0) {
    activities.push({
        id: 'act-start-1',
        type: 'progress',
        user: { name: 'Alex Reader', avatar: 'https://picsum.photos/id/64/200/200' },
        book: books[0],
        content: 'Started reading this masterpiece! 📖 Can\'t wait to see where this journey goes.',
        date: '2 hours ago',
        rating: 0,
        likes: 12,
        comments: 2,
        liked: true
    });
  }

  return activities.sort(() => Math.random() - 0.5); // Shuffle
};

const CLUBS_DATA = [
  { id: 1, name: 'Sci-Fi Explorers', members: 1240, image: 'https://picsum.photos/id/1/200/200', desc: 'Discussing the future of humanity and beyond the stars.' },
  { id: 2, name: 'Classic Literature', members: 850, image: 'https://picsum.photos/id/2/200/200', desc: 'Revisiting the golden oldies that shaped our world.' },
  { id: 3, name: 'Mystery & Thriller', members: 2300, image: 'https://picsum.photos/id/3/200/200', desc: 'Whodunnit? Let\'s find out together.' },
  { id: 4, name: 'Fantasy Realms', members: 3100, image: 'https://picsum.photos/id/10/200/200', desc: 'Magic, dragons, and epic adventures await.' },
];

// Enhanced Mock Users Database
const ALL_USERS = [
  { id: 'user-2', name: 'Sarah Wilson', avatar: 'https://picsum.photos/id/65/100/100', reading: 'The Great Gatsby', status: 'online' },
  { id: 'user-3', name: 'Mike Chen', avatar: 'https://picsum.photos/id/66/100/100', reading: '1984', status: 'offline' },
  { id: 'user-4', name: 'Emily Davis', avatar: 'https://picsum.photos/id/67/100/100', reading: 'Project Hail Mary', status: 'online' },
  { id: 'user-5', name: 'David Miller', avatar: 'https://picsum.photos/id/68/100/100', reading: null, status: 'offline' },
  { id: 'user-6', name: 'Jessica Taylor', avatar: 'https://picsum.photos/id/69/100/100', reading: 'Dune', status: 'online' },
  { id: 'user-7', name: 'Alex Brown', avatar: 'https://picsum.photos/id/70/100/100', reading: 'The Hobbit', status: 'online' },
];

export const Social: React.FC<SocialProps> = ({ user, books, themeColor }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'clubs' | 'friends'>('feed');
  const [activities, setActivities] = useState(() => generateActivities(books));
  
  // Club State
  const [clubSearch, setClubSearch] = useState('');
  const [joinedClubs, setJoinedClubs] = useState<number[]>([]);

  // Friend State
  const [friendSearch, setFriendSearch] = useState('');
  const [pendingRequests, setPendingRequests] = useState([
      { id: 'user-5', name: 'David Miller', avatar: 'https://picsum.photos/id/68/100/100', mutual: 2 }
  ]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  
  // Initialize friends list with rich data based on IDs in user.friends
  const [myFriends, setMyFriends] = useState(() => {
      return user.friends.map(id => {
          const found = ALL_USERS.find(u => u.id === id);
          // Fallback if ID doesn't match mock DB
          return found || { 
              id, 
              name: `Friend ${id.split('-')[1] || id}`, 
              avatar: `https://picsum.photos/seed/${id}/100/100`, 
              reading: 'Unknown Book', 
              status: 'offline' 
          };
      });
  });

  const toggleLike = (id: string) => {
    setActivities(prev => prev.map(act => {
      if (act.id === id) {
        return { 
          ...act, 
          liked: !act.liked, 
          likes: act.liked ? act.likes - 1 : act.likes + 1 
        };
      }
      return act;
    }));
  };

  const handleJoinClub = (id: number) => {
      if (joinedClubs.includes(id)) {
          setJoinedClubs(prev => prev.filter(c => c !== id));
      } else {
          setJoinedClubs(prev => [...prev, id]);
      }
  };

  const handleInvite = () => {
      const email = prompt("Enter friend's email address:");
      if (email) {
          alert(`Invite sent to ${email}!`);
      }
  };

  // Friend Actions
  const handleSendRequest = (id: string) => {
      setSentRequests(prev => [...prev, id]);
  };

  const handleAcceptRequest = (req: typeof pendingRequests[0]) => {
      const newFriend = ALL_USERS.find(u => u.id === req.id) || { 
          id: req.id, name: req.name, avatar: req.avatar, reading: null, status: 'online' 
      };
      setMyFriends(prev => [...prev, newFriend]);
      setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const handleDeclineRequest = (id: string) => {
      setPendingRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleUnfriend = (id: string) => {
      if (window.confirm("Are you sure you want to remove this friend?")) {
          setMyFriends(prev => prev.filter(f => f.id !== id));
      }
  };

  // Filtering Logic
  const searchResults = friendSearch 
      ? ALL_USERS.filter(u => 
          u.name.toLowerCase().includes(friendSearch.toLowerCase()) && 
          u.id !== user.id &&
          !myFriends.find(f => f.id === u.id)
        )
      : [];
      
  const filteredFriends = myFriends.filter(f => f.name.toLowerCase().includes(friendSearch.toLowerCase()));

  const filteredClubs = CLUBS_DATA.filter(c => c.name.toLowerCase().includes(clubSearch.toLowerCase()));

  const Sidebar = () => (
    <div className="space-y-6">
      {/* Trending Books */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <TrendingUp size={20} className={`text-${themeColor}-600`} />
          Trending Now
        </h3>
        <div className="space-y-4">
          {books.slice(0, 3).map((book, i) => (
            <div key={book.id} className="flex gap-3 items-center group cursor-pointer">
              <span className="text-2xl font-bold text-slate-200 dark:text-slate-700 w-6">{i + 1}</span>
              <img src={book.coverUrl} className="w-10 h-14 object-cover rounded shadow-sm group-hover:scale-105 transition-transform" alt={book.title} />
              <div className="flex-1 overflow-hidden">
                <div className="font-medium text-slate-800 dark:text-white truncate group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{book.title}</div>
                <div className="text-xs text-slate-500 truncate">{book.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Friends */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
         <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <UserPlus size={20} className={`text-${themeColor}-600`} />
          Suggested People
        </h3>
        <div className="space-y-4">
           {ALL_USERS.filter(u => !myFriends.find(f => f.id === u.id) && u.id !== user.id).slice(0, 3).map(u => (
             <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <img src={u.avatar} alt="User" />
                   </div>
                   <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.name}</div>
                </div>
                <button 
                    onClick={() => handleSendRequest(u.id)}
                    disabled={sentRequests.includes(u.id)}
                    className={`text-xs font-medium text-${themeColor}-600 hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-900/20 px-2 py-1 rounded transition-colors disabled:opacity-50`}
                >
                    {sentRequests.includes(u.id) ? 'Sent' : 'Follow'}
                </button>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Community</h2>
          <p className="text-slate-500 dark:text-slate-400">Connect with fellow book lovers.</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto">
            {(['feed', 'clubs', 'friends'] as const).map(tab => (
              <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2 ${activeTab === tab ? `bg-white dark:bg-slate-700 shadow-sm text-${themeColor}-600 dark:text-${themeColor}-400` : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                  {tab === 'feed' && <BookOpen size={16} />}
                  {tab === 'clubs' && <Users size={16} />}
                  {tab === 'friends' && <Heart size={16} />}
                  {tab}
              </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Post Input (Feed Only) */}
          {activeTab === 'feed' && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex gap-4">
              <img src={user.avatar} alt="Me" className="w-10 h-10 rounded-full" />
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Share your thoughts or current read..." 
                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 dark:text-white placeholder-slate-400"
                />
                <button className={`absolute right-2 top-2 text-${themeColor}-600 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors`}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'feed' && activities.map((activity) => (
            <div key={activity.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                   <img src={activity.user.avatar} alt={activity.user.name} className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-700" />
                   <div>
                     <div className="font-bold text-slate-900 dark:text-white text-sm">{activity.user.name}</div>
                     <div className="text-xs text-slate-500">
                       {activity.type === 'review' ? 'wrote a review' : 'updated progress'} • {activity.date}
                     </div>
                   </div>
                 </div>
                 <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                   <MoreHorizontal size={20} />
                 </button>
               </div>

               <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">{activity.content}</p>

               {/* Book Embed */}
               <div className="flex gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl mb-4 border border-slate-100 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group/book">
                 <img src={activity.book.coverUrl} alt={activity.book.title} className="w-12 h-18 object-cover rounded-md shadow-sm group-hover/book:scale-105 transition-transform" />
                 <div className="flex flex-col justify-center">
                   <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover/book:text-indigo-500 transition-colors">{activity.book.title}</h4>
                   <p className="text-xs text-slate-500 mb-1">{activity.book.author}</p>
                   {activity.rating > 0 && (
                     <div className="flex text-yellow-400 text-xs gap-0.5">
                       {Array.from({length: 5}).map((_, i) => (
                         <span key={i} className={i < activity.rating ? "fill-current" : "text-slate-300 dark:text-slate-700"}>★</span>
                       ))}
                     </div>
                   )}
                 </div>
               </div>

               {/* Action Bar */}
               <div className="flex items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                 <button 
                    onClick={() => toggleLike(activity.id)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 ${activity.liked ? 'text-rose-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                 >
                   <Heart size={18} className={activity.liked ? 'fill-current' : ''} />
                   {activity.likes}
                 </button>
                 <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30">
                   <MessageCircle size={18} />
                   {activity.comments}
                 </button>
                 <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors ml-auto p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30">
                   <Share2 size={18} />
                 </button>
               </div>
            </div>
          ))}

          {activeTab === 'clubs' && (
            <div className="space-y-6">
                <div className="relative">
                    <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search for clubs..." 
                        value={clubSearch}
                        onChange={(e) => setClubSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClubs.map(club => (
                    <div key={club.id} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col group hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                        <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-xl border-4 border-white dark:border-slate-800 overflow-hidden bg-white">
                        <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div className="pt-8 p-6 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{club.name}</h3>
                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                        <Users size={12} /> {club.members.toLocaleString()} members
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{club.desc}</p>
                        <button 
                            onClick={() => handleJoinClub(club.id)}
                            className={`mt-auto w-full py-2 rounded-lg border font-medium transition-colors ${
                                joinedClubs.includes(club.id)
                                ? `bg-${themeColor}-50 dark:bg-${themeColor}-900/20 border-${themeColor}-200 dark:border-${themeColor}-800 text-${themeColor}-600 dark:text-${themeColor}-400`
                                : `border-${themeColor}-200 dark:border-${themeColor}-800 text-${themeColor}-600 dark:text-${themeColor}-400 hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-900/20`
                            }`}
                        >
                        {joinedClubs.includes(club.id) ? 'Joined' : 'Join Club'}
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            </div>
          )}

          {activeTab === 'friends' && (
             <div className="space-y-8">
                {/* Search Bar */}
                <div className="relative">
                    <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Find friends or search your list..." 
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                </div>

                {/* Friend Requests */}
                {!friendSearch && pendingRequests.length > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center gap-2">
                            <UserPlus size={20} /> Friend Requests
                        </h3>
                        <div className="grid gap-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-indigo-100 dark:border-slate-800">
                                   <div className="flex items-center gap-3">
                                        <img src={req.avatar} alt={req.name} className="w-12 h-12 rounded-full" />
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">{req.name}</div>
                                            <div className="text-xs text-slate-500">{req.mutual} mutual friends</div>
                                        </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button 
                                        onClick={() => handleAcceptRequest(req)}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                        title="Accept"
                                       >
                                           <Check size={18} />
                                       </button>
                                       <button 
                                        onClick={() => handleDeclineRequest(req.id)}
                                        className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                                        title="Decline"
                                       >
                                           <X size={18} />
                                       </button>
                                   </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Results (New People) */}
                {friendSearch && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Discover People</h3>
                        {searchResults.length === 0 ? (
                            <p className="text-slate-500 dark:text-slate-400 italic">No matching people found.</p>
                        ) : (
                            <div className="grid gap-4">
                                {searchResults.map(u => (
                                    <div key={u.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                                                {u.reading && <div className="text-xs text-slate-500">Reading {u.reading}</div>}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleSendRequest(u.id)}
                                            disabled={sentRequests.includes(u.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sentRequests.includes(u.id) ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' : `bg-${themeColor}-50 dark:bg-${themeColor}-900/20 text-${themeColor}-600 dark:text-${themeColor}-400 hover:bg-${themeColor}-100 dark:hover:bg-${themeColor}-900/40`}`}
                                        >
                                            {sentRequests.includes(u.id) ? <Check size={16} /> : <UserPlus size={16} />}
                                            {sentRequests.includes(u.id) ? 'Sent' : 'Add Friend'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <hr className="my-8 border-slate-200 dark:border-slate-800" />
                    </div>
                )}

                {/* My Friends List */}
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 justify-between">
                        <span>{friendSearch ? 'My Matching Friends' : `All Friends (${myFriends.length})`}</span>
                        {!friendSearch && (
                             <button 
                                onClick={handleInvite}
                                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                             >
                                 <Mail size={14} /> Invite New
                             </button>
                        )}
                    </h3>
                    {filteredFriends.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-slate-500 dark:text-slate-400">No friends found.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {filteredFriends.map(friend => (
                                <div key={friend.id} className="flex items-start justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                                    <div className="flex gap-3">
                                        <div className="relative">
                                            <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${friend.status === 'online' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">{friend.name}</div>
                                            {friend.reading ? (
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <BookOpen size={12} /> Reading <span className="font-medium text-slate-700 dark:text-slate-300">{friend.reading}</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 italic mt-0.5">Not reading anything</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                         <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors">
                                             <MessageCircle size={18} />
                                         </button>
                                         <button 
                                            onClick={() => handleUnfriend(friend.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                            title="Unfriend"
                                         >
                                             <UserMinus size={18} />
                                         </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Invite CTA */}
                {!friendSearch && (
                     <button 
                        onClick={handleInvite}
                        className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex flex-col items-center justify-center gap-2"
                     >
                        <Mail size={24} />
                        <span className="font-medium">Invite friends by email</span>
                     </button>
                )}
             </div>
          )}
        </div>

        {/* Sidebar (Desktop) */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      </div>
    </div>
  );
};