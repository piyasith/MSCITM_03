import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [editing, setEditing] = useState(null);
  const [edit, setEdit] = useState({});

  const fetchUsers = async () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (flagged) params.append('flagged', 'true');
    const res = await axios.get(`${API_BASE}/admin/users?${params.toString()}`, { headers: adminAuthHeader() });
    setUsers(res.data);
  };
  const fetchRestaurants = async () => {
    const res = await axios.get(`${API_BASE}/restaurants`);
    setRestaurants(res.data);
  };

  useEffect(() => { fetchUsers(); }, [flagged]);
  useEffect(() => { fetchRestaurants(); }, []);

  const startEdit = (u) => {
    setEditing(u._id);
    setEdit({
      role: u.role,
      representsRestaurantId: u.representsRestaurantId || '',
      isFlagged: u.isFlagged,
      isBanned: u.isBanned,
      strikes: u.strikes,
      reason: ''
    });
  };

  const save = async (id) => {
    const body = { ...edit };
    if (!body.representsRestaurantId) body.representsRestaurantId = null;
    await axios.put(`${API_BASE}/admin/users/${id}`, body, { headers: adminAuthHeader() });
    setEditing(null);
    fetchUsers();
  };

  return (
    <div>
      <div className="gap-10" style={{ marginBottom: 20 }}>
        <input placeholder="Search by name or email" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn-secondary" onClick={fetchUsers}>Search</button>
        <label><input type="checkbox" checked={flagged} onChange={e => setFlagged(e.target.checked)} /> Flagged only</label>
      </div>
      <div className="data-table">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Represents</th><th>Strikes</th><th>Flagged</th><th>Banned</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {editing === u._id ? (
                    <select value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })}>
                      <option value="user">user</option>
                      <option value="company_rep">company_rep</option>
                    </select>
                  ) : u.role}
                </td>
                <td>
                  {editing === u._id ? (
                    <select value={edit.representsRestaurantId || ''} onChange={e => setEdit({ ...edit, representsRestaurantId: e.target.value })}>
                      <option value="">—</option>
                      {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  ) : (restaurants.find(r => r._id === u.representsRestaurantId)?.name || '—')}
                </td>
                <td>{editing === u._id ? (
                  <input type="number" value={edit.strikes} onChange={e => setEdit({ ...edit, strikes: parseInt(e.target.value, 10) })} style={{ width: 60 }} />
                ) : u.strikes}</td>
                <td>{editing === u._id ? (
                  <input type="checkbox" checked={edit.isFlagged} onChange={e => setEdit({ ...edit, isFlagged: e.target.checked })} />
                ) : (u.isFlagged ? 'Yes' : 'No')}</td>
                <td>{editing === u._id ? (
                  <input type="checkbox" checked={edit.isBanned} onChange={e => setEdit({ ...edit, isBanned: e.target.checked })} />
                ) : (u.isBanned ? 'Yes' : 'No')}</td>
                <td>
                  {editing === u._id ? (
                    <>
                      <button className="btn-primary" onClick={() => save(u._id)}>Save</button>
                      <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="btn-secondary" onClick={() => startEdit(u)}>Edit</button>
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

export default ManageUsers;
