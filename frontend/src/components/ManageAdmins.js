import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'admin' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [currentAdminRole, setCurrentAdminRole] = useState('');
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchCurrentAdmin();
    fetchAdmins();
  }, []);

  const fetchCurrentAdmin = async () => {
    const res = await axios.get('http://13.51.79.132:5002/api/admin/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCurrentAdminRole(res.data.role);
  };

  const fetchAdmins = async () => {
    try {
      const res = await axios.get('http://13.51.79.132:5002/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
    } catch (err) {
      setMessage('Only super admin can manage admins');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://13.51.79.132:5002/api/admin/admins', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Admin created');
      setForm({ email: '', password: '', fullName: '', role: 'admin' });
      fetchAdmins();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`http://13.51.79.132:5002/api/admin/admins/${id}`, editData[id], {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Admin updated');
      setEditingId(null);
      fetchAdmins();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this admin?')) {
      await axios.delete(`http://13.51.79.132:5002/api/admin/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Admin deleted');
      fetchAdmins();
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://13.51.79.132:5002/api/admin/change-password', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Password changed');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  if (currentAdminRole !== 'super_admin') {
    return (
      <div>
        <div className="alert alert-error">Only super admin can manage admins.</div>
        {showChangePassword ? (
          <div className="admin-panel">
            <h3>Change Your Password</h3>
            <form onSubmit={handleChangePassword}>
              <div className="form-group"><input type="password" placeholder="Current Password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} required /></div>
              <div className="form-group"><input type="password" placeholder="New Password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required /></div>
              <button type="submit" className="btn-primary">Change</button>
              <button type="button" className="btn-secondary" onClick={() => setShowChangePassword(false)}>Cancel</button>
            </form>
          </div>
        ) : (
          <button className="btn-primary" onClick={() => setShowChangePassword(true)}>Change My Password</button>
        )}
      </div>
    );
  }

  return (
    <div>
      {message && <div className="alert alert-success">{message}</div>}
      <button className="btn-primary" onClick={() => setShowChangePassword(!showChangePassword)}>Change My Password</button>
      {showChangePassword && (
        <div className="admin-panel">
          <form onSubmit={handleChangePassword}>
            <div className="form-group"><input type="password" placeholder="Current Password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} required /></div>
            <div className="form-group"><input type="password" placeholder="New Password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required /></div>
            <button type="submit" className="btn-primary">Change</button>
            <button type="button" className="btn-secondary" onClick={() => setShowChangePassword(false)}>Cancel</button>
          </form>
        </div>
      )}

      <h3>Create New Admin</h3>
      <form onSubmit={handleCreate}>
        <div className="form-group"><input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
        <div className="form-group"><input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></div>
        <div className="form-group"><input type="text" placeholder="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} /></div>
        <div className="form-group">
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">Create Admin</button>
      </form>

      <div className="data-table">
        <h3>Existing Admins</h3>
        <table>
          <thead><tr><th>Email</th><th>Full Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin._id}>
                <td>{admin.email}</td>
                <td>
                  {editingId === admin._id ? (
                    <input type="text" value={editData[admin._id]?.fullName || admin.fullName} onChange={e => setEditData({...editData, [admin._id]: {...editData[admin._id], fullName: e.target.value}})} />
                  ) : admin.fullName}
                </td>
                <td>
                  {editingId === admin._id ? (
                    <select value={editData[admin._id]?.role || admin.role} onChange={e => setEditData({...editData, [admin._id]: {...editData[admin._id], role: e.target.value}})}>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : admin.role}
                </td>
                <td>
                  {editingId === admin._id ? (
                    <select value={editData[admin._id]?.isActive !== undefined ? editData[admin._id].isActive : admin.isActive} onChange={e => setEditData({...editData, [admin._id]: {...editData[admin._id], isActive: e.target.value === 'true'}})}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (admin.isActive ? 'Active' : 'Inactive')}
                </td>
                <td>
                  {editingId === admin._id ? (
                    <>
                      <button className="btn-primary" onClick={() => handleUpdate(admin._id)}>Save</button>
                      <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-secondary" onClick={() => { setEditingId(admin._id); setEditData({...editData, [admin._id]: {}}); }}>Edit</button>
                      {admin._id !== localStorage.getItem('adminId') && <button className="btn-danger" onClick={() => handleDelete(admin._id)}>Delete</button>}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageAdmins;