import axios from 'axios';

// Set up the base URL for our Django backend
export const API_BASE_URL = 'http://127.0.0.1:8000/api/auth';

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

// If the access token is expired/invalid, log the user out and send them back to login
// instead of showing a raw backend error on the page.
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;