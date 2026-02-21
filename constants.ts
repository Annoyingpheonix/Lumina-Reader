
import { Book, User, VoiceName } from './types';

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Alex Reader',
  email: 'alex@example.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  friends: ['user-2', 'user-3'],
  notifications: [
    { id: 'n1', title: 'Welcome!', message: 'Thanks for joining Lumina Reader.', date: '2023-10-01', read: true, type: 'info' },
    { id: 'n2', title: 'Goal Reached', message: 'You reached your weekly reading goal!', date: '2023-10-10', read: false, type: 'success' }
  ]
};

export const INITIAL_STORE_BOOKS: Book[] = [
  {
    id: 'book-1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    category: 'Classic',
    price: 0,
    rating: 4.5,
    progress: 0,
    totalPages: 150,
    reviews: [
      { id: 'r1', userId: 'user-2', userName: 'Sarah', userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 5, comment: 'Timeless classic!', date: '2023-10-15' }
    ],
    bookmarks: [],
    content: `In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. "Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven't had the advantages that you've had." He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores. The abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person, and so it came about that in college I was unjustly accused of being a politician, because I was privy to the secret griefs of wild, unknown men. Most of the confidences were unsought—frequently I have feigned sleep, preoccupation, or a hostile levity when I realized by some unmistakable sign that an intimate revelation was quivering on the horizon.`
  },
  {
    id: 'book-2',
    title: '1984',
    author: 'George Orwell',
    coverUrl: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    category: 'Dystopian',
    price: 12.99,
    rating: 4.8,
    progress: 0,
    totalPages: 328,
    reviews: [],
    bookmarks: [],
    content: `It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.`
  },
  {
    id: 'book-3',
    title: 'The Martian',
    author: 'Andy Weir',
    coverUrl: 'https://images.unsplash.com/photo-1614728853975-6663040d025e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    category: 'Sci-Fi',
    price: 14.99,
    rating: 4.9,
    progress: 0,
    totalPages: 369,
    reviews: [],
    bookmarks: [],
    content: `I'm pretty much fucked. That's my considered opinion. Fucked. Six days into what should be the greatest two months of my life, and it's turned into a nightmare. I don't even know who'll read this. I guess someone will find it eventually. Maybe a hundred years from now.`
  },
  {
    id: 'book-4',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    category: 'Romance',
    price: 0,
    rating: 4.7,
    progress: 0,
    totalPages: 279,
    reviews: [],
    bookmarks: [],
    content: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.`
  }
];
