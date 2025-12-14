import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Image, Bold, Italic, List, Link as LinkIcon } from 'lucide-react';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { categories } from '../data/sampleArticles';
import { Article } from '../types';
import './ArticleEditor.css';

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArticle, createArticle, updateArticle } = useArticles();
  const { user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: categories[0].name,
    imageUrl: '',
    status: 'draft' as Article['status'],
    featured: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (id) {
      const article = getArticle(id);
      if (article) {
        setFormData({
          title: article.title,
          summary: article.summary,
          content: article.content,
          category: article.category,
          imageUrl: article.imageUrl || '',
          status: article.status,
          featured: article.featured,
        });
      }
    }
  }, [id, getArticle]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const insertFormatting = (tag: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let newText = '';
    switch (tag) {
      case 'bold':
        newText = `<strong>${selectedText || 'bold text'}</strong>`;
        break;
      case 'italic':
        newText = `<em>${selectedText || 'italic text'}</em>`;
        break;
      case 'list':
        newText = `\n<ul>\n  <li>${selectedText || 'List item'}</li>\n</ul>\n`;
        break;
      case 'link':
        newText = `<a href="url">${selectedText || 'link text'}</a>`;
        break;
      case 'paragraph':
        newText = `<p>${selectedText || 'Paragraph text'}</p>\n`;
        break;
      default:
        return;
    }

    setFormData(prev => ({
      ...prev,
      content: prev.content.substring(0, start) + newText + prev.content.substring(end),
    }));
  };

  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in the title and content');
      return;
    }

    setIsSaving(true);
    const status = publish ? 'published' : formData.status;

    try {
      if (isEditing && id) {
        await updateArticle(id, { ...formData, status });
      } else {
        await createArticle({
          ...formData,
          status,
          author: user?.name || 'Anonymous',
        });
      }
      navigate('/editor');
    } catch (error) {
      alert('Failed to save article. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="article-editor">
      <div className="editor-header">
        <button className="back-btn" onClick={() => navigate('/editor')}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="editor-actions">
          <button 
            className="preview-btn"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={18} />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button 
            className="save-btn"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            <Save size={18} />
            Save Draft
          </button>
          <button 
            className="publish-btn"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            Publish
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="preview-container">
          <div className="preview-content">
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="Cover" className="preview-image" />
            )}
            <h1>{formData.title || 'Untitled Article'}</h1>
            <p className="preview-summary">{formData.summary}</p>
            <div 
              className="preview-body"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
          </div>
        </div>
      ) : (
        <form className="editor-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter article title..."
              autoComplete="off"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                />
                Featured Article
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">
              <Image size={16} />
              Cover Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            {formData.imageUrl && (
              <div className="image-preview">
                <img src={formData.imageUrl} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="summary">Summary</label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Brief summary of the article..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content</label>
            <div className="formatting-toolbar">
              <button type="button" onClick={() => insertFormatting('bold')} title="Bold">
                <Bold size={18} />
              </button>
              <button type="button" onClick={() => insertFormatting('italic')} title="Italic">
                <Italic size={18} />
              </button>
              <button type="button" onClick={() => insertFormatting('list')} title="List">
                <List size={18} />
              </button>
              <button type="button" onClick={() => insertFormatting('link')} title="Link">
                <LinkIcon size={18} />
              </button>
              <button type="button" onClick={() => insertFormatting('paragraph')} title="Paragraph">
                P
              </button>
            </div>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your article content here... Use HTML tags for formatting."
              rows={15}
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default ArticleEditor;
