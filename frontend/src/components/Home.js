import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE } from '../api';

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '', cuisine: '', location: '', priceRange: '', dietary: '', minRating: '', sort: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await axios.get(`${API_BASE}/restaurants?${params.toString()}`);
      setRestaurants(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  useEffect(() => {
    axios.get(`${API_BASE}/restaurants/trending?limit=4`).then(r => setTrending(r.data)).catch(() => {});
  }, []);

  const handleSubmit = (e) => { e.preventDefault(); fetchRestaurants(); };
  const updateFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ search: '', cuisine: '', location: '', priceRange: '', dietary: '', minRating: '', sort: '' });

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = '★'.repeat(full);
    if (half) stars += '½';
    stars += '☆'.repeat(Math.max(0, 5 - stars.length));
    return <span className="stars">{stars}</span>;
  };

  return (
    <div className="container">
      <div className="text-center" style={{ margin: '40px 0' }}>
        <h1>Discover Amazing Dining</h1>
        <p>Read authentic reviews from food lovers</p>
      </div>

      <form onSubmit={handleSubmit} className="search-bar" style={{ maxWidth: '700px', margin: '0 auto 16px' }}>
        <input
          type="text"
          placeholder="Search by restaurant name..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
        <button type="submit" className="btn-search">Search</button>
        <button type="button" className="btn-secondary" onClick={() => setShowFilters(s => !s)}>
          <i className="fas fa-filter"></i> Filters
        </button>
      </form>

      {showFilters && (
        <div className="admin-panel filter-panel" style={{ maxWidth: '900px', margin: '0 auto 30px' }}>
          <div className="filter-grid">
            <div className="form-group">
              <label>Cuisine</label>
              <input type="text" placeholder="e.g. Italian, Indian" value={filters.cuisine} onChange={e => updateFilter('cuisine', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" placeholder="City / area" value={filters.location} onChange={e => updateFilter('location', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Price Range</label>
              <select value={filters.priceRange} onChange={e => updateFilter('priceRange', e.target.value)}>
                <option value="">Any</option>
                {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Dietary Tags (comma-separated)</label>
              <input type="text" placeholder="vegetarian, vegan, gluten-free" value={filters.dietary} onChange={e => updateFilter('dietary', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Minimum Rating</label>
              <select value={filters.minRating} onChange={e => updateFilter('minRating', e.target.value)}>
                <option value="">Any</option>
                <option value="3">3+</option>
                <option value="3.5">3.5+</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sort</label>
              <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}>
                <option value="">Newest</option>
                <option value="rating">Rating</option>
                <option value="reviews">Most reviewed</option>
              </select>
            </div>
          </div>
          <div className="gap-10">
            <button type="button" className="btn-primary" onClick={fetchRestaurants}>Apply</button>
            <button type="button" className="btn-secondary" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      )}

      {trending && trending.length > 0 && (
        <>
          <h2><i className="fas fa-fire"></i> Trending Now</h2>
          <div className="restaurants-grid">
            {trending.map(r => (
              <Link to={`/restaurant/${r._id}`} key={r._id} style={{ textDecoration: 'none' }}>
                <div className="restaurant-card">
                  <img src={r.image} alt={r.name} style={{ height: '200px' }} />
                  <div className="content">
                    <h3>{r.name} <span className="badge-trending">TRENDING</span></h3>
                    <p>{r.cuisine} · {r.priceRange || ''}</p>
                    <div className="flex-between">
                      {renderStars(r.weightedRating || 0)}
                      <span>{r.recentReviewCount} recent</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2>All Restaurants</h2>
      {loading ? (
        <div className="loading"><i className="fas fa-spinner fa-spin"></i></div>
      ) : restaurants.length === 0 ? (
        <div className="text-center" style={{ padding: '60px' }}>
          <i className="fas fa-search" style={{ fontSize: '64px', color: '#ccc' }}></i>
          <h3>No restaurants match your filters</h3>
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants.map((r) => (
            <Link to={`/restaurant/${r._id}`} key={r._id} style={{ textDecoration: 'none' }}>
              <div className="restaurant-card">
                <img src={r.image} alt={r.name} style={{ height: '220px' }} />
                <div className="content">
                  <h3>{r.name}</h3>
                  <p>{r.cuisine} {r.priceRange ? `· ${r.priceRange}` : ''}</p>
                  {r.location && <p style={{ fontSize: '13px' }}><i className="fas fa-map-marker-alt"></i> {r.location}</p>}
                  {r.tags && r.tags.length > 0 && (
                    <div className="tag-row">
                      {r.tags.slice(0, 3).map(t => <span key={t} className="tag-chip">{t}</span>)}
                    </div>
                  )}
                  <div className="flex-between">
                    {renderStars(r.weightedRating || r.averageRating || 0)}
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
