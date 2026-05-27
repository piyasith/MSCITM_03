import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManageRestaurants from './ManageRestaurants';
import ManageMenuItems from './ManageMenuItems';
import ModerateReviews from './ModerateReviews';
import ModerateComments from './ModerateComments';
import ModerateCompanyResponses from './ModerateCompanyResponses';
import ManageAdmins from './ManageAdmins';
import ManageReports from './ManageReports';
import ManageTags from './ManageTags';
import ManageSettings from './ManageSettings';
import AdminAnalytics from './AdminAnalytics';
import ManageUsers from './ManageUsers';

const TABS = [
  { id: 'analytics', label: 'Dashboard', icon: 'fa-chart-line' },
  { id: 'restaurants', label: 'Restaurants', icon: 'fa-store' },
  { id: 'menu', label: 'Menu Items', icon: 'fa-utensils' },
  { id: 'reviews', label: 'Moderate Reviews', icon: 'fa-star' },
  { id: 'comments', label: 'Moderate Comments', icon: 'fa-comments' },
  { id: 'responses', label: 'Company Responses', icon: 'fa-reply' },
  { id: 'reports', label: 'Reports', icon: 'fa-flag' },
  { id: 'users', label: 'Users', icon: 'fa-users' },
  { id: 'tags', label: 'Tags & Cuisines', icon: 'fa-tags' },
  { id: 'settings', label: 'Settings', icon: 'fa-sliders-h' },
  { id: 'admins', label: 'Admin Mgmt', icon: 'fa-users-cog' }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');

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
          {TABS.map(t => (
            <button key={t.id} className={`admin-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <i className={`fas ${t.icon}`}></i> {t.label}
            </button>
          ))}
        </div>
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'restaurants' && <ManageRestaurants />}
        {activeTab === 'menu' && <ManageMenuItems />}
        {activeTab === 'reviews' && <ModerateReviews />}
        {activeTab === 'comments' && <ModerateComments />}
        {activeTab === 'responses' && <ModerateCompanyResponses />}
        {activeTab === 'reports' && <ManageReports />}
        {activeTab === 'users' && <ManageUsers />}
        {activeTab === 'tags' && <ManageTags />}
        {activeTab === 'settings' && <ManageSettings />}
        {activeTab === 'admins' && <ManageAdmins />}
      </div>
    </div>
  );
};

export default AdminDashboard;
