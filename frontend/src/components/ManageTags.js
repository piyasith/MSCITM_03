import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const ManageTags = () => {
  const [tags, setTags] = useState([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', type: 'cuisine', isFeatured: false, isActive: true });

  const fetchTags = async () => {
    const res = await axios.get(`${API_BASE}/admin/tags${filter ? `?type=${filter}` : ''}`, { headers: adminAuthHeader() });
    setTags(res.data);
  };
  useEffect(() => { fetchTags(); }, [filter]);

  const create = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/admin/tags`, form, { headers: adminAuthHeader() });
    setForm({ name: '', type: form.type, isFeatured: false, isActive: true });
    fetchTags();
  };

  const update = async (id, patch) => {
    await axios.put(`${API_BASE}/admin/tags/${id}`, patch, { headers: adminAuthHeader() });
    fetchTags();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete tag?')) return;
    await axios.delete(`${API_BASE}/admin/tags/${id}`, { headers: adminAuthHeader() });
    fetchTags();
  };

  return (
    <div>
      <form onSubmit={create} className="admin-panel" style={{ margin: '0 0 20px' }}>
        <h3>Add Tag / Cuisine / Category</h3>
        <div className="form-group"><input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="form-group">
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="cuisine">Cuisine</option>
            <option value="dietary">Dietary</option>
            <option value="feature">Feature</option>
            <option value="category">Category</option>
          </select>
        </div>
        <div className="form-group">
          <label><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label>
        </div>
        <button type="submit" className="btn-primary">Add</button>
      </form>

      <div className="form-group" style={{ maxWidth: 240 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="cuisine">Cuisine</option>
          <option value="dietary">Dietary</option>
          <option value="feature">Feature</option>
          <option value="category">Category</option>
        </select>
      </div>

      <div className="data-table">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Featured</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {tags.map(t => (
              <tr key={t._id}>
                <td>{t.name}</td>
                <td>{t.type}</td>
                <td><input type="checkbox" checked={t.isFeatured} onChange={e => update(t._id, { isFeatured: e.target.checked })} /></td>
                <td><input type="checkbox" checked={t.isActive} onChange={e => update(t._id, { isActive: e.target.checked })} /></td>
                <td><button className="btn-danger" onClick={() => remove(t._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageTags;
