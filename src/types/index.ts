export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  imageUrl?: string;
  publishedAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'reader';
  mfaEnabled?: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}
