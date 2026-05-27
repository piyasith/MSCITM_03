import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE } from '../api';

const TopRated = () => {
  const [topRated, setTopRated] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/restaurants/top-rated?limit=10`).then(r => setTopRated(r.data)).catch(() => {});
    axios.get(`${API_BASE}/restaurants/trending?limit=10`).then(r => setTrending(r.data)).catch(() => {});
  }, []);

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = '★'.repeat(full);
    if (half) stars += '½';
    stars += '☆'.repeat(Math.max(0, 5 - stars.length));
    return <span className="stars">{stars}</span>;
  };

  const Card = ({ r, label }) => (
    <Link to={`/restaurant/${r._id}`} key={r._id} style={{ textDecoration: 'none' }}>
      <div className="restaurant-card">
        <img src={r.image} alt={r.name} style={{ height: '200px' }} />
        <div className="content">
          <h3>{r.name} {label && <span className="badge-trending">{label}</span>}</h3>
          <p>{r.cuisine} {r.priceRange ? `· ${r.priceRange}` : ''}</p>
          <div className="flex-between">
            {renderStars(r.weightedRating || 0)}
            <span>({r.reviewCount} reviews)</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="container">
      <h1 style={{ margin: '30px 0' }}><i className="fas fa-trophy"></i> Top Rated</h1>
      {topRated.length === 0 ? <p>No eligible restaurants yet (need minimum approved reviews).</p> : (
        <div className="restaurants-grid">{topRated.map(r => <Card key={r._id} r={r} />)}</div>
      )}

      <h1 style={{ margin: '30px 0' }}><i className="fas fa-fire"></i> Trending</h1>
      {trending.length === 0 ? <p>Nothing trending right now.</p> : (
        <div className="restaurants-grid">{trending.map(r => <Card key={r._id} r={r} label="TRENDING" />)}</div>
      )}
    </div>
  );
};

export default TopRated;
