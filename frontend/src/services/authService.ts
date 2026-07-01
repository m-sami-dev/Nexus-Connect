import API from './api';

// Service to handle user registration and login requests
export const authService = {
    register: async (userData: any) => {
        const response = await API.post('auth/register/', userData);
        return response.data;
    },
    
    login: async (credentials: any) => {
        const response = await API.post('auth/login/', credentials);
        if (response.data.access) {
            // Store tokens and user details in localStorage upon successful login
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user_role', response.data.role);
            localStorage.setItem('user_email', response.data.email);
        }
        return response.data;
    },

    logout: () => {
        // Clear all session details on logout
        localStorage.clear();
    }
};