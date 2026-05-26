import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    foodQualityRating: 5,
    customerServiceRating: 5,
    miscellaneousRating: 5,
    comment: ''
  });
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [message, setMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const userToken = localStorage.getItem('userToken');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/restaurants/${id}`);
      setRestaurant(res.data);
      setMenu(res.data.menuItems);
      setReviews(res.data.reviews);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchComments = async (reviewId) => {
    if (commentsData[reviewId]) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/reviews/${reviewId}/comments`);
      setCommentsData(prev => ({ ...prev, [reviewId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userToken) {
      setMessage('Please login to submit a review');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/reviews', 
        { ...newReview, restaurantId: id, userName: user.name, userEmail: user.email },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setMessage('Review submitted successfully! Pending moderation.');
      setShowReviewForm(false);
      setNewReview({
        foodQualityRating: 5,
        customerServiceRating: 5,
        miscellaneousRating: 5,
        comment: ''
      });
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error submitting review');
    }
  };

  const handleCommentSubmit = async (reviewId) => {
    if (!commentText[reviewId]?.trim()) return;
    if (!userToken) {
      setMessage('Please login to comment');
      return;
    }
    try {
      await axios.post(`http://localhost:5000/api/reviews/${reviewId}/comments`,
        { commentText: commentText[reviewId] },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setCommentText(prev => ({ ...prev, [reviewId]: '' }));
      setMessage('Comment submitted! Pending moderation.');
      fetchComments(reviewId);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error submitting comment');
    }
  };

  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
      </div>
    );
  }

  if (!restaurant) return <div className="container">Restaurant not found</div>;

  return (
    <div className="container">
      {message && <div className="alert alert-success">{message}</div>}

      <div className="restaurant-header">
        <img src={restaurant.image} alt={restaurant.name} className="restaurant-image" />
        <h1>{restaurant.name}</h1>
        <p>{restaurant.description}</p>
        <p><i className="fas fa-map-marker-alt"></i> {restaurant.address}</p>
        <div className="stars">
          {renderStars(Math.round(restaurant.averageRating || 0))}
          <span> ({restaurant.reviewCount} reviews)</span>
        </div>
      </div>

      <h2><i className="fas fa-utensils"></i> Menu</h2>
      <div className="menu-grid">
        {menu.map(item => (
          <div key={item._id} className="menu-card">
            <img src={item.image} alt={item.name} style={{ height: '180px' }} />
            <div className="content">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b35' }}>${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-between" style={{ margin: '30px 0' }}>
        <h2><i className="fas fa-comments"></i> Customer Reviews</h2>
        {user ? (
          <button className="btn-primary" onClick={() => setShowReviewForm(!showReviewForm)}>
            Write a Review
          </button>
        ) : (
          <Link to="/user/login" className="btn-primary">Login to Write Review</Link>
        )}
      </div>

      {showReviewForm && user && (
        <div className="admin-panel" style={{ marginTop: 0 }}>
          <h3>Share Your Experience</h3>
          <form onSubmit={handleReviewSubmit}>
            <div className="form-group">
              <label>Food Quality (1-5)</label>
              <input type="number" min="1" max="5" value={newReview.foodQualityRating} onChange={e => setNewReview({...newReview, foodQualityRating: parseInt(e.target.value)})} required />
            </div>
            <div className="form-group">
              <label>Customer Service (1-5)</label>
              <input type="number" min="1" max="5" value={newReview.customerServiceRating} onChange={e => setNewReview({...newReview, customerServiceRating: parseInt(e.target.value)})} required />
            </div>
            <div className="form-group">
              <label>Miscellaneous (Ambiance, Value, etc.) (1-5)</label>
              <input type="number" min="1" max="5" value={newReview.miscellaneousRating} onChange={e => setNewReview({...newReview, miscellaneousRating: parseInt(e.target.value)})} required />
            </div>
            <div className="form-group">
              <label>Your Review *</label>
              <textarea rows="4" required value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})}></textarea>
            </div>
            <button type="submit" className="btn-primary">Submit Review</button>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <p>No reviews yet. Be the first to review!</p>
      ) : (
        reviews.map(review => (
          <div key={review._id} className="review-card">
            <div className="review-header">
              <span className="reviewer-name">{review.userName}</span>
              <span className="rating-badge">
                Avg: {((review.foodQualityRating + review.customerServiceRating + review.miscellaneousRating) / 3).toFixed(1)}
              </span>
            </div>
            <div className="mb-20">
              <div>🍔 Food: {renderStars(review.foodQualityRating)}</div>
              <div>🛎️ Service: {renderStars(review.customerServiceRating)}</div>
              <div>✨ Misc: {renderStars(review.miscellaneousRating)}</div>
            </div>
            <p>{review.comment}</p>
            {review.companyResponse && (
              <div className="company-response">
                <strong>📢 Company Response:</strong> {review.companyResponse}
              </div>
            )}
            <button
              className="btn-secondary"
              style={{ marginTop: '10px', fontSize: '12px', padding: '5px 15px' }}
              onClick={() => {
                setShowComments(prev => ({ ...prev, [review._id]: !prev[review._id] }));
                if (!showComments[review._id]) fetchComments(review._id);
              }}
            >
              <i className="fas fa-comment"></i> Comments ({commentsData[review._id]?.length || 0})
            </button>
            {showComments[review._id] && (
              <div className="comment-section">
                {commentsData[review._id]?.map(comment => (
                  <div key={comment._id} className="comment">
                    <strong>{comment.userName}</strong> <span style={{ fontSize: '12px', color: '#999' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                    <p style={{ marginTop: '5px' }}>{comment.commentText}</p>
                  </div>
                ))}
                {user ? (
                  <div className="comment-input">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText[review._id] || ''}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [review._id]: e.target.value }))}
                    />
                    <button className="btn-secondary" onClick={() => handleCommentSubmit(review._id)}>Post</button>
                  </div>
                ) : (
                  <p><Link to="/user/login">Login to comment</Link></p>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default RestaurantDetail;