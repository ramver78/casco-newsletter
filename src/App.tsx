import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ArticleProvider } from './context/ArticleContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import EditorDashboard from './pages/EditorDashboard';
import ArticleEditor from './pages/ArticleEditor';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MfaSetupPage from './pages/MfaSetupPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ArticleProvider>
        <Router>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/article/:id" element={<ArticlePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/mfa-setup" element={<MfaSetupPage />} />
                <Route 
                  path="/editor" 
                  element={
                    <ProtectedRoute>
                      <EditorDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/editor/new" 
                  element={
                    <ProtectedRoute>
                      <ArticleEditor />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/editor/:id" 
                  element={
                    <ProtectedRoute>
                      <ArticleEditor />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </ArticleProvider>
    </AuthProvider>
  );
}

export default App;
