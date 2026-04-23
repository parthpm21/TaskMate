import axios from 'axios';
import { getClerkToken } from './tokenStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach Clerk's short-lived JWT on every request
api.interceptors.request.use(async (config) => {
  const token = await getClerkToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 handling — Clerk manages re-auth so we just reject
    return Promise.reject(err);
  }
);

export default api;