import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function postHeatmap(payload: any) {
  const res = await API.post('/heatmap', payload);
  return res.data;
}

export async function getStatus(activityId: string) {
  const res = await API.get(`/status/${encodeURIComponent(activityId)}`);
  return res;
}

export default API;
