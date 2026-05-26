import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageMenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({ restaurantId: '', name: '', description: '', price: '', image: '', category: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchRestaurants();
    fetchAllMenuItems();
  }, []);

  const fetchRestaurants = async () => {
    const res = await axios.get('http://localhost:5000/api/restaurants');
    setRestaurants(res.data);
  };

  const fetchAllMenuItems = async () => {
    const res = await axios.get('http://localhost:5000/api/restaurants');
    let all = [];
    for (let r of res.data) {
      const items = await axios.get(`http://localhost:5000/api/restaurants/${r._id}/menu`);
      all.push(...items.data.map(i => ({ ...i, restaurantName: r.name })));
    }
    setMenuItems(all);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/admin/menu-items/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Menu item updated');
      } else {
        await axios.post('http://localhost:5000/api/admin/menu-items', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Menu item created');
      }
      resetForm();
      fetchAllMenuItems();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error saving');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      restaurantId: item.restaurantId,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      await axios.delete(`http://localhost:5000/api/admin/menu-items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Item deleted');
      fetchAllMenuItems();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ restaurantId: '', name: '', description: '', price: '', image: '', category: '' });
  };

  return (
    <div>
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
        <div className="form-group">
          <select value={form.restaurantId} onChange={e => setForm({...form, restaurantId: e.target.value})} required>
            <option value="">Select Restaurant</option>
            {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>
        <div className="form-group"><input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
        <div className="form-group"><textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></div>
        <div className="form-group"><input type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} required /></div>
        <div className="form-group"><input type="text" placeholder="Image URL" value={form.image} onChange={e => setForm({...form, image: e.target.value})} /></div>
        <div className="form-group"><input type="text" placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
        <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
      </form>

      <div className="data-table">
        <h3>Menu Items</h3>
        <table>
          <thead><tr><th>Restaurant</th><th>Name</th><th>Price</th><th>Actions</th></tr></thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item._id}>
                <td>{item.restaurantName}</td><td>{item.name}</td><td>${item.price}</td>
                <td><button className="btn-secondary" onClick={() => handleEdit(item)}>Edit</button> <button className="btn-danger" onClick={() => handleDelete(item._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageMenuItems;