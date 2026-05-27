import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const Card = ({ label, value, color }) => (
  <div className="metric-card" style={{ borderTop: `4px solid ${color || '#ff6b35'}` }}>
    <div className="metric-value">{value}</div>
    <div className="metric-label">{label}</div>
  </div>
);

const AdminAnalytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/admin/dashboard/summary`, { headers: adminAuthHeader() })
      .then(r => setData(r.data));
  }, []);

  if (!data) return <div className="loading"><i className="fas fa-spinner fa-spin"></i></div>;

  const { counts, moderationSlaMinutes, reviewVolumeTrend, ratingTrend } = data;
  const maxVol = Math.max(1, ...reviewVolumeTrend.map(d => d.submitted));
  const maxRating = 5;

  return (
    <div>
      <h3>Overview</h3>
      <div className="metric-grid">
        <Card label="Restaurants" value={counts.totalRestaurants} color="#ff6b35" />
        <Card label="Users" value={counts.totalUsers} color="#36b9cc" />
        <Card label="Total Reviews" value={counts.totalReviews} color="#1cc88a" />
        <Card label="Pending Reviews" value={counts.pendingReviews} color="#f6c23e" />
        <Card label="Approved Reviews" value={counts.approvedReviews} color="#1cc88a" />
        <Card label="Rejected Reviews" value={counts.rejectedReviews} color="#e74a3b" />
        <Card label="Pending Comments" value={counts.pendingComments} color="#f6c23e" />
        <Card label="Pending Responses" value={counts.pendingResponses} color="#f6c23e" />
        <Card label="Open Reports" value={counts.openReports} color="#e74a3b" />
        <Card label="Escalated" value={counts.escalatedReviews} color="#9b59b6" />
        <Card label="Flagged Users" value={counts.flaggedUsers} color="#e74a3b" />
        <Card label="Moderation SLA (min)" value={moderationSlaMinutes} color="#36b9cc" />
      </div>

      <h3 style={{ marginTop: 30 }}>Review Volume (last 14 days)</h3>
      <div className="bar-chart">
        {reviewVolumeTrend.map(d => (
          <div key={d.date} className="bar-col">
            <div className="bar" style={{ height: `${(d.submitted / maxVol) * 100}%` }} title={`${d.submitted} submitted`}></div>
            <div className="bar-label">{d.date.slice(5)}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 30 }}>Rating Trend (last 8 weeks)</h3>
      <div className="bar-chart">
        {ratingTrend.map(d => (
          <div key={d.weekStart} className="bar-col">
            <div className="bar" style={{ height: `${(d.avgRating / maxRating) * 100}%`, background: '#36b9cc' }} title={`${d.avgRating} avg (${d.count} reviews)`}></div>
            <div className="bar-label">{d.weekStart.slice(5)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnalytics;
