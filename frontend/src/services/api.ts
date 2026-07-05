import axios from 'axios';

// Set up the base URL for our Django backend
export const API_BASE_URL = 'http://127.0.0.1:8000/api';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to automatically attach JWT token to every protected request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;