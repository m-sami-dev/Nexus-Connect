import API from './api';

export const authService = {
    register: async (userData: any) => {
        const response = await API.post('auth/register/', userData);
        return response.data;
    },
    
    login: async (credentials: any) => {
        const response = await API.post('auth/login/', credentials);
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user_role', response.data.role);
            localStorage.setItem('user_email', response.data.email);
        }
        return response.data;
    },

    // New profile service function to fetch or update authenticated user data
    getProfile: async () => {
        const response = await API.get('auth/profile/');
        return response.data;
    },

    updateProfile: async (profileData: any) => {
        const response = await API.put('auth/profile/', profileData);
        return response.data;
    },

    logout: () => {
        localStorage.clear();
    }
};