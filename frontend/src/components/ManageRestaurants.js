import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

const emptyForm = {
  name: '', description: '', address: '', location: '',
  image: '', cuisine: '', cuisines: '', tags: '', dietaryTags: '',
  priceRange: '$$', isFeatured: false, isActive: true,
  openingHours: DAYS.map(d => ({ day: d, open: '09:00', close: '22:00', closed: false }))
};

const ManageRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [photoForms, setPhotoForms] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchRestaurants = async () => {
    const res = await axios.get(`${API_BASE}/restaurants`);
    setRestaurants(res.data);
  };

  const toPayload = (f) => ({
    ...f,
    cuisines: f.cuisines ? String(f.cuisines).split(',').map(s => s.trim()).filter(Boolean) : [],
    tags: f.tags ? String(f.tags).split(',').map(s => s.trim()).filter(Boolean) : [],
    dietaryTags: f.dietaryTags ? String(f.dietaryTags).split(',').map(s => s.trim()).filter(Boolean) : []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = toPayload(form);
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/admin/restaurants/${editingId}`, payload, { headers: adminAuthHeader() });
        setMessage('Restaurant updated');
      } else {
        await axios.post(`${API_BASE}/admin/restaurants`, payload, { headers: adminAuthHeader() });
        setMessage('Restaurant created');
      }
      resetForm();
      fetchRestaurants();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (r) => {
    setEditingId(r._id);
    setForm({
      name: r.name, description: r.description, address: r.address, location: r.location || '',
      image: r.image, cuisine: r.cuisine,
      cuisines: (r.cuisines || []).join(', '),
      tags: (r.tags || []).join(', '),
      dietaryTags: (r.dietaryTags || []).join(', '),
      priceRange: r.priceRange || '$$',
      isFeatured: !!r.isFeatured,
      isActive: r.isActive !== false,
      openingHours: (r.openingHours && r.openingHours.length === 7)
        ? r.openingHours
        : DAYS.map(d => {
            const h = (r.openingHours || []).find(h => h.day === d);
            return h || { day: d, open: '09:00', close: '22:00', closed: false };
          })
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    await axios.delete(`${API_BASE}/admin/restaurants/${id}`, { headers: adminAuthHeader() });
    setMessage('Restaurant deleted');
    fetchRestaurants();
  };

  const resetForm = () => { setEditingId(null); setForm(emptyForm); };

  const setHour = (idx, patch) => {
    const oh = [...form.openingHours];
    oh[idx] = { ...oh[idx], ...patch };
    setForm({ ...form, openingHours: oh });
  };

  const addPhoto = async (restaurantId) => {
    const pf = photoForms[restaurantId] || {};
    if (!pf.url) return;
    await axios.post(`${API_BASE}/admin/restaurants/${restaurantId}/photos`, pf, { headers: adminAuthHeader() });
    setPhotoForms({ ...photoForms, [restaurantId]: { url: '', caption: '', altText: '' } });
    fetchRestaurants();
  };
  const updatePhoto = async (rid, photoId, patch) => {
    await axios.put(`${API_BASE}/admin/restaurants/${rid}/photos/${photoId}`, patch, { headers: adminAuthHeader() });
    fetchRestaurants();
  };
  const deletePhoto = async (rid, photoId) => {
    await axios.delete(`${API_BASE}/admin/restaurants/${rid}/photos/${photoId}`, { headers: adminAuthHeader() });
    fetchRestaurants();
  };

  return (
    <div>
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleSubmit} className="admin-panel" style={{ margin: '0 0 30px' }}>
        <h3>{editingId ? 'Edit Restaurant' : 'Add New Restaurant'}</h3>
        <div className="form-grid">
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Primary cuisine</label><input value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })} /></div>
          <div className="form-group"><label>Other cuisines (comma)</label><input value={form.cuisines} onChange={e => setForm({ ...form, cuisines: e.target.value })} /></div>
          <div className="form-group"><label>Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required /></div>
          <div className="form-group"><label>City / Area</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          <div className="form-group">
            <label>Price range</label>
            <select value={form.priceRange} onChange={e => setForm({ ...form, priceRange: e.target.value })}>
              {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Tags (comma)</label><input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
          <div className="form-group"><label>Dietary tags (comma)</label><input value={form.dietaryTags} onChange={e => setForm({ ...form, dietaryTags: e.target.value })} /></div>
          <div className="form-group"><label>Cover image URL</label><input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
          <div className="form-group">
            <label><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label><br/>
            <label><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active (visible)</label>
          </div>
        </div>
        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>

        <h4>Opening Hours</h4>
        <div className="hours-grid">
          {form.openingHours.map((h, i) => (
            <div key={h.day} className="hour-row">
              <label style={{ width: 50 }}>{h.day}</label>
              <input type="time" value={h.open} onChange={e => setHour(i, { open: e.target.value })} disabled={h.closed} />
              <input type="time" value={h.close} onChange={e => setHour(i, { close: e.target.value })} disabled={h.closed} />
              <label><input type="checkbox" checked={h.closed} onChange={e => setHour(i, { closed: e.target.checked })} /> Closed</label>
            </div>
          ))}
        </div>
        <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
      </form>

      <div className="data-table">
        <h3>Existing Restaurants</h3>
        <table>
          <thead><tr><th>Name</th><th>Cuisine</th><th>Price</th><th>Featured</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {restaurants.map(r => (
              <React.Fragment key={r._id}>
                <tr>
                  <td>{r.name}</td>
                  <td>{r.cuisine}</td>
                  <td>{r.priceRange}</td>
                  <td>{r.isFeatured ? 'Yes' : ''}</td>
                  <td>{r.isActive === false ? 'No' : 'Yes'}</td>
                  <td>
                    <button className="btn-secondary" onClick={() => handleEdit(r)}>Edit</button>{' '}
                    <button className="btn-secondary" onClick={() => setExpanded(expanded === r._id ? null : r._id)}>Photos</button>{' '}
                    <button className="btn-danger" onClick={() => handleDelete(r._id)}>Delete</button>
                  </td>
                </tr>
                {expanded === r._id && (
                  <tr>
                    <td colSpan="6">
                      <div className="admin-panel" style={{ margin: 0 }}>
                        <h4>Photos</h4>
                        <div className="photo-strip">
                          {(r.photos || []).map(p => (
                            <figure key={p._id}>
                              <img src={p.url} alt={p.altText || ''} style={{ opacity: p.isRetired ? 0.4 : 1 }} />
                              <input value={p.caption || ''} onChange={e => updatePhoto(r._id, p._id, { caption: e.target.value })} placeholder="Caption" />
                              <input value={p.altText || ''} onChange={e => updatePhoto(r._id, p._id, { altText: e.target.value })} placeholder="Alt text" />
                              <div className="gap-10">
                                <button className="btn-secondary" onClick={() => updatePhoto(r._id, p._id, { isRetired: !p.isRetired })}>
                                  {p.isRetired ? 'Restore' : 'Retire'}
                                </button>
                                <button className="btn-danger" onClick={() => deletePhoto(r._id, p._id)}>Delete</button>
                              </div>
                            </figure>
                          ))}
                        </div>
                        <h5>Add photo</h5>
                        <div className="gap-10">
                          <input placeholder="URL" value={photoForms[r._id]?.url || ''} onChange={e => setPhotoForms({ ...photoForms, [r._id]: { ...photoForms[r._id], url: e.target.value } })} />
                          <input placeholder="Caption" value={photoForms[r._id]?.caption || ''} onChange={e => setPhotoForms({ ...photoForms, [r._id]: { ...photoForms[r._id], caption: e.target.value } })} />
                          <input placeholder="Alt text" value={photoForms[r._id]?.altText || ''} onChange={e => setPhotoForms({ ...photoForms, [r._id]: { ...photoForms[r._id], altText: e.target.value } })} />
                          <button className="btn-primary" onClick={() => addPhoto(r._id)}>Add</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageRestaurants;
