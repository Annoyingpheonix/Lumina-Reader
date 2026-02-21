
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User, AppNotification } from '../types';
import { Settings, LogOut, Moon, Sun, Eye, PaintBucket, Check, Camera, BookOpen, Clock, Award, Star, Zap, Shield, Bell, ChevronRight, Trophy, Lock, Users, Flame, Sparkles, X, CheckCircle, Smartphone, CreditCard, MapPin, Upload } from 'lucide-react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  theme: { blueLightFilter: boolean; darkMode: boolean; primaryColor: string };
  onToggleTheme: (key: 'blueLightFilter' | 'darkMode') => void;
  onUpdateColor: (color: string) => void;
  onUpdateUser: (user: User) => void;
  themeColor: string;
}

const THEME_COLORS = [
  { name: 'Indigo', id: 'indigo', bg: 'bg-indigo-600' },
  { name: 'Rose', id: 'rose', bg: 'bg-rose-600' },
  { name: 'Emerald', id: 'emerald', bg: 'bg-emerald-600' },
  { name: 'Amber', id: 'amber', bg: 'bg-amber-600' },
  { name: 'Violet', id: 'violet', bg: 'bg-violet-600' },
];

const BASE_ACHIEVEMENTS = [
  { id: 1, name: 'Page Turner', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', desc: 'Read 10 books', target: 10, xp: 500 },
  { id: 2, name: 'Night Owl', icon: Moon, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', desc: 'Read for 2 hours after midnight', target: 1, xp: 300 },
  { id: 3, name: 'Literary Critic', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', desc: 'Write 5 reviews', target: 5, xp: 200 },
  { id: 4, name: 'Streak Master', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', desc: 'Read for 7 consecutive days', target: 7, xp: 1000 },
  { id: 5, name: 'Social Butterfly', icon: Users, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30', desc: 'Connect with 10 friends', target: 10, xp: 400 },
  { id: 6, name: 'Marathoner', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', desc: 'Read for 5 hours in one session', target: 5, xp: 800 },
];

export const Profile: React.FC<ProfileProps> = ({ user, onLogout, theme, onToggleTheme, onUpdateColor, onUpdateUser, themeColor }) => {
  const [activeModal, setActiveModal] = useState<'notifications' | 'privacy' | 'editProfile' | null>(null);
  const [editName, setEditName] = useState(user.name);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mock Stats - In a real app these would come from the User object
  const stats = {
      booksRead: 12,
      readingHours: 48,
      reviewsWritten: 5,
      streakDays: 5,
      friendsCount: 3,
      longestSession: 2.5,
      nightOwl: 1
  };

  const displayStats = [
      { label: 'Books Read', value: stats.booksRead.toString(), icon: BookOpen },
      { label: 'Reading Time', value: `${stats.readingHours}h`, icon: Clock },
      { label: 'Reviews', value: stats.reviewsWritten.toString(), icon: Star },
      { label: 'Streak', value: `${stats.streakDays} Days`, icon: Flame },
  ];

  // Derive Achievements status based on stats
  const achievements = useMemo(() => {
    return BASE_ACHIEVEMENTS.map(ach => {
        let currentProgress = 0;
        switch(ach.id) {
            case 1: currentProgress = stats.booksRead; break;
            case 2: currentProgress = stats.nightOwl; break;
            case 3: currentProgress = stats.reviewsWritten; break;
            case 4: currentProgress = stats.streakDays; break;
            case 5: currentProgress = stats.friendsCount; break;
            case 6: currentProgress = stats.longestSession; break;
            default: currentProgress = 0;
        }
        return {
            ...ach,
            progress: currentProgress,
            completed: currentProgress >= ach.target
        };
    });
  }, [stats]);

  const totalXp = achievements.reduce((acc, curr) => curr.completed ? acc + curr.xp : acc, 0);
  const currentLevel = Math.floor(totalXp / 1000) + 1;
  const nextLevelXp = currentLevel * 1000;
  const xpProgress = totalXp % 1000;

  // Check for new achievements and trigger notification
  useEffect(() => {
    const newUnlocks = achievements.filter(a => a.completed);
    let updatedNotifications = [...user.notifications];
    let hasUpdates = false;

    newUnlocks.forEach(ach => {
        const notifTitle = `Achievement Unlocked: ${ach.name}`;
        const exists = updatedNotifications.some(n => n.title === notifTitle);
        
        if (!exists) {
            hasUpdates = true;
            updatedNotifications.unshift({
                id: `ach-${ach.id}-${Date.now()}`,
                title: notifTitle,
                message: `Congratulations! You earned ${ach.xp} XP by completing: ${ach.desc}`,
                date: 'Just now',
                read: false,
                type: 'success'
            });
        }
    });

    if (hasUpdates) {
        onUpdateUser({ ...user, notifications: updatedNotifications });
    }
  }, [achievements]); // Safe to ignore user dependency here to prevent loops, relying on strict logic inside

  const handleClearNotifications = () => {
      onUpdateUser({ ...user, notifications: [] });
  };

  const handleSaveProfile = () => {
      onUpdateUser({ ...user, name: editName });
      setActiveModal(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ ...user, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 relative animate-in fade-in duration-500">
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 mb-8 relative">
          <div className={`h-32 md:h-48 bg-gradient-to-r from-${themeColor}-600 to-purple-600 relative`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/20 flex items-center gap-2 shadow-lg">
                  <Sparkles size={14} className="text-yellow-300" /> Level {currentLevel}
              </div>
          </div>
          
          <div className="px-6 md:px-10 pb-8">
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 md:-mt-16 mb-6 gap-6">
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg object-cover bg-white dark:bg-slate-900 group-hover:brightness-75 transition-all" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={24} className="text-white drop-shadow-md" />
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                  </div>
                  
                  <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                          {user.name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <span>{user.email}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span>Member since Sep 2023</span>
                      </div>
                  </div>

                  <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
                      <button 
                        onClick={() => setActiveModal('editProfile')}
                        className="flex-1 md:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium text-sm transition-colors text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2"
                      >
                         <Settings size={16} /> Edit Profile
                      </button>
                  </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                  {displayStats.map((stat, idx) => (
                      <div key={idx} className="flex flex-col items-center md:items-start p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs font-bold uppercase tracking-wider">
                              <stat.icon size={14} /> {stat.label}
                          </div>
                          <div className={`text-2xl font-bold text-${themeColor}-600 dark:text-${themeColor}-400`}>
                              {stat.value}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
              
              {/* Level Progress */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Zap size={20} className={`text-${themeColor}-500`} fill="currentColor" /> 
                            Level Progress
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Earn XP by reading books and completing achievements.</p>
                      </div>
                      <div className="text-right">
                         <span className="text-2xl font-bold text-slate-900 dark:text-white">{currentLevel}</span>
                         <span className="text-xs text-slate-400 uppercase font-bold ml-1">Lvl</span>
                      </div>
                  </div>
                  
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                        <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-${themeColor}-600 bg-${themeColor}-200 dark:bg-${themeColor}-900/30`}>
                            XP
                        </span>
                        </div>
                        <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-slate-600 dark:text-slate-400">
                            {xpProgress} / 1000
                        </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100 dark:bg-slate-700">
                        <div style={{ width: `${(xpProgress / 1000) * 100}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-${themeColor}-500 to-${themeColor}-400 transition-all duration-1000 ease-out`}></div>
                    </div>
                  </div>
              </div>

              {/* Achievements */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                      <div>
                          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                              <Trophy size={20} className={`text-${themeColor}-500`} /> 
                              Achievements
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">{achievements.filter(a => a.completed).length} of {achievements.length} unlocked</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                      {achievements.map(ach => (
                          <div key={ach.id} className={`relative overflow-hidden flex flex-col p-5 rounded-2xl border transition-all ${ach.completed ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 dark:hover:border-slate-600' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'}`}>
                              
                              <div className="flex items-start justify-between mb-3 z-10 relative">
                                  <div className={`w-12 h-12 rounded-xl ${ach.completed ? ach.bg : 'bg-slate-200 dark:bg-slate-700'} ${ach.completed ? ach.color : 'text-slate-400'} flex items-center justify-center shadow-sm transition-colors`}>
                                      <ach.icon size={22} />
                                  </div>
                                  {ach.completed ? (
                                       <div className="flex flex-col items-end">
                                           <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-in zoom-in">
                                               <Check size={10} /> Done
                                           </span>
                                           <span className="text-[10px] text-slate-400 mt-1 font-medium">+{ach.xp} XP</span>
                                       </div>
                                  ) : (
                                       <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                           <Lock size={10} /> Locked
                                       </span>
                                  )}
                              </div>
                              
                              <div className="mt-auto z-10 relative">
                                  <h4 className={`font-bold text-sm ${ach.completed ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{ach.name}</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed min-h-[2.5em]">{ach.desc}</p>
                                  
                                  <div className="mt-3">
                                      <div className="flex justify-between items-center text-[10px] font-medium text-slate-400 mb-1">
                                            <span>{Math.min(ach.progress, ach.target)} / {ach.target}</span>
                                            <span>{Math.min(100, Math.round((ach.progress / ach.target) * 100))}%</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                          <div 
                                              className={`h-full rounded-full transition-all duration-1000 ease-out ${ach.completed ? `bg-${themeColor}-500` : 'bg-slate-400 dark:bg-slate-600'}`}
                                              style={{width: `${Math.min(100, (ach.progress / ach.target) * 100)}%`}} 
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Account Settings Menu */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Account Settings</h3>
                  <div className="space-y-1">
                      <button 
                        onClick={() => setActiveModal('notifications')}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
                                  <Bell size={18} />
                              </div>
                              <div>
                                  <div className="font-medium text-slate-900 dark:text-white">Notifications</div>
                                  <div className="text-xs text-slate-500">Manage emails and push alerts</div>
                              </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-400" />
                      </button>
                      
                      <button 
                        onClick={() => setActiveModal('privacy')}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
                                  <Shield size={18} />
                              </div>
                              <div>
                                  <div className="font-medium text-slate-900 dark:text-white">Privacy & Security</div>
                                  <div className="text-xs text-slate-500">Password, 2FA, connected accounts</div>
                              </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-400" />
                      </button>
                  </div>
              </div>
          </div>

          {/* Sidebar Column: Appearance */}
          <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <PaintBucket size={20} className={`text-${themeColor}-500`}/> Appearance
                  </h3>
                  
                  <div className="space-y-6">
                      {/* Dark Mode */}
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${theme.darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  {theme.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                              </div>
                              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Dark Mode</span>
                          </div>
                          <button 
                            onClick={() => onToggleTheme('darkMode')}
                            className={`w-10 h-6 rounded-full transition-colors relative ${theme.darkMode ? `bg-${themeColor}-600` : 'bg-slate-300'}`}
                          >
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${theme.darkMode ? 'translate-x-4' : ''}`} />
                          </button>
                      </div>

                      {/* Blue Light */}
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${theme.blueLightFilter ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                  <Eye size={18} />
                              </div>
                              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Eye Comfort</span>
                          </div>
                          <button 
                            onClick={() => onToggleTheme('blueLightFilter')}
                            className={`w-10 h-6 rounded-full transition-colors relative ${theme.blueLightFilter ? 'bg-amber-500' : 'bg-slate-300'}`}
                          >
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${theme.blueLightFilter ? 'translate-x-4' : ''}`} />
                          </button>
                      </div>

                      {/* Theme Colors */}
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Accent Color</label>
                          <div className="flex flex-wrap gap-2">
                              {THEME_COLORS.map(color => (
                                <button
                                  key={color.id}
                                  onClick={() => onUpdateColor(color.id)}
                                  className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center transition-all hover:scale-110 ${themeColor === color.id ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : ''}`}
                                  title={color.name}
                                >
                                  {themeColor === color.id && <Check size={14} className="text-white" />}
                                </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              <button 
                onClick={onLogout}
                className="w-full py-3 flex items-center justify-center gap-2 text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900"
              >
                <LogOut size={18} />
                Log Out
              </button>
          </div>
      </div>

      {/* --- Modals --- */}

      {/* Edit Profile Modal */}
      {activeModal === 'editProfile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Profile</h3>
                    <button onClick={() => setActiveModal(null)}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex flex-col items-center justify-center mb-4">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <img src={user.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Tap to change avatar</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input 
                            type="email" 
                            value={user.email}
                            disabled
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500" 
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium">Cancel</button>
                    <button onClick={handleSaveProfile} className={`px-4 py-2 bg-${themeColor}-600 text-white rounded-lg font-medium shadow-md`}>Save Changes</button>
                </div>
            </div>
        </div>
      )}

      {/* Notifications Modal */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell size={20} /> Notifications
                    </h3>
                    <button onClick={() => setActiveModal(null)}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-0 max-h-[60vh] overflow-y-auto">
                    {!user.notifications || user.notifications.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No notifications yet.</div>
                    ) : (
                        user.notifications.map((notif) => (
                            <div key={notif.id} className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-slate-300' : `bg-${themeColor}-500`}`}></div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{notif.title}</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{notif.message}</div>
                                    <div className="text-xs text-slate-400">{notif.date}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Email notifications are ON</span>
                    <button onClick={handleClearNotifications} className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Clear All</button>
                </div>
            </div>
        </div>
      )}

      {/* Privacy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield size={20} /> Privacy & Security
                    </h3>
                    <button onClick={() => setActiveModal(null)}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-slate-900 dark:text-white">Profile Visibility</div>
                            <div className="text-xs text-slate-500">Who can see your reading activity</div>
                        </div>
                        <select className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm px-2 py-1">
                            <option>Everyone</option>
                            <option>Friends Only</option>
                            <option>Private</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-slate-900 dark:text-white">Two-Factor Auth</div>
                            <div className="text-xs text-slate-500">Secure your account</div>
                        </div>
                        <div className={`w-10 h-6 rounded-full bg-slate-300 relative cursor-pointer`}>
                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <button className="w-full py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
                        Change Password
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
