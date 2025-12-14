import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Edit3, LogOut, User, Shield, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isEditor = user?.role === 'admin' || user?.role === 'editor';
  const isAdmin = user?.role === 'admin';

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">📰</span>
          <span className="logo-text">Casco Newsletter</span>
        </Link>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          {isAuthenticated ? (
            <>
              {isEditor && (
                <Link to="/editor" className="nav-link" onClick={() => setMenuOpen(false)}>
                  <Edit3 size={18} />
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>
                  <Shield size={18} />
                  Admin
                </Link>
              )}
              <Link to="/settings" className="nav-link" onClick={() => setMenuOpen(false)}>
                <Settings size={18} />
                Settings
              </Link>
              <div className="user-menu">
                <span className="user-name">
                  <User size={18} />
                  {user?.name}
                  <span className="user-role">{user?.role}</span>
                </span>
                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="nav-link login-link" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          )}
        </nav>

        <button 
          className="menu-toggle" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
