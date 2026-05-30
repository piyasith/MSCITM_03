import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const ManageSettings = () => {
  const [s, setS] = useState(null);
  const [message, setMessage] = useState('');

  const fetchS = async () => {
    const res = await axios.get(`${API_BASE}/admin/settings`, { headers: adminAuthHeader() });
    setS(res.data);
  };
  useEffect(() => { fetchS(); }, []);

  const save = async () => {
    const res = await axios.put(`${API_BASE}/admin/settings`, s, { headers: adminAuthHeader() });
    setS(res.data);
    setMessage('Saved');
    setTimeout(() => setMessage(''), 2000);
  };

  if (!s) return <div className="loading"><i className="fas fa-spinner fa-spin"></i></div>;

  const weightKeys = [
    ['foodQuality', 'Food Quality'],
    ['customerService', 'Customer Service'],
    ['ambienceCleanliness', 'Ambience & Cleanliness'],
    ['valueForMoney', 'Value for Money'],
    ['bookingExperience', 'Booking / Experience'],
    ['miscellaneous', 'Miscellaneous']
  ];

  const sum = weightKeys.reduce((acc, [k]) => acc + Number(s.weights[k] || 0), 0);

  return (
    <div>
      {message && <div className="alert alert-success">{message}</div>}
      <h3>Category Weights (used in weighted ranking)</h3>
      <p style={{ fontSize: 13, color: '#666' }}>Sum: {sum.toFixed(2)} (weights are normalised internally)</p>
      {weightKeys.map(([k, label]) => (
        <div key={k} className="form-group">
          <label>{label}</label>
          <input type="number" step="0.01" min="0" max="1" value={s.weights[k]}
            onChange={e => setS({ ...s, weights: { ...s.weights, [k]: parseFloat(e.target.value) } })} />
        </div>
      ))}

      <h3>Ranking Eligibility & Recency</h3>
      <div className="form-group">
        <label>Minimum approved reviews to be eligible for ranking</label>
        <input type="number" min="0" value={s.minReviewCountForRanking}
          onChange={e => setS({ ...s, minReviewCountForRanking: parseInt(e.target.value, 10) })} />
      </div>
      <div className="form-group">
        <label>Recency half-life (days) — recent reviews count more</label>
        <input type="number" min="1" value={s.recencyHalfLifeDays}
          onChange={e => setS({ ...s, recencyHalfLifeDays: parseInt(e.target.value, 10) })} />
      </div>

      <h3>Trending</h3>
      <div className="form-group">
        <label>Trending window (days)</label>
        <input type="number" min="1" value={s.trendingWindowDays}
          onChange={e => setS({ ...s, trendingWindowDays: parseInt(e.target.value, 10) })} />
      </div>
      <div className="form-group">
        <label>Minimum recent reviews to appear in Trending</label>
        <input type="number" min="1" value={s.trendingMinReviews}
          onChange={e => setS({ ...s, trendingMinReviews: parseInt(e.target.value, 10) })} />
      </div>

      <h3>Auto-escalation</h3>
      <div className="form-group">
        <label>Reports needed to auto-escalate content</label>
        <input type="number" min="1" value={s.reportThresholdForEscalation}
          onChange={e => setS({ ...s, reportThresholdForEscalation: parseInt(e.target.value, 10) })} />
      </div>
      <div className="form-group">
        <label>User strikes to auto-flag</label>
        <input type="number" min="1" value={s.strikeThresholdForFlag}
          onChange={e => setS({ ...s, strikeThresholdForFlag: parseInt(e.target.value, 10) })} />
      </div>

      <button className="btn-primary" onClick={save}>Save Settings</button>
    </div>
  );
};

export default ManageSettings;
