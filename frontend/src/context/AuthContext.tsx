import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user session exists on app load
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role') as UserRole;
    const email = localStorage.getItem('user_email');

    if (token && role && email) {
      setUser({
        id: '1', // Static ID for session mapping
        name: email.split('@')[0], // Fallback name from email
        email: email,
        role: role,
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const data = await authService.login({ email, password });
      
      // Validation to ensure user logs into the correct dashboard role
      if (data.role !== role) {
        authService.logout();
        throw new Error(`Invalid credentials for role: ${role}`);
      }

      setUser({
        id: data.id || '1',
        name: data.username,
        email: data.email,
        role: data.role as UserRole,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      await authService.register({
        username: name.toLowerCase().replace(/\s+/g, ''), // Generate valid unique username
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

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
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