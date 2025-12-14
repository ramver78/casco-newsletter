import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Article } from '../types';
import { articlesApi } from '../services/api';

interface ArticleContextType {
  articles: Article[];
  isLoading: boolean;
  getArticle: (id: string) => Article | undefined;
  fetchArticle: (id: string) => Promise<Article | null>;
  createArticle: (article: Omit<Article, 'id' | 'publishedAt' | 'updatedAt'>) => Promise<Article>;
  updateArticle: (id: string, updates: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  refreshArticles: (forEditor?: boolean) => Promise<void>;
  getFeaturedArticles: () => Article[];
  getArticlesByCategory: (category: string) => Article[];
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export function ArticleProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshArticles = async (forEditor: boolean = false) => {
    try {
      setIsLoading(true);
      const data = forEditor 
        ? await articlesApi.getAll()
        : await articlesApi.getPublished();
      setArticles(data);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshArticles();
  }, []);

  const getArticle = (id: string) => articles.find(a => a.id === id);

  const fetchArticle = async (id: string): Promise<Article | null> => {
    try {
      return await articlesApi.getById(id);
    } catch (error) {
      console.error('Failed to fetch article:', error);
      return null;
    }
  };

  const createArticle = async (articleData: Omit<Article, 'id' | 'publishedAt' | 'updatedAt'>): Promise<Article> => {
    const newArticle = await articlesApi.create(articleData);
    setArticles(prev => [newArticle, ...prev]);
    return newArticle;
  };

  const updateArticle = async (id: string, updates: Partial<Article>) => {
    const updated = await articlesApi.update(id, updates);
    setArticles(prev => prev.map(a => a.id === id ? updated : a));
  };

  const deleteArticle = async (id: string) => {
    await articlesApi.delete(id);
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const getFeaturedArticles = () => 
    articles.filter(a => a.featured && a.status === 'published');

  const getArticlesByCategory = (category: string) =>
    articles.filter(a => a.category === category && a.status === 'published');

  return (
    <ArticleContext.Provider value={{
      articles,
      isLoading,
      getArticle,
      fetchArticle,
      createArticle,
      updateArticle,
      deleteArticle,
      refreshArticles,
      getFeaturedArticles,
      getArticlesByCategory,
    }}>
      {children}
    </ArticleContext.Provider>
  );
}

export function useArticles() {
  const context = useContext(ArticleContext);
  if (context === undefined) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
}
