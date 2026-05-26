import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManageRestaurants from './ManageRestaurants';
import ManageMenuItems from './ManageMenuItems';
import ModerateReviews from './ModerateReviews';
import ModerateComments from './ModerateComments';
import ManageAdmins from './ManageAdmins';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('restaurants');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminId');
    navigate('/admin/login');
  };

  return (
    <div className="container">
      <div className="admin-panel">
        <div className="flex-between">
          <h2>Admin Dashboard</h2>
          <button className="btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
        <p>Welcome, {localStorage.getItem('adminEmail')}</p>
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'restaurants' ? 'active' : ''}`} onClick={() => setActiveTab('restaurants')}>
            <i className="fas fa-store"></i> Restaurants
          </button>
          <button className={`admin-tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
            <i className="fas fa-utensils"></i> Menu Items
          </button>
          <button className={`admin-tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
            <i className="fas fa-star"></i> Moderate Reviews
          </button>
          <button className={`admin-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
            <i className="fas fa-comments"></i> Moderate Comments
          </button>
          <button className={`admin-tab ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => setActiveTab('admins')}>
            <i className="fas fa-users-cog"></i> Admin Mgmt
          </button>
        </div>
        {activeTab === 'restaurants' && <ManageRestaurants />}
        {activeTab === 'menu' && <ManageMenuItems />}
        {activeTab === 'reviews' && <ModerateReviews />}
        {activeTab === 'comments' && <ModerateComments />}
        {activeTab === 'admins' && <ManageAdmins />}
      </div>
    </div>
  );
};

export default AdminDashboard;