import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', address: '', image: '', cuisine: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('adminToken');

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchRestaurants = async () => {
    const res = await axios.get('http://localhost:5000/api/restaurants');
    setRestaurants(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/admin/restaurants/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Restaurant updated');
      } else {
        await axios.post('http://localhost:5000/api/admin/restaurants', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Restaurant created');
      }
      resetForm();
      fetchRestaurants();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error saving restaurant');
    }
  };

  const handleEdit = (r) => {
    setEditingId(r._id);
    setForm({ name: r.name, description: r.description, address: r.address, image: r.image, cuisine: r.cuisine });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await axios.delete(`http://localhost:5000/api/admin/restaurants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Restaurant deleted');
      fetchRestaurants();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', description: '', address: '', image: '', cuisine: '' });
  };

  return (
    <div>
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit Restaurant' : 'Add New Restaurant'}</h3>
        <div className="form-group"><input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
        <div className="form-group"><textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></div>
        <div className="form-group"><input type="text" placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required /></div>
        <div className="form-group"><input type="text" placeholder="Image URL" value={form.image} onChange={e => setForm({...form, image: e.target.value})} /></div>
        <div className="form-group"><input type="text" placeholder="Cuisine" value={form.cuisine} onChange={e => setForm({...form, cuisine: e.target.value})} /></div>
        <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
      </form>

      <div className="data-table">
        <h3>Existing Restaurants</h3>
        <table>
          <thead><tr><th>Name</th><th>Cuisine</th><th>Actions</th></tr></thead>
          <tbody>
            {restaurants.map(r => (
              <tr key={r._id}>
                <td>{r.name}</td><td>{r.cuisine}</td>
                <td><button className="btn-secondary" onClick={() => handleEdit(r)}>Edit</button> <button className="btn-danger" onClick={() => handleDelete(r._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageRestaurants;