import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, userAuthHeader } from '../api';

const Header = () => {
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('adminToken');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const tick = async () => {
      try {
        const res = await axios.get(`${API_BASE}/user/notifications/unread-count`, { headers: userAuthHeader() });
        if (alive) setUnread(res.data.count || 0);
      } catch (_) {}
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">
          <i className="fas fa-utensils"></i> FlavorCritic
        </Link>
        <form onSubmit={handleSubmit} className="search-bar">
          <input
            type="text"
            placeholder="Search restaurants or dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-search">Search</button>
        </form>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/top-rated">Top Rated</Link>
          {isAdmin ? (
            <Link to="/admin/dashboard">Admin Panel</Link>
          ) : (
            <Link to="/admin/login">Admin Login</Link>
          )}
          {user ? (
            <>
              <Link to="/user/dashboard" className="notif-link">
                <i className="fas fa-bell"></i>
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </Link>
              <Link to="/user/dashboard">My Account</Link>
              <span>Hi, {user.name}</span>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '5px 15px' }}>Logout</button>
            </>
          ) : (
            <Link to="/user/login">User Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
