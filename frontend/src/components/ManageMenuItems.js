import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const emptyForm = {
  restaurantId: '', name: '', description: '', price: '',
  image: '', imageCaption: '', imageAlt: '',
  category: '', dietaryTags: '', isAvailable: true
};

const ManageMenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRestaurants();
    fetchAllMenuItems();
  }, []);

  const fetchRestaurants = async () => {
    const res = await axios.get(`${API_BASE}/restaurants`);
    setRestaurants(res.data);
  };

  const fetchAllMenuItems = async () => {
    const res = await axios.get(`${API_BASE}/restaurants`);
    let all = [];
    for (let r of res.data) {
      const items = await axios.get(`${API_BASE}/restaurants/${r._id}/menu`);
      all.push(...items.data.map(i => ({ ...i, restaurantName: r.name })));
    }
    setMenuItems(all);
  };

  const toPayload = (f) => ({
    ...f,
    price: parseFloat(f.price),
    dietaryTags: f.dietaryTags ? String(f.dietaryTags).split(',').map(s => s.trim()).filter(Boolean) : []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/admin/menu-items/${editingId}`, toPayload(form), { headers: adminAuthHeader() });
        setMessage('Menu item updated');
      } else {
        await axios.post(`${API_BASE}/admin/menu-items`, toPayload(form), { headers: adminAuthHeader() });
        setMessage('Menu item created');
      }
      resetForm();
      fetchAllMenuItems();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('Error saving'); }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      restaurantId: item.restaurantId,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      imageCaption: item.imageCaption || '',
      imageAlt: item.imageAlt || '',
      category: item.category,
      dietaryTags: (item.dietaryTags || []).join(', '),
      isAvailable: item.isAvailable !== false
    });
  };

  const toggleAvailability = async (id, isAvailable) => {
    await axios.patch(`${API_BASE}/admin/menu-items/${id}/availability`, { isAvailable }, { headers: adminAuthHeader() });
    fetchAllMenuItems();
  };

  const retire = async (id) => {
    if (!window.confirm('Retire this item?')) return;
    await axios.patch(`${API_BASE}/admin/menu-items/${id}/retire`, {}, { headers: adminAuthHeader() });
    fetchAllMenuItems();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    await axios.delete(`${API_BASE}/admin/menu-items/${id}`, { headers: adminAuthHeader() });
    fetchAllMenuItems();
  };

  const resetForm = () => { setEditingId(null); setForm(emptyForm); };

  return (
    <div>
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleSubmit} className="admin-panel" style={{ margin: '0 0 30px' }}>
        <h3>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Restaurant</label>
            <select value={form.restaurantId} onChange={e => setForm({ ...form, restaurantId: e.target.value })} required>
              <option value="">Select Restaurant</option>
              {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Category</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
          <div className="form-group"><label>Price</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
          <div className="form-group"><label>Image URL</label><input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
          <div className="form-group"><label>Image alt text</label><input value={form.imageAlt} onChange={e => setForm({ ...form, imageAlt: e.target.value })} /></div>
          <div className="form-group"><label>Image caption</label><input value={form.imageCaption} onChange={e => setForm({ ...form, imageCaption: e.target.value })} /></div>
          <div className="form-group"><label>Dietary tags (comma)</label><input value={form.dietaryTags} onChange={e => setForm({ ...form, dietaryTags: e.target.value })} /></div>
          <div className="form-group">
            <label><input type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} /> Available now</label>
          </div>
        </div>
        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
        <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
      </form>

      <div className="data-table">
        <h3>Menu Items</h3>
        <table>
          <thead><tr><th>Restaurant</th><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th>Actions</th></tr></thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item._id}>
                <td>{item.restaurantName}</td>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>${Number(item.price).toFixed(2)}</td>
                <td>
                  <input type="checkbox" checked={item.isAvailable !== false}
                    onChange={e => toggleAvailability(item._id, e.target.checked)} />
                </td>
                <td>
                  <button className="btn-secondary" onClick={() => handleEdit(item)}>Edit</button>{' '}
                  <button className="btn-secondary" onClick={() => retire(item._id)}>Retire</button>{' '}
                  <button className="btn-danger" onClick={() => handleDelete(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageMenuItems;
