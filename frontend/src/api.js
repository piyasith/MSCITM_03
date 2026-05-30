import axios from 'axios';

export const API_BASE = 'http://13.51.79.132:5002/api';

export const userAuthHeader = () => {
  const t = localStorage.getItem('userToken');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export const adminAuthHeader = () => {
  const t = localStorage.getItem('adminToken');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const api = axios.create({ baseURL: API_BASE });
export default api;
