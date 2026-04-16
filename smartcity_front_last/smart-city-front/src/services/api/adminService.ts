import apiClient from './apiClient';
import {
  UserAdmin,
  MaintenanceAdmin,
  Citizen,
  Technician,
  CreateUserAdminDTO,
  CreateMaintenanceAdminDTO,
  CreateUserDTO,
  PasswordUpdateDTO,
  AdminStats,
  ApiResponse,
  UserRole
} from '../../types/api.types';

// ============================================================================
// Admin Service
// ============================================================================

export const adminService = {
  // ==================== USER MANAGEMENT ====================

  /**
   * Get all users (citizens, technicians, admins)
   * Note: Backend does not have endpoint for all citizens, so that list will be empty
   */
  async getAllUsers(): Promise<{
    citizens: Citizen[];
    technicians: Technician[];
    userAdmins: UserAdmin[];
    maintenanceAdmins: MaintenanceAdmin[];
  }> {
    // Backend doesn't have a single "get all users" endpoint, so we fetch what we can in parallel
    try {
      const [techniciansRes, userAdminsRes, maintenanceAdminsRes, citizensRes] = await Promise.all([
        apiClient.get('/api/technicians').catch(() => ({ data: [] })),
        apiClient.get('/api/admins/user').catch(() => ({ data: [] })),
        apiClient.get('/api/admins/maintenance').catch(() => ({ data: [] })),
        apiClient.get('/api/citizens').catch(() => ({ data: [] }))
      ]);

      return {
        citizens: citizensRes.data || [],
        technicians: techniciansRes.data || [],
        userAdmins: userAdminsRes.data || [],
        maintenanceAdmins: maintenanceAdminsRes.data || []
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  /**
   * Get all technicians specifically
   */
  async getAllTechnicians(): Promise<Technician[]> {
    const response = await apiClient.get<Technician[]>('/api/technicians');
    return response.data;
  },

  /**
   * Create a new user (citizen, technician, or admin)
   */
  async createUser(userData: CreateUserDTO): Promise<ApiResponse<any>> {
    let endpoint = '';

    // Route to correct endpoint based on role
    switch (userData.role) {
      case 'TECHNICIAN':
        endpoint = '/api/technicians';
        break;
      case 'USER_ADMIN':
        endpoint = '/api/admins/user';
        break;
      case 'MAINTENANCE_ADMIN':
        endpoint = '/api/admins/maintenance';
        break;
      case 'CITIZEN':
      default:
        // Use public signup for citizens as there is no admin-specific create endpoint
        endpoint = '/api/auth/signup';
        break;
    }

    const response = await apiClient.post(endpoint, userData);

    // Normalize response if needed (signup returns different structure than admin create)
    return {
      success: true,
      message: 'User created successfully',
      data: response.data
    };
  },

  /**
   * Update user role
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(`/api/admins/users/${userId}/role`, { newRole });
    return response.data;
  },

  /**
   * Update user role
   */
  async toggleUserStatus(userId: string): Promise<ApiResponse<any>> {
    // For Technicians and Citizens, we need to fetch -> update because there is no specific toggle endpoint
    try {
      // Try to find if it's a technician first (most likely given the context of this call usually)
      try {
        const techRes = await apiClient.get<Technician>(`/api/technicians/${userId}`);
        const technician = techRes.data;
        // Toggle active status
        const updatedTech = { ...technician, active: !technician.active };
        const response = await apiClient.put(`/api/technicians/${userId}`, updatedTech);
        return { success: true, message: "Status updated", data: response.data };
      } catch (e) {
        // Not a technician, or fetch failed. Try Citizen (if endpoint existed, but it doesn't really).
        // If it was a 404 on technician, we can't do much for citizen as there is no update endpoint for admins to update citizens
        throw new Error("Cannot toggle status: User not found or not supported.");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      throw error;
    }
  },



  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/api/admins/users/${userId}`);
    return response.data;
  },

  /**
   * Update technician details
   */
  async updateTechnician(technicianId: string, data: Partial<Technician>): Promise<ApiResponse<Technician>> {
    const response = await apiClient.put(`/api/technicians/${technicianId}`, data);
    return response.data;
  },

  /**
   * Get technician details
   */
  async getTechnician(technicianId: string): Promise<Technician> {
    const response = await apiClient.get<Technician>(`/api/technicians/${technicianId}`);
    return response.data;
  },

  /**
   * Update citizen details
   */
  async updateCitizen(citizenId: string, data: Partial<Citizen>): Promise<ApiResponse<Citizen>> {
    const response = await apiClient.put(`/api/citizens/${citizenId}`, data);
    return response.data;
  },

  /**
   * Get citizen details
   */
  async getCitizen(citizenId: string): Promise<Citizen> {
    const response = await apiClient.get<Citizen>(`/api/citizens/${citizenId}`);
    return response.data;
  },

  /**
   * Delete citizen
   */
  async deleteCitizen(citizenId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/api/citizens/${citizenId}`);
    return response.data;
  },

  // ==================== USER ADMIN MANAGEMENT ====================

  /**
   * Get all user admins
   */
  async getAllUserAdmins(): Promise<UserAdmin[]> {
    const response = await apiClient.get('/api/admins/user');
    return response.data;
  },

  /**
   * Get user admin details
   */
  async getUserAdmin(adminId: string): Promise<UserAdmin> {
    const response = await apiClient.get<UserAdmin>(`/api/admins/user/${adminId}`);
    return response.data;
  },

  /**
   * Create new user admin
   */
  async createUserAdmin(adminData: CreateUserAdminDTO): Promise<ApiResponse<UserAdmin>> {
    const response = await apiClient.post('/api/admins/user', adminData);
    return response.data;
  },

  /**
   * Update user admin
   */
  async updateUserAdmin(adminId: string, adminData: Partial<UserAdmin>): Promise<ApiResponse<UserAdmin>> {
    const response = await apiClient.put(`/api/admins/user/${adminId}`, adminData);
    return response.data;
  },

  /**
   * Update user admin password
   */
  async updateUserAdminPassword(adminId: string, passwordData: PasswordUpdateDTO): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(`/api/admins/user/${adminId}/password`, passwordData);
    return response.data;
  },

  /**
   * Toggle user admin status
   */
  async toggleUserAdminStatus(adminId: string): Promise<ApiResponse<UserAdmin>> {
    const response = await apiClient.patch(`/api/admins/user/${adminId}/toggle-status`);
    return response.data;
  },

  /**
   * Delete user admin
   */
  async deleteUserAdmin(adminId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/api/admins/user/${adminId}`);
    return response.data;
  },

  // ==================== MAINTENANCE ADMIN MANAGEMENT ====================

  /**
   * Get all maintenance admins
   */
  async getAllMaintenanceAdmins(): Promise<MaintenanceAdmin[]> {
    const response = await apiClient.get('/api/admins/maintenance');
    return response.data;
  },

  /**
   * Get maintenance admin details
   */
  async getMaintenanceAdmin(adminId: string): Promise<MaintenanceAdmin> {
    const response = await apiClient.get<MaintenanceAdmin>(`/api/admins/maintenance/${adminId}`);
    return response.data;
  },

  /**
   * Create new maintenance admin
   */
  async createMaintenanceAdmin(adminData: CreateMaintenanceAdminDTO): Promise<ApiResponse<MaintenanceAdmin>> {
    const response = await apiClient.post('/api/admins/maintenance', adminData);
    return response.data;
  },

  /**
   * Update maintenance admin
   */
  async updateMaintenanceAdmin(adminId: string, adminData: Partial<MaintenanceAdmin>): Promise<ApiResponse<MaintenanceAdmin>> {
    const response = await apiClient.put(`/api/admins/maintenance/${adminId}`, adminData);
    return response.data;
  },

  /**
   * Toggle maintenance admin status
   */
  async toggleMaintenanceAdminStatus(adminId: string): Promise<ApiResponse<MaintenanceAdmin>> {
    const response = await apiClient.patch(`/api/admins/maintenance/${adminId}/toggle-status`);
    return response.data;
  },

  /**
   * Delete maintenance admin
   */
  async deleteMaintenanceAdmin(adminId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/api/admins/maintenance/${adminId}`);
    return response.data;
  },

  // ==================== STATISTICS ====================

  /**
   * Get admin statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    const response = await apiClient.get('/api/admins/stats');
    return response.data;
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalCitizens: number;
    totalTechnicians: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    const response = await apiClient.get('/api/admins/users/stats');
    return response.data;
  },

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk create users
   */
  async bulkCreateUsers(users: CreateUserDTO[]): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/api/admins/users/bulk', { users });
    return response.data;
  },

  /**
   * Export users to CSV
   */
  async exportUsers(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/api/admins/users/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Import users from CSV
   */
  async importUsers(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/admins/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};