import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Clock, FileText, RefreshCw } from 'lucide-react';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import './EditorDashboard.css';

const EditorDashboard: React.FC = () => {
  const { articles, deleteArticle, refreshArticles, isLoading } = useArticles();
  const { user } = useAuth();

  useEffect(() => {
    refreshArticles(true); // Fetch all articles for editor
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteArticle(id);
      } catch (error) {
        alert('Failed to delete article');
      }
    }
  };

  const handleRefresh = () => {
    refreshArticles(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      published: '#10b981',
      draft: '#f59e0b',
      archived: '#6b7280',
    };
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: colors[status] || colors.draft }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="editor-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Editor Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
          </button>
          <Link to="/editor/new" className="new-article-btn">
            <Plus size={20} />
            New Article
          </Link>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <FileText size={24} />
          <div className="stat-info">
            <span className="stat-value">{articles.length}</span>
            <span className="stat-label">Total Articles</span>
          </div>
        </div>
        <div className="stat-card">
          <Eye size={24} />
          <div className="stat-info">
            <span className="stat-value">
              {articles.filter(a => a.status === 'published').length}
            </span>
            <span className="stat-label">Published</span>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={24} />
          <div className="stat-info">
            <span className="stat-value">
              {articles.filter(a => a.status === 'draft').length}
            </span>
            <span className="stat-label">Drafts</span>
          </div>
        </div>
      </div>

      <div className="articles-list">
        <h2>All Articles</h2>
        {articles.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No articles yet. Create your first article!</p>
            <Link to="/editor/new" className="new-article-btn">
              <Plus size={20} />
              Create Article
            </Link>
          </div>
        ) : (
          <div className="articles-table">
            {articles.map(article => (
              <div key={article.id} className="article-row">
                <div className="article-info">
                  <h3>{article.title}</h3>
                  <div className="article-meta">
                    {getStatusBadge(article.status)}
                    <span className="meta-item">
                      <Clock size={14} />
                      {formatDate(article.updatedAt)}
                    </span>
                    <span className="meta-item">{article.category}</span>
                  </div>
                </div>
                <div className="article-actions">
                  <Link 
                    to={`/article/${article.id}`} 
                    className="action-btn view"
                    title="View"
                  >
                    <Eye size={18} />
                  </Link>
                  <Link 
                    to={`/editor/${article.id}`} 
                    className="action-btn edit"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </Link>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(article.id, article.title)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorDashboard;
