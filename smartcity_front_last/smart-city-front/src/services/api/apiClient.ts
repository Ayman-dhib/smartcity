import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Error Response Type
interface ApiErrorResponse {
    message?: string;
    error?: string;
    [key: string]: any;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/';


// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            if (!config.headers) {
                // Ensure headers object exists
                config.headers = <any>{};
            }
            // Use set if available (AxiosHeaders), otherwise direct assignment
            if (typeof config.headers.set === 'function') {
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                (config.headers as any).Authorization = `Bearer ${token}`;
            }
        }

        // Log request in development
        if (import.meta.env.DEV) {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }

        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
    (response) => {
        // Log response in development
        if (import.meta.env.DEV) {
            console.log(`[API Response] ${response.config.url}`, response.data);
        }
        return response;
    },
    (error: AxiosError<ApiErrorResponse>) => {
        // Handle 401 Unauthorized - Auto logout
        if (error.response?.status === 401) {
            console.warn('[API] Unauthorized - Logging out');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/signin';
        }

        // Handle network errors
        if (!error.response) {
            console.error('[API] Network Error:', error.message);
            return Promise.reject({
                message: 'Unable to connect to server. Please check your internet connection.',
                originalError: error,
            });
        }

        // Handle other errors
        const errorMessage = error.response.data?.message || error.message || 'An error occurred';
        console.error(`[API Error] ${error.response.status}:`, errorMessage);

        return Promise.reject({
            status: error.response.status,
            message: errorMessage,
            data: error.response.data,
            originalError: error,
        });
    }
);

export default apiClient;
