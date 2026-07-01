import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to map API response securely to your strict frontend User Type
  const mapProfileToUser = (apiData: any): User => {
    return {
      id: apiData.id.toString(),
      name: apiData.username,
      email: apiData.email,
      role: apiData.role as UserRole,
      companyName: apiData.company_name,
      industry: apiData.industry,
      bio: apiData.bio || '',
      avatarUrl: apiData.profile_picture || '', // Fixed missing property error
      createdAt: new Date().toISOString(),     // Fixed missing property error
    };
  };

  const fetchUserProfile = async () => {
    try {
      const profileData = await authService.getProfile();
      setUser(mapProfileToUser(profileData));
    } catch (error) {
      console.error("Failed to load user profile:", error);
      authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const data = await authService.login({ email, password });
      if (data.role !== role) {
        authService.logout();
        throw new Error(`Invalid credentials for role: ${role}`);
      }
      await fetchUserProfile();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      await authService.register({
        username: name.toLowerCase().replace(/\s+/g, ''),
        email,
        password,
        role,
      });
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = 'Registration failed';
      if (errorData) {
        errorMessage = Object.values(errorData).flat().join(' ') || errorMessage;
      }
      throw new Error(errorMessage);
    }
  };

  // Fixed signature mismatch: now correctly accepts userId and Partial<User>
  const updateProfile = async (userId: string, updates: Partial<User>) => {
    try {
      const backendPayload = {
        username: updates.name,
        company_name: updates.companyName,
        industry: updates.industry,
        bio: updates.bio,
      };
      const updated = await authService.updateProfile(backendPayload);
      setUser(mapProfileToUser(updated));
    } catch (error: any) {
      throw new Error('Failed to update profile details');
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};