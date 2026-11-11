import axios from 'axios';

// Lấy URL từ biến môi trường, mặc định dùng link Render nếu không có .env local
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://nha2dua.onrender.com'
});

export default API;