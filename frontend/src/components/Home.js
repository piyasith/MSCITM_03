import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async (query = '') => {
    setLoading(true);
    try {
      const url = `http://localhost:5000/api/restaurants${query ? `?search=${query}` : ''}`;
      const res = await axios.get(url);
      setRestaurants(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants(search);
  };

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = '★'.repeat(full);
    if (half) stars += '½';
    stars += '☆'.repeat(5 - stars.length);
    return <span className="stars">{stars}</span>;
  };

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading delicious restaurants...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="text-center" style={{ margin: '40px 0' }}>
        <h1>Discover Amazing Dining</h1>
        <p>Read authentic reviews from food lovers</p>
      </div>
      <form onSubmit={handleSearch} className="search-bar" style={{ maxWidth: '600px', margin: '0 auto 30px' }}>
        <input
          type="text"
          placeholder="Search by restaurant name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-search">Search</button>
      </form>
      {restaurants.length === 0 ? (
        <div className="text-center" style={{ padding: '60px' }}>
          <i className="fas fa-search" style={{ fontSize: '64px', color: '#ccc' }}></i>
          <h3>No restaurants found</h3>
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants.map((r) => (
            <Link to={`/restaurant/${r._id}`} key={r._id} style={{ textDecoration: 'none' }}>
              <div className="restaurant-card">
                <img src={r.image} alt={r.name} style={{ height: '220px' }} />
                <div className="content">
                  <h3>{r.name}</h3>
                  <p>{r.cuisine}</p>
                  <div className="flex-between">
                    {renderStars(r.averageRating || 0)}
                    <span>({r.reviewCount || 0} reviews)</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;