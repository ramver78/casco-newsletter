import React from 'react';
import { useArticles } from '../context/ArticleContext';
import ArticleCard from '../components/ArticleCard';
import { categories } from '../data/sampleArticles';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { articles } = useArticles();
  const publishedArticles = articles.filter(a => a.status === 'published');
  const featuredArticles = publishedArticles.filter(a => a.featured);
  const regularArticles = publishedArticles.filter(a => !a.featured);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Casco Newsletter</h1>
          <p>Your daily source of news, insights, and stories that matter</p>
        </div>
      </section>

      <div className="container">
        {featuredArticles.length > 0 && (
          <section className="featured-section">
            <h2 className="section-title">Featured Stories</h2>
            <div className="featured-grid">
              {featuredArticles.map(article => (
                <ArticleCard key={article.id} article={article} featured />
              ))}
            </div>
          </section>
        )}

        <section className="categories-section">
          <h2 className="section-title">Browse by Category</h2>
          <div className="categories-list">
            {categories.map(category => (
              <button 
                key={category.id} 
                className="category-btn"
                style={{ '--category-color': category.color } as React.CSSProperties}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <section className="articles-section">
          <h2 className="section-title">Latest Articles</h2>
          <div className="articles-grid">
            {regularArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Casco Newsletter. All rights reserved.</p>
          <p>Built with ❤️ for mobile editors</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
