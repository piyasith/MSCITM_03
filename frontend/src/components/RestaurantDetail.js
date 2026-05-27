import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, userAuthHeader } from '../api';

const emptyReview = {
  foodQualityRating: 5,
  customerServiceRating: 5,
  ambienceCleanlinessRating: 5,
  valueForMoneyRating: 5,
  bookingExperienceRating: 5,
  miscellaneousRating: 5,
  miscellaneousText: '',
  comment: '',
  menuItemId: ''
};

const REPORT_CODES = ['spam', 'abuse', 'hate_speech', 'misinformation', 'off_topic', 'personal_info', 'other'];

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState(emptyReview);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [message, setMessage] = useState('');
  const [responseDrafts, setResponseDrafts] = useState({});
  const [reportTarget, setReportTarget] = useState(null);
  const [reportData, setReportData] = useState({ reasonCode: 'spam', details: '' });

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userToken = localStorage.getItem('userToken');
  const adminToken = localStorage.getItem('adminToken');
  const isCompanyRep = user && user.role === 'company_rep' && String(user.representsRestaurantId) === String(id);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/restaurants/${id}`);
      setRestaurant(res.data);
      setMenu(res.data.menuItems);
      setReviews(res.data.reviews);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchComments = async (reviewId) => {
    if (commentsData[reviewId]) return;
    try {
      const res = await axios.get(`${API_BASE}/reviews/${reviewId}/comments`);
      setCommentsData(prev => ({ ...prev, [reviewId]: res.data }));
    } catch (err) { console.error(err); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userToken) { setMessage('Please login to submit a review'); return; }
    try {
      const payload = { ...newReview, restaurantId: id, userName: user.name, userEmail: user.email };
      if (!payload.menuItemId) delete payload.menuItemId;
      await axios.post(`${API_BASE}/reviews`, payload, { headers: userAuthHeader() });
      setMessage('Review submitted! Pending moderation.');
      setShowReviewForm(false);
      setNewReview(emptyReview);
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error submitting review');
    }
  };

  const handleCommentSubmit = async (reviewId) => {
    if (!commentText[reviewId]?.trim()) return;
    if (!userToken) { setMessage('Please login to comment'); return; }
    try {
      await axios.post(`${API_BASE}/reviews/${reviewId}/comments`,
        { commentText: commentText[reviewId] },
        { headers: userAuthHeader() }
      );
      setCommentText(prev => ({ ...prev, [reviewId]: '' }));
      setMessage('Comment submitted! Pending moderation.');
      setCommentsData(prev => ({ ...prev, [reviewId]: undefined }));
      fetchComments(reviewId);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error submitting comment');
    }
  };

  const handleCompanyResponse = async (reviewId) => {
    const text = responseDrafts[reviewId];
    if (!text?.trim()) return;
    const token = adminToken || userToken;
    if (!token) { setMessage('Login required'); return; }
    try {
      await axios.post(`${API_BASE}/reviews/${reviewId}/responses`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponseDrafts(prev => ({ ...prev, [reviewId]: '' }));
      setMessage('Response submitted (pending moderation).');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error submitting response');
    }
  };

  const openReport = (targetType, targetId) => {
    if (!userToken) { setMessage('Login to report'); return; }
    setReportTarget({ targetType, targetId });
    setReportData({ reasonCode: 'spam', details: '' });
  };

  const submitReport = async () => {
    try {
      await axios.post(`${API_BASE}/reports`,
        { ...reportTarget, ...reportData },
        { headers: userAuthHeader() }
      );
      setReportTarget(null);
      setMessage('Report submitted. Thank you for keeping our community safe.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error reporting');
    }
  };

  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  if (loading) return <div className="loading"><i className="fas fa-spinner fa-spin"></i></div>;
  if (!restaurant) return <div className="container">Restaurant not found</div>;

  return (
    <div className="container">
      {message && <div className="alert alert-success">{message}</div>}

      <div className="restaurant-header">
        <img src={restaurant.image} alt={restaurant.name} className="restaurant-image" />
        <h1>{restaurant.name} {restaurant.priceRange && <span className="price-pill">{restaurant.priceRange}</span>}</h1>
        <p>{restaurant.description}</p>
        <p><i className="fas fa-map-marker-alt"></i> {restaurant.address}{restaurant.location ? ` · ${restaurant.location}` : ''}</p>
        <p><i className="fas fa-utensils"></i> {restaurant.cuisine}{restaurant.cuisines && restaurant.cuisines.length > 0 ? ` (${restaurant.cuisines.join(', ')})` : ''}</p>

        {restaurant.tags && restaurant.tags.length > 0 && (
          <div className="tag-row">
            {restaurant.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
          </div>
        )}
        {restaurant.dietaryTags && restaurant.dietaryTags.length > 0 && (
          <div className="tag-row">
            {restaurant.dietaryTags.map(t => <span key={t} className="tag-chip tag-diet">{t}</span>)}
          </div>
        )}

        <div className="stars">
          {renderStars(Math.round(restaurant.weightedRating || restaurant.averageRating || 0))}
          <span> ({restaurant.reviewCount} reviews · weighted {Number(restaurant.weightedRating || 0).toFixed(2)})</span>
        </div>

        {restaurant.openingHours && restaurant.openingHours.length > 0 && (
          <div className="hours-block">
            <h4><i className="fas fa-clock"></i> Opening Hours</h4>
            <ul>
              {restaurant.openingHours.map(h => (
                <li key={h.day}>{h.day}: {h.closed ? 'Closed' : `${h.open} - ${h.close}`}</li>
              ))}
            </ul>
          </div>
        )}

        {restaurant.photos && restaurant.photos.filter(p => !p.isRetired).length > 0 && (
          <div>
            <h4><i className="fas fa-images"></i> Photos</h4>
            <div className="photo-strip">
              {restaurant.photos.filter(p => !p.isRetired).map(p => (
                <figure key={p._id}>
                  <img src={p.url} alt={p.altText || restaurant.name} />
                  {p.caption && <figcaption>{p.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2><i className="fas fa-utensils"></i> Menu</h2>
      <div className="menu-grid">
        {menu.map(item => (
          <div key={item._id} className="menu-card">
            <img src={item.image} alt={item.imageAlt || item.name} style={{ height: '180px' }} />
            <div className="content">
              <h3>{item.name} {!item.isAvailable && <span className="badge-unavailable">Unavailable</span>}</h3>
              <p style={{ fontSize: '12px', color: '#888' }}>{item.category}</p>
              <p>{item.description}</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b35' }}>${Number(item.price).toFixed(2)}</p>
              {item.imageCaption && <p style={{ fontSize: '12px', color: '#777' }}>{item.imageCaption}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-between" style={{ margin: '30px 0' }}>
        <h2><i className="fas fa-comments"></i> Customer Reviews</h2>
        {user ? (
          <button className="btn-primary" onClick={() => setShowReviewForm(!showReviewForm)}>Write a Review</button>
        ) : (
          <Link to="/user/login" className="btn-primary">Login to Write Review</Link>
        )}
      </div>

      {showReviewForm && user && (
        <div className="admin-panel" style={{ marginTop: 0 }}>
          <h3>Share Your Experience</h3>
          <form onSubmit={handleReviewSubmit}>
            {[
              ['foodQualityRating', 'Food Quality'],
              ['customerServiceRating', 'Customer Service'],
              ['ambienceCleanlinessRating', 'Ambience & Cleanliness'],
              ['valueForMoneyRating', 'Value for Money'],
              ['bookingExperienceRating', 'Booking / Experience']
            ].map(([k, label]) => (
              <div key={k} className="form-group">
                <label>{label} (1-5)</label>
                <input type="number" min="1" max="5" value={newReview[k]}
                  onChange={e => setNewReview({ ...newReview, [k]: parseInt(e.target.value, 10) })} required />
              </div>
            ))}
            <div className="form-group">
              <label>Miscellaneous Rating (optional, 1-5)</label>
              <input type="number" min="1" max="5" value={newReview.miscellaneousRating || ''}
                onChange={e => setNewReview({ ...newReview, miscellaneousRating: e.target.value ? parseInt(e.target.value, 10) : undefined })} />
            </div>
            <div className="form-group">
              <label>Miscellaneous Comments (free text, optional)</label>
              <textarea rows="2" value={newReview.miscellaneousText}
                onChange={e => setNewReview({ ...newReview, miscellaneousText: e.target.value })}></textarea>
            </div>
            <div className="form-group">
              <label>Associate with a menu item (optional)</label>
              <select value={newReview.menuItemId} onChange={e => setNewReview({ ...newReview, menuItemId: e.target.value })}>
                <option value="">— None —</option>
                {menu.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Your Review *</label>
              <textarea rows="4" required value={newReview.comment}
                onChange={e => setNewReview({ ...newReview, comment: e.target.value })}></textarea>
            </div>
            <button type="submit" className="btn-primary">Submit Review</button>
            <button type="button" className="btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <p>No reviews yet. Be the first to review!</p>
      ) : reviews.map(review => {
        const overall = (
          review.foodQualityRating + review.customerServiceRating +
          review.ambienceCleanlinessRating + review.valueForMoneyRating +
          review.bookingExperienceRating
        ) / 5;
        return (
          <div key={review._id} className="review-card">
            <div className="review-header">
              <span className="reviewer-name">{review.userName}</span>
              <span className="rating-badge">Avg: {overall.toFixed(1)}</span>
            </div>
            <div className="mb-20 rating-rows">
              <div>🍔 Food: {renderStars(review.foodQualityRating)}</div>
              <div>🛎️ Service: {renderStars(review.customerServiceRating)}</div>
              <div>✨ Ambience & Cleanliness: {renderStars(review.ambienceCleanlinessRating)}</div>
              <div>💰 Value: {renderStars(review.valueForMoneyRating)}</div>
              <div>📆 Booking: {renderStars(review.bookingExperienceRating)}</div>
              {review.miscellaneousRating && <div>🌟 Misc: {renderStars(review.miscellaneousRating)}</div>}
            </div>
            {review.menuItemName && <p><strong>Item:</strong> {review.menuItemName}</p>}
            <p>{review.comment}</p>
            {review.miscellaneousText && <p style={{ fontStyle: 'italic', color: '#666' }}>{review.miscellaneousText}</p>}
            {review.editedAt && <p style={{ fontSize: '12px', color: '#999' }}>edited {new Date(review.editedAt).toLocaleDateString()}</p>}

            {review.companyResponses && review.companyResponses.map(cr => (
              <div key={cr._id} className="company-response">
                <strong>📢 {cr.authorType === 'company_rep' ? 'Company' : 'Admin'} response{cr.authorName ? ` (${cr.authorName})` : ''}:</strong> {cr.text}
              </div>
            ))}

            <div className="gap-10" style={{ marginTop: '10px' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '5px 15px' }}
                onClick={() => {
                  setShowComments(prev => ({ ...prev, [review._id]: !prev[review._id] }));
                  if (!showComments[review._id]) fetchComments(review._id);
                }}
              >
                <i className="fas fa-comment"></i> Comments ({commentsData[review._id]?.length || 0})
              </button>
              {user && (
                <button className="btn-secondary" style={{ fontSize: '12px', padding: '5px 15px' }} onClick={() => openReport('review', review._id)}>
                  <i className="fas fa-flag"></i> Report
                </button>
              )}
              {(isCompanyRep || adminToken) && (
                <button className="btn-secondary" style={{ fontSize: '12px', padding: '5px 15px' }} onClick={() => setResponseDrafts(prev => ({ ...prev, [review._id]: prev[review._id] === undefined ? '' : prev[review._id] }))}>
                  <i className="fas fa-reply"></i> Respond
                </button>
              )}
            </div>

            {responseDrafts[review._id] !== undefined && (isCompanyRep || adminToken) && (
              <div className="mt-20">
                <textarea rows="2" placeholder="Official response..." value={responseDrafts[review._id]}
                  onChange={e => setResponseDrafts(prev => ({ ...prev, [review._id]: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <button className="btn-primary" onClick={() => handleCompanyResponse(review._id)}>Submit Response (pending moderation)</button>
              </div>
            )}

            {showComments[review._id] && (
              <div className="comment-section">
                {commentsData[review._id]?.map(comment => (
                  <div key={comment._id} className="comment">
                    <div className="flex-between">
                      <div>
                        <strong>{comment.userName}</strong>{' '}
                        <span style={{ fontSize: '12px', color: '#999' }}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user && (
                        <button className="btn-link" onClick={() => openReport('comment', comment._id)}>
                          <i className="fas fa-flag"></i>
                        </button>
                      )}
                    </div>
                    <p style={{ marginTop: '5px' }}>{comment.commentText}</p>
                  </div>
                ))}
                {user ? (
                  <div className="comment-input">
                    <input type="text" placeholder="Add a comment..." value={commentText[review._id] || ''}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [review._id]: e.target.value }))} />
                    <button className="btn-secondary" onClick={() => handleCommentSubmit(review._id)}>Post</button>
                  </div>
                ) : (
                  <p><Link to="/user/login">Login to comment</Link></p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {reportTarget && (
        <div className="modal-backdrop" onClick={() => setReportTarget(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <h3>Report content</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>Help us keep the community safe.</p>
            <div className="form-group">
              <label>Reason</label>
              <select value={reportData.reasonCode} onChange={e => setReportData({ ...reportData, reasonCode: e.target.value })}>
                {REPORT_CODES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Details (optional)</label>
              <textarea rows="3" value={reportData.details} onChange={e => setReportData({ ...reportData, details: e.target.value })}></textarea>
            </div>
            <div className="gap-10">
              <button className="btn-primary" onClick={submitReport}>Submit Report</button>
              <button className="btn-secondary" onClick={() => setReportTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
