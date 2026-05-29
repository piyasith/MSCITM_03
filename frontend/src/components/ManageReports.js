import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE, adminAuthHeader } from '../api';

const ManageReports = () => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('open');
  const [detail, setDetail] = useState(null);
  const [resolution, setResolution] = useState({ status: 'reviewed', resolution: '' });

  useEffect(() => { fetchReports(); }, [filter]);

  const fetchReports = async () => {
    const res = await axios.get(`${API_BASE}/admin/reports?status=${filter}`, { headers: adminAuthHeader() });
    setReports(res.data);
  };

  const openDetail = async (id) => {
    const res = await axios.get(`${API_BASE}/admin/reports/${id}`, { headers: adminAuthHeader() });
    setDetail(res.data);
    setResolution({ status: 'reviewed', resolution: '' });
  };

  const resolve = async () => {
    await axios.patch(`${API_BASE}/admin/reports/${detail.report._id}/resolve`, resolution, { headers: adminAuthHeader() });
    setDetail(null);
    fetchReports();
  };

  return (
    <div>
      <div className="gap-10" style={{ marginBottom: 20 }}>
        {['open', 'reviewed', 'action_taken', 'dismissed'].map(s => (
          <button key={s} className={`btn-secondary ${filter === s ? 'active-pill' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      <div className="data-table">
        <table>
          <thead><tr><th>Type</th><th>Reason</th><th>Reporter</th><th>Reports</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {reports.map(r => (
              <tr key={r._id}>
                <td>{r.targetType}</td>
                <td>{r.reasonCode}</td>
                <td>{r.reporterUserId?.name || r.reporterName}</td>
                <td>{r.details && r.details.substring(0, 40)}</td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td><button className="btn-secondary" onClick={() => openDetail(r._id)}>Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <h3>Report on {detail.report.targetType}</h3>
            <p><strong>Reason:</strong> {detail.report.reasonCode}</p>
            <p><strong>Details:</strong> {detail.report.details || '—'}</p>
            <hr />
            <h4>Reported content</h4>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 10, borderRadius: 8 }}>
              {JSON.stringify(detail.content, null, 2)}
            </pre>
            <div className="form-group">
              <label>Resolution status</label>
              <select value={resolution.status} onChange={e => setResolution({ ...resolution, status: e.target.value })}>
                <option value="reviewed">Reviewed (no action)</option>
                <option value="action_taken">Action taken</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Note</label>
              <textarea value={resolution.resolution} onChange={e => setResolution({ ...resolution, resolution: e.target.value })} />
            </div>
            <div className="gap-10">
              <button className="btn-primary" onClick={resolve}>Resolve</button>
              <button className="btn-secondary" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReports;
