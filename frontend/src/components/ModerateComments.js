import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const ModerateComments = () => {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [reasonCodes, setReasonCodes] = useState([]);
  const [decision, setDecision] = useState({});

  useEffect(() => {
    axios.get(`${API_BASE}/reason-codes/comment`).then(r => setReasonCodes(r.data));
  }, []);

  useEffect(() => { fetchComments(); }, [filter]);

  const fetchComments = async () => {
    const res = await axios.get(`${API_BASE}/admin/comments?status=${filter}`, { headers: adminAuthHeader() });
    setComments(res.data);
  };

  const handleModerate = async (id, status) => {
    const d = decision[id] || {};
    const body = { status };
    if (status !== 'approved') {
      if (!d.reasonCode) { alert('Pick a reason code'); return; }
      body.reasonCode = d.reasonCode;
      body.reason = d.reason || '';
    }
    await axios.patch(`${API_BASE}/admin/comments/${id}/moderate`, body, { headers: adminAuthHeader() });
    fetchComments();
  };

  const escalate = async (id) => {
    await axios.patch(`${API_BASE}/admin/comments/${id}/escalate`, {}, { headers: adminAuthHeader() });
    fetchComments();
  };

  return (
    <div>
      <div className="gap-10" style={{ marginBottom: '20px' }}>
        {['pending', 'approved', 'rejected', 'soft_removed'].map(s => (
          <button key={s} className={`btn-secondary ${filter === s ? 'active-pill' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      {comments.length === 0 && <p>No comments here.</p>}
      {comments.map(comment => (
        <div key={comment._id} className="review-card">
          <p><strong>{comment.userId?.name}</strong> {comment.userId?.isFlagged && <span className="badge-flag">FLAGGED</span>} on review: "{comment.reviewId?.comment?.substring(0, 100)}..."</p>
          <p>{comment.commentText}</p>
          <p>Status: {comment.status} {comment.reportCount > 0 && ` · ${comment.reportCount} reports`}</p>
          {(filter === 'pending' || filter === 'approved') && (
            <div className="mod-decide">
              <select value={decision[comment._id]?.reasonCode || ''} onChange={e => setDecision(prev => ({ ...prev, [comment._id]: { ...prev[comment._id], reasonCode: e.target.value } }))}>
                <option value="">— reason code —</option>
                {reasonCodes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Note" value={decision[comment._id]?.reason || ''}
                onChange={e => setDecision(prev => ({ ...prev, [comment._id]: { ...prev[comment._id], reason: e.target.value } }))} />
              <button className="btn-primary" onClick={() => handleModerate(comment._id, 'approved')}>Approve</button>
              <button className="btn-danger" onClick={() => handleModerate(comment._id, 'rejected')}>Reject</button>
              <button className="btn-secondary" onClick={() => handleModerate(comment._id, 'soft_removed')}>Soft-remove</button>
              {!comment.isEscalated && <button className="btn-secondary" onClick={() => escalate(comment._id)}>Escalate</button>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ModerateComments;
