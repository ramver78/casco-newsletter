import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Share2 } from 'lucide-react';
import { useArticles } from '../context/ArticleContext';
import './ArticlePage.css';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArticle } = useArticles();
  const article = id ? getArticle(id) : undefined;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  if (!article) {
    return (
      <div className="article-not-found">
        <h2>Article not found</h2>
        <p>The article you're looking for doesn't exist.</p>
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="article-page">
      <div className="article-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </button>
        <button className="share-btn" onClick={handleShare}>
          <Share2 size={20} />
        </button>
      </div>

      {article.imageUrl && (
        <div className="article-hero">
          <img src={article.imageUrl} alt={article.title} />
          <span className="article-category">{article.category}</span>
        </div>
      )}

      <article className="article-content">
        <h1 className="article-title">{article.title}</h1>
        
        <div className="article-meta">
          <span className="article-author">
            <User size={16} />
            {article.author}
          </span>
          <span className="article-date">
            <Clock size={16} />
            {formatDate(article.publishedAt)}
          </span>
        </div>

        <p className="article-summary">{article.summary}</p>

        <div 
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
};

export default ArticlePage;
