import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const SearchResults = () => {
  const query = new URLSearchParams(useLocation().search).get('q');
  const [restaurants, setRestaurants] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      Promise.all([
        axios.get(`http://localhost:5000/api/restaurants?search=${query}`),
        axios.get(`http://localhost:5000/api/menu-items/search?q=${query}`)
      ]).then(([resR, resF]) => {
        setRestaurants(resR.data);
        setFoodItems(resF.data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [query]);

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
      </div>
    );
  }

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

      <h2>Dishes ({foodItems.length})</h2>
      <div className="menu-grid">
        {foodItems.map(item => (
          <div key={item._id} className="menu-card">
            <img src={item.image} alt={item.name} style={{ height: '160px' }} />
            <div className="content">
              <h3>{item.name}</h3>
              <p>From: {item.restaurantId?.name}</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff6b35' }}>${item.price}</p>
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