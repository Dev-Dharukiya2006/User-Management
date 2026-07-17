import React, { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import UserTable from '../components/UserTable.jsx';
import UserFormModal from '../components/UserFormModal.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateClick = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditClick = (u) => {
    setEditingUser(u);
    setShowModal(true);
  };

  const handleDeleteClick = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user.');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>User Management</h1>
        <div className="header-right">
          <span>Hi, {user?.name}</span>
          <button className="btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-toolbar">
        <button className="btn-primary" onClick={handleCreateClick}>
          + Add User
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <UserTable users={users} onEdit={handleEditClick} onDelete={handleDeleteClick} />
      )}

      {showModal && (
        <UserFormModal
          initialData={editingUser}
          onClose={() => setShowModal(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
