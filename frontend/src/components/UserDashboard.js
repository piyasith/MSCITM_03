import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE, userAuthHeader } from '../api';

const STATUS_COLORS = {
  pending: '#f0ad4e',
  approved: '#28a745',
  rejected: '#dc3545',
  soft_removed: '#6c757d'
};

const StatusBadge = ({ status }) => (
  <span className="status-badge" style={{ background: STATUS_COLORS[status] || '#6c757d' }}>
    {status === 'soft_removed' ? 'removed' : status}
  </span>
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('userToken')) navigate('/user/login');
  }, [navigate]);

  const fetchReviews = async () => {
    const r = await axios.get(`${API_BASE}/user/my-reviews`, { headers: userAuthHeader() });
    setReviews(r.data);
  };
  const fetchComments = async () => {
    const r = await axios.get(`${API_BASE}/user/my-comments`, { headers: userAuthHeader() });
    setComments(r.data);
  };
  const fetchNotifications = async () => {
    const r = await axios.get(`${API_BASE}/user/notifications`, { headers: userAuthHeader() });
    setNotifications(r.data);
  };

  useEffect(() => {
    if (tab === 'reviews') fetchReviews();
    if (tab === 'comments') fetchComments();
    if (tab === 'notifications') fetchNotifications();
  }, [tab]);

  const startEditReview = (r) => {
    setEditing(r._id);
    setEditForm({
      foodQualityRating: r.foodQualityRating,
      customerServiceRating: r.customerServiceRating,
      ambienceCleanlinessRating: r.ambienceCleanlinessRating,
      valueForMoneyRating: r.valueForMoneyRating,
      bookingExperienceRating: r.bookingExperienceRating,
      miscellaneousRating: r.miscellaneousRating || '',
      miscellaneousText: r.miscellaneousText || '',
      comment: r.comment,
      menuItemId: r.menuItemId || ''
    });
  };

  const saveReviewEdit = async (id) => {
    try {
      const payload = { ...editForm };
      if (payload.miscellaneousRating === '') delete payload.miscellaneousRating;
      if (!payload.menuItemId) payload.menuItemId = null;
      await axios.put(`${API_BASE}/user/reviews/${id}`, payload, { headers: userAuthHeader() });
      setMessage('Review updated. It is back in moderation.');
      setEditing(null);
      fetchReviews();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await axios.delete(`${API_BASE}/user/reviews/${id}`, { headers: userAuthHeader() });
      setMessage('Review deleted');
      fetchReviews();
    } catch (err) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const startEditComment = (c) => {
    setEditing(c._id);
    setEditForm({ commentText: c.commentText });
  };

  const saveCommentEdit = async (id) => {
    try {
      await axios.put(`${API_BASE}/user/comments/${id}`, { commentText: editForm.commentText }, { headers: userAuthHeader() });
      setEditing(null);
      fetchComments();
      setMessage('Comment updated. Pending re-moderation.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const deleteComment = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await axios.delete(`${API_BASE}/user/comments/${id}`, { headers: userAuthHeader() });
      fetchComments();
    } catch (err) { setMessage(err.response?.data?.message || 'Error'); }
  };

  const markAllRead = async () => {
    await axios.post(`${API_BASE}/user/notifications/read-all`, {}, { headers: userAuthHeader() });
    fetchNotifications();
  };

  const markRead = async (id) => {
    await axios.patch(`${API_BASE}/user/notifications/${id}/read`, {}, { headers: userAuthHeader() });
    fetchNotifications();
  };

  return (
    <div className="container">
      <div className="admin-panel">
        <h2>My Account</h2>
        {message && <div className="alert alert-success">{message}</div>}
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
            <i className="fas fa-star"></i> My Reviews
          </button>
          <button className={`admin-tab ${tab === 'comments' ? 'active' : ''}`} onClick={() => setTab('comments')}>
            <i className="fas fa-comment"></i> My Comments
          </button>
          <button className={`admin-tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
            <i className="fas fa-bell"></i> Notifications
          </button>
        </div>

        {tab === 'reviews' && (
          <div>
            {reviews.length === 0 && <p>No reviews submitted yet.</p>}
            {reviews.map(r => (
              <div key={r._id} className="review-card">
                <div className="flex-between">
                  <div>
                    <Link to={`/restaurant/${r.restaurantId?._id || r.restaurantId}`}>
                      <strong>{r.restaurantId?.name || 'Restaurant'}</strong>
                    </Link>
                    <span style={{ marginLeft: 10 }}><StatusBadge status={r.status} /></span>
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                    {r.editedAt && ` · edited`}
                  </div>
                </div>
                {editing === r._id ? (
                  <div className="mt-20">
                    {[
                      ['foodQualityRating', 'Food Quality'],
                      ['customerServiceRating', 'Customer Service'],
                      ['ambienceCleanlinessRating', 'Ambience & Cleanliness'],
                      ['valueForMoneyRating', 'Value for Money'],
                      ['bookingExperienceRating', 'Booking / Experience']
                    ].map(([k, label]) => (
                      <div key={k} className="form-group">
                        <label>{label}</label>
                        <input type="number" min="1" max="5" value={editForm[k]}
                          onChange={e => setEditForm({ ...editForm, [k]: parseInt(e.target.value, 10) })} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label>Miscellaneous Rating</label>
                      <input type="number" min="1" max="5" value={editForm.miscellaneousRating || ''}
                        onChange={e => setEditForm({ ...editForm, miscellaneousRating: e.target.value ? parseInt(e.target.value, 10) : '' })} />
                    </div>
                    <div className="form-group">
                      <label>Miscellaneous Comments</label>
                      <textarea value={editForm.miscellaneousText} onChange={e => setEditForm({ ...editForm, miscellaneousText: e.target.value })}></textarea>
                    </div>
                    <div className="form-group">
                      <label>Review</label>
                      <textarea value={editForm.comment} onChange={e => setEditForm({ ...editForm, comment: e.target.value })}></textarea>
                    </div>
                    <button className="btn-primary" onClick={() => saveReviewEdit(r._id)}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <p>{r.comment}</p>
                    {r.menuItemName && <p style={{ fontSize: 12 }}><strong>Item:</strong> {r.menuItemName}</p>}
                    {r.status === 'rejected' && r.moderationReasonCode && (
                      <p style={{ color: '#dc3545', fontSize: 13 }}>
                        Rejection reason: {r.moderationReasonCode}{r.moderationReason ? ` - ${r.moderationReason}` : ''}
                      </p>
                    )}
                    <div className="gap-10" style={{ marginTop: 10 }}>
                      <button className="btn-secondary" onClick={() => startEditReview(r)}>Edit</button>
                      <button className="btn-danger" onClick={() => deleteReview(r._id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'comments' && (
          <div>
            {comments.length === 0 && <p>No comments yet.</p>}
            {comments.map(c => (
              <div key={c._id} className="review-card">
                <div className="flex-between">
                  <StatusBadge status={c.status} />
                  <span style={{ fontSize: 12, color: '#999' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                {editing === c._id ? (
                  <div>
                    <textarea value={editForm.commentText} onChange={e => setEditForm({ commentText: e.target.value })}></textarea>
                    <button className="btn-primary" onClick={() => saveCommentEdit(c._id)}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <p>{c.commentText}</p>
                    {c.status === 'rejected' && c.moderationReasonCode && (
                      <p style={{ color: '#dc3545', fontSize: 13 }}>Reason: {c.moderationReasonCode}</p>
                    )}
                    <div className="gap-10" style={{ marginTop: 10 }}>
                      <button className="btn-secondary" onClick={() => startEditComment(c)}>Edit</button>
                      <button className="btn-danger" onClick={() => deleteComment(c._id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'notifications' && (
          <div>
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <h3>Notifications</h3>
              <button className="btn-secondary" onClick={markAllRead}>Mark all read</button>
            </div>
            {notifications.length === 0 && <p>You have no notifications.</p>}
            {notifications.map(n => (
              <div key={n._id} className={`notif-card ${n.isRead ? '' : 'notif-unread'}`} onClick={() => !n.isRead && markRead(n._id)}>
                <div className="flex-between">
                  <strong>{n.title}</strong>
                  <span style={{ fontSize: 12, color: '#999' }}>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p>{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
