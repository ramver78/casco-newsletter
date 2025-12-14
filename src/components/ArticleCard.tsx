import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';
import { Article } from '../types';
import './ArticleCard.css';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, featured = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link to={`/article/${article.id}`} className={`article-card ${featured ? 'featured' : ''}`}>
      {article.imageUrl && (
        <div className="article-image">
          <img src={article.imageUrl} alt={article.title} loading="lazy" />
          <span className="article-category">{article.category}</span>
        </div>
      )}
      <div className="article-content">
        <h3 className="article-title">{article.title}</h3>
        <p className="article-summary">{article.summary}</p>
        <div className="article-meta">
          <span className="article-author">
            <User size={14} />
            {article.author}
          </span>
          <span className="article-date">
            <Clock size={14} />
            {formatDate(article.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
