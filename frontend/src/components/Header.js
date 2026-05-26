import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('adminToken');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

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
          {isAdmin ? (
            <Link to="/admin/dashboard">Admin Panel</Link>
          ) : (
            <Link to="/admin/login">Admin Login</Link>
          )}
          {user ? (
            <>
              <span>Welcome, {user.name}</span>
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