import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const ModerateCompanyResponses = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [reasonCodes, setReasonCodes] = useState([]);
  const [decision, setDecision] = useState({});

  useEffect(() => {
    axios.get(`${API_BASE}/reason-codes/review`).then(r => setReasonCodes(r.data));
  }, []);

  useEffect(() => { fetchItems(); }, [filter]);

  const fetchItems = async () => {
    const res = await axios.get(`${API_BASE}/admin/company-responses?status=${filter}`, { headers: adminAuthHeader() });
    setItems(res.data);
  };

  const moderate = async (id, status) => {
    const d = decision[id] || {};
    const body = { status };
    if (status !== 'approved') {
      if (!d.reasonCode) { alert('Pick a reason code'); return; }
      body.reasonCode = d.reasonCode;
      body.reason = d.reason || '';
    }
    await axios.patch(`${API_BASE}/admin/company-responses/${id}/moderate`, body, { headers: adminAuthHeader() });
    fetchItems();
  };

  return (
    <div>
      <div className="gap-10" style={{ marginBottom: '20px' }}>
        {['pending', 'approved', 'rejected', 'soft_removed'].map(s => (
          <button key={s} className={`btn-secondary ${filter === s ? 'active-pill' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      {items.length === 0 && <p>No responses here.</p>}
      {items.map(r => (
        <div key={r._id} className="review-card">
          <p><strong>{r.authorName}</strong> ({r.authorType}) on review: "{r.reviewId?.comment?.substring(0, 80)}..."</p>
          <p>{r.text}</p>
          <p>Status: {r.status}</p>
          {(filter === 'pending' || filter === 'approved') && (
            <div className="mod-decide">
              <select value={decision[r._id]?.reasonCode || ''} onChange={e => setDecision(prev => ({ ...prev, [r._id]: { ...prev[r._id], reasonCode: e.target.value } }))}>
                <option value="">— reason code —</option>
                {reasonCodes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Note" value={decision[r._id]?.reason || ''} onChange={e => setDecision(prev => ({ ...prev, [r._id]: { ...prev[r._id], reason: e.target.value } }))} />
              <button className="btn-primary" onClick={() => moderate(r._id, 'approved')}>Approve</button>
              <button className="btn-danger" onClick={() => moderate(r._id, 'rejected')}>Reject</button>
              <button className="btn-secondary" onClick={() => moderate(r._id, 'soft_removed')}>Soft-remove</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ModerateCompanyResponses;
