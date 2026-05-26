import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModerateComments = () => {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const token = localStorage.getItem('adminToken');

  useEffect(() => { fetchComments(); }, [filter]);

  const fetchComments = async () => {
    const res = await axios.get(`http://localhost:5000/api/admin/comments?status=${filter}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setComments(res.data);
  };

  const handleModerate = async (id, status) => {
    await axios.patch(`http://localhost:5000/api/admin/comments/${id}/moderate`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchComments();
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <button className="btn-secondary" onClick={() => setFilter('pending')}>Pending</button>
        <button className="btn-secondary" onClick={() => setFilter('approved')}>Approved</button>
        <button className="btn-secondary" onClick={() => setFilter('rejected')}>Rejected</button>
      </div>
      {comments.map(comment => (
        <div key={comment._id} className="review-card">
          <p><strong>{comment.userName}</strong> on review: "{comment.reviewId?.comment?.substring(0, 100)}..."</p>
          <p>Comment: {comment.commentText}</p>
          <p>Status: {comment.status}</p>
          {filter === 'pending' && (
            <div className="gap-10">
              <button className="btn-primary" onClick={() => handleModerate(comment._id, 'approved')}>Approve</button>
              <button className="btn-danger" onClick={() => handleModerate(comment._id, 'rejected')}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ModerateComments;