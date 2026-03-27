import axios from 'axios';

const publicClient = axios.create({
  baseURL: '/mira/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const submitInquiry = (data) => publicClient.post('/public/inquiry', data);

export default publicClient;
