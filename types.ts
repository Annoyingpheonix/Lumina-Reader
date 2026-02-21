
export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  friends: string[]; // User IDs
  notifications: AppNotification[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'alert';
}

export interface Bookmark {
  id: string;
  wordIndex: number;
  previewText: string;
  createdAt: number;
  note?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  content: string; 
  progress: number; // 0 to 100
  totalPages: number;
  category: string;
  price?: number;
  rating: number;
  reviews: Review[];
  lastRead?: number; // Timestamp
  bookmarks: Bookmark[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AppState {
  currentUser: User | null;
  library: Book[];
  store: Book[];
  theme: {
    blueLightFilter: boolean;
    darkMode: boolean;
    primaryColor: string;
  };
}

export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface AudioConfig {
  voice: VoiceName;
  speed: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}
