import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModerateReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [responseText, setResponseText] = useState({});
  const token = localStorage.getItem('adminToken');

  useEffect(() => { fetchReviews(); }, [filter]);

  const fetchReviews = async () => {
    const res = await axios.get(`http://localhost:5000/api/admin/reviews?status=${filter}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setReviews(res.data);
  };

  const handleModerate = async (id, status) => {
    await axios.patch(`http://localhost:5000/api/admin/reviews/${id}/moderate`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchReviews();
  };

  const handleResponse = async (id) => {
    await axios.put(`http://localhost:5000/api/admin/reviews/${id}/response`, { response: responseText[id] }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setResponseText({ ...responseText, [id]: '' });
    fetchReviews();
  };

  const renderStars = (r) => '★'.repeat(r) + '☆'.repeat(5 - r);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <button className="btn-secondary" onClick={() => setFilter('pending')}>Pending</button>
        <button className="btn-secondary" onClick={() => setFilter('approved')}>Approved</button>
        <button className="btn-secondary" onClick={() => setFilter('rejected')}>Rejected</button>
      </div>
      {reviews.map(review => (
        <div key={review._id} className="review-card">
          <div className="review-header">
            <span className="reviewer-name">{review.userName}</span>
            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
          <p><strong>Restaurant:</strong> {review.restaurantId?.name}</p>
          <div>Food: {renderStars(review.foodQualityRating)} Service: {renderStars(review.customerServiceRating)} Misc: {renderStars(review.miscellaneousRating)}</div>
          <p>{review.comment}</p>
          <p><strong>Status:</strong> {review.status}</p>
          {filter === 'pending' && (
            <div className="gap-10">
              <button className="btn-primary" onClick={() => handleModerate(review._id, 'approved')}>Approve</button>
              <button className="btn-danger" onClick={() => handleModerate(review._id, 'rejected')}>Reject</button>
            </div>
          )}
          <div className="mt-20">
            <textarea placeholder="Company response..." value={responseText[review._id] || ''} onChange={e => setResponseText({...responseText, [review._id]: e.target.value})} rows="2" className="form-group"></textarea>
            <button className="btn-secondary" onClick={() => handleResponse(review._id)}>Post Response</button>
          </div>
          {review.companyResponse && <div className="company-response"><strong>Response:</strong> {review.companyResponse}</div>}
        </div>
      ))}
    </div>
  );
};

export default ModerateReviews;