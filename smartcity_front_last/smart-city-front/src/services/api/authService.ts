import apiClient from './apiClient';
import { SignInRequest, SignUpRequest, AuthResponse, User, UserRole } from '../../types/api.types';

// ============================================================================
// Authentication Service
// ============================================================================

export const authService = {
    /**
     * Sign in user
     */
    async signIn(email: string, password: string, role: UserRole): Promise<User> {
        const request: SignInRequest = { email, password, role };
        const response = await apiClient.post<AuthResponse>('auth/signin', request);

        if (!response.data.success || !response.data.token) {
            throw new Error(response.data.message || 'Login failed');
        }

        const user: User = {
            userId: response.data.userId!,
            name: response.data.name!,
            email: response.data.email!,
            role: response.data.role!,
            token: response.data.token!,
        };

        // Store token and user data
        // Store token and user data
        if (user.token) {
            this.setToken(user.token);
        }
        this.setUserData(user);

        return user;
    },

    /**
     * Sign up new user
     */
    async signUp(name: string, email: string, password: string, role: UserRole, phone?: string): Promise<User> {
        const request: SignUpRequest = { name, email, password, role, phone };
        const response = await apiClient.post<AuthResponse>('auth/signup', request);

        if (!response.data.success || !response.data.token) {
            throw new Error(response.data.message || 'Registration failed');
        }

        const user: User = {
            userId: response.data.userId!,
            name: response.data.name!,
            email: response.data.email!,
            role: response.data.role!,
            token: response.data.token!,
        };

        // Store token and user data
        // Store token and user data
        if (user.token) {
            this.setToken(user.token);
        }
        this.setUserData(user);

        return user;
    },

    /**
     * Logout user
     */
    logout(): void {
        this.removeToken();
        this.removeUserData();
    },

    /**
     * Get stored token
     */
    getToken(): string | null {
        return localStorage.getItem('auth_token');
    },

    /**
     * Set token in localStorage
     */
    setToken(token: string): void {
        localStorage.setItem('auth_token', token);
    },

    /**
     * Remove token from localStorage
     */
    removeToken(): void {
        localStorage.removeItem('auth_token');
    },

    /**
     * Get current user data
     */
    getCurrentUser(): User | null {
        const userData = localStorage.getItem('user_data');
        if (!userData) return null;

        try {
            const parsedUser = JSON.parse(userData) as User;
            // Ensure role is valid UserRole type
            const validRoles: UserRole[] = ['CITIZEN', 'TECHNICIAN', 'USER_ADMIN', 'MAINTENANCE_ADMIN'];
            if (validRoles.includes(parsedUser.role as UserRole)) {
                return parsedUser;
            } else {
                console.warn('Invalid role in stored user data:', parsedUser.role);
                return null;
            }
        } catch (error) {
            console.error('Failed to parse user data:', error);
            return null;
        }
    },

    /**
     * Set user data in localStorage
     */
    setUserData(user: User): void {
        localStorage.setItem('user_data', JSON.stringify(user));
    },

    /**
     * Remove user data from localStorage
     */
    removeUserData(): void {
        localStorage.removeItem('user_data');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getToken() && !!this.getCurrentUser();
    },

    /**
     * Validate if a role string is valid
     */
    isValidRole(role: string): role is UserRole {
        const validRoles: UserRole[] = ['CITIZEN', 'TECHNICIAN', 'USER_ADMIN', 'MAINTENANCE_ADMIN'];
        return validRoles.includes(role as UserRole);
    },
};