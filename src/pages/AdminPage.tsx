import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Plus, Trash2, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import { User } from '../types';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'reader' });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await usersApi.updateRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as User['role'] } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
    
    try {
      await usersApi.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await usersApi.create(newUser);
      setUsers([...users, created]);
      setShowAddUser(false);
      setNewUser({ email: '', password: '', name: '', role: 'reader' });
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'role-badge admin';
      case 'editor': return 'role-badge editor';
      default: return 'role-badge reader';
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-left">
          <h1><Shield size={28} /> User Management</h1>
          <p>Manage user accounts and permissions</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
          </button>
          <button className="add-user-btn" onClick={() => setShowAddUser(true)}>
            <Plus size={20} />
            Add User
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddUser && (
        <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="reader">Reader</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddUser(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-stats">
        <div className="stat-card">
          <Users size={24} />
          <div className="stat-info">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck size={24} />
          <div className="stat-info">
            <span className="stat-value">{users.filter(u => u.role === 'admin').length}</span>
            <span className="stat-label">Admins</span>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck size={24} />
          <div className="stat-info">
            <span className="stat-value">{users.filter(u => u.role === 'editor').length}</span>
            <span className="stat-label">Editors</span>
          </div>
        </div>
        <div className="stat-card">
          <UserX size={24} />
          <div className="stat-info">
            <span className="stat-value">{users.filter(u => u.role === 'reader').length}</span>
            <span className="stat-label">Readers</span>
          </div>
        </div>
      </div>

      <div className="users-list">
        <h2>All Users</h2>
        {isLoading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>MFA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="user-name-cell">
                    {u.name}
                    {u.id === user?.id && <span className="you-badge">You</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className={getRoleBadgeClass(u.role)}
                      disabled={u.id === user?.id}
                    >
                      <option value="reader">Reader</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`mfa-badge ${u.mfaEnabled ? 'enabled' : 'disabled'}`}>
                      {u.mfaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      disabled={u.id === user?.id}
                      title={u.id === user?.id ? "Cannot delete yourself" : "Delete user"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
