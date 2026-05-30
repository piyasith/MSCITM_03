import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../api';

const SearchResults = () => {
  const params = new URLSearchParams(useLocation().search);
  const query = params.get('q') || '';
  const [restaurants, setRestaurants] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    setLoading(true);
    const restPromise = axios.get(`${API_BASE}/restaurants?search=${encodeURIComponent(query)}`);
    const itemUrl = `${API_BASE}/menu-items/search?q=${encodeURIComponent(query)}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
    const itemPromise = axios.get(itemUrl);
    Promise.all([restPromise, itemPromise])
      .then(([resR, resF]) => { setRestaurants(resR.data); setFoodItems(resF.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [query, category]);

  if (loading) return <div className="loading"><i className="fas fa-spinner fa-spin"></i></div>;

  return (
    <div className="container">
      <h1 className="text-center" style={{ margin: '30px 0' }}>Search Results for "{query}"</h1>

      <h2>Restaurants ({restaurants.length})</h2>
      <div className="restaurants-grid">
        {restaurants.map(r => (
          <Link to={`/restaurant/${r._id}`} key={r._id} style={{ textDecoration: 'none' }}>
            <div className="restaurant-card">
              <img src={r.image} alt={r.name} style={{ height: '200px' }} />
              <div className="content">
                <h3>{r.name}</h3>
                <p>{r.cuisine}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex-between" style={{ marginTop: '40px' }}>
        <h2>Dishes ({foodItems.length})</h2>
        <div className="form-group" style={{ margin: 0, minWidth: '220px' }}>
          <input type="text" placeholder="Filter by item category" value={category} onChange={e => setCategory(e.target.value)} />
        </div>
      </div>
      <div className="menu-grid">
        {foodItems.map(item => (
          <div key={item._id} className="menu-card">
            <img src={item.image} alt={item.imageAlt || item.name} style={{ height: '160px' }} />
            <div className="content">
              <h3>{item.name}</h3>
              <p style={{ fontSize: '12px', color: '#888' }}>{item.category}</p>
              <p>From: {item.restaurantId?.name}</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff6b35' }}>${Number(item.price).toFixed(2)}</p>
              {!item.isAvailable && <span className="badge-unavailable">Unavailable</span>}
              <Link to={`/restaurant/${item.restaurantId?._id}`} className="btn-secondary" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px' }}>
                View Restaurant
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
