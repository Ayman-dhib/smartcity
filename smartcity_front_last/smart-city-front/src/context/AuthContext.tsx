import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api/authService';
import { User } from '../types/api.types';

// ============================================================================
// Auth Context Types
// ============================================================================

type UserRole = 'CITIZEN' | 'TECHNICIAN' | 'USER_ADMIN' | 'MAINTENANCE_ADMIN';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, role: UserRole) => Promise<void>;
    signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

// ============================================================================
// Auth Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing auth on mount
    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser && authService.getToken()) {
            setUser(currentUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string, role: UserRole) => {
        setIsLoading(true);
        try {
            const userData = await authService.signIn(email, password, role);
            setUser(userData);
        } catch (error: any) {
            throw new Error(error.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (name: string, email: string, password: string, role: UserRole) => {
        setIsLoading(true);
        try {
            const userData = await authService.signUp(name, email, password, role);
            setUser(userData);
        } catch (error: any) {
            throw new Error(error.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const updateUser = (updatedUser: User) => {
        authService.setUserData(updatedUser);
        setUser(updatedUser);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// useAuth Hook
// ============================================================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}