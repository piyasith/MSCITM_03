import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const ModerateReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [escalated, setEscalated] = useState(false);
  const [reasonCodes, setReasonCodes] = useState([]);
  const [decision, setDecision] = useState({});
  const [audit, setAudit] = useState({});

  useEffect(() => {
    axios.get(`${API_BASE}/reason-codes/review`).then(r => setReasonCodes(r.data));
  }, []);

  useEffect(() => { fetchReviews(); }, [filter, escalated]);

  const fetchReviews = async () => {
    const params = new URLSearchParams();
    if (filter) params.append('status', filter);
    if (escalated) params.append('escalated', 'true');
    const res = await axios.get(`${API_BASE}/admin/reviews?${params.toString()}`, { headers: adminAuthHeader() });
    setReviews(res.data);
  };

  const handleModerate = async (id, status) => {
    const d = decision[id] || {};
    const body = { status };
    if (status !== 'approved') {
      if (!d.reasonCode) { alert('Pick a reason code'); return; }
      body.reasonCode = d.reasonCode;
      body.reason = d.reason || '';
    }
    await axios.patch(`${API_BASE}/admin/reviews/${id}/moderate`, body, { headers: adminAuthHeader() });
    fetchReviews();
  };

  const escalate = async (id) => {
    await axios.patch(`${API_BASE}/admin/reviews/${id}/escalate`, { reason: 'flagged by moderator' }, { headers: adminAuthHeader() });
    fetchReviews();
  };

  const fetchAudit = async (id) => {
    if (audit[id]) { setAudit(prev => ({ ...prev, [id]: undefined })); return; }
    const res = await axios.get(`${API_BASE}/admin/dashboard/audit?targetType=review&targetId=${id}`, { headers: adminAuthHeader() });
    setAudit(prev => ({ ...prev, [id]: res.data }));
  };

  const renderStars = (r) => '★'.repeat(r) + '☆'.repeat(5 - r);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: 10 }}>
        <div className="gap-10">
          {['pending', 'approved', 'rejected', 'soft_removed'].map(s => (
            <button key={s} className={`btn-secondary ${filter === s ? 'active-pill' : ''}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={escalated} onChange={e => setEscalated(e.target.checked)} /> Escalated only
        </label>
      </div>

      {reviews.length === 0 && <p>No reviews in this queue.</p>}
      {reviews.map(review => (
        <div key={review._id} className="review-card">
          <div className="review-header">
            <div>
              <span className="reviewer-name">{review.userName}</span>
              {review.userId?.isFlagged && <span className="badge-flag">FLAGGED USER</span>}
              {review.isEscalated && <span className="badge-flag">ESCALATED</span>}
            </div>
            <span>{new Date(review.createdAt).toLocaleString()}</span>
          </div>
          <p><strong>Restaurant:</strong> {review.restaurantId?.name}</p>
          {review.menuItemName && <p><strong>Item:</strong> {review.menuItemName}</p>}
          <div className="rating-rows">
            <div>Food: {renderStars(review.foodQualityRating)}</div>
            <div>Service: {renderStars(review.customerServiceRating)}</div>
            <div>Ambience: {renderStars(review.ambienceCleanlinessRating)}</div>
            <div>Value: {renderStars(review.valueForMoneyRating)}</div>
            <div>Booking: {renderStars(review.bookingExperienceRating)}</div>
            {review.miscellaneousRating && <div>Misc: {renderStars(review.miscellaneousRating)}</div>}
          </div>
          <p>{review.comment}</p>
          {review.miscellaneousText && <p style={{ fontStyle: 'italic' }}>{review.miscellaneousText}</p>}
          <p>
            <strong>Status:</strong> {review.status}
            {review.moderationReasonCode && ` · reason: ${review.moderationReasonCode}`}
            {review.reportCount > 0 && ` · ${review.reportCount} reports`}
          </p>
          {(filter === 'pending' || filter === 'approved') && (
            <div className="mod-decide">
              <select
                value={decision[review._id]?.reasonCode || ''}
                onChange={e => setDecision(prev => ({ ...prev, [review._id]: { ...prev[review._id], reasonCode: e.target.value } }))}
              >
                <option value="">— reason code —</option>
                {reasonCodes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                placeholder="Optional note"
                value={decision[review._id]?.reason || ''}
                onChange={e => setDecision(prev => ({ ...prev, [review._id]: { ...prev[review._id], reason: e.target.value } }))}
              />
              <button className="btn-primary" onClick={() => handleModerate(review._id, 'approved')}>Approve</button>
              <button className="btn-danger" onClick={() => handleModerate(review._id, 'rejected')}>Reject</button>
              <button className="btn-secondary" onClick={() => handleModerate(review._id, 'soft_removed')}>Soft-remove</button>
              {!review.isEscalated && <button className="btn-secondary" onClick={() => escalate(review._id)}>Escalate</button>}
            </div>
          )}
          <button className="btn-link" onClick={() => fetchAudit(review._id)}>
            {audit[review._id] ? 'Hide audit trail' : 'Show audit trail'}
          </button>
          {audit[review._id] && (
            <div className="audit-trail">
              {audit[review._id].map(a => (
                <div key={a._id} className="audit-row">
                  <span>{new Date(a.createdAt).toLocaleString()}</span>
                  <strong>{a.action}</strong>
                  <span>{a.actorType}{a.actorEmail ? ` (${a.actorEmail})` : ''}</span>
                  <span>{a.reasonCode}{a.reason ? ` - ${a.reason}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ModerateReviews;
