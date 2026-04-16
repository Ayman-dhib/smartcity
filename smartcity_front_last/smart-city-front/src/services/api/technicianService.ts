import apiClient from './apiClient';
import { Technician, Skill } from '../../types/api.types';

// ============================================================================
// Technician Service
// ============================================================================

export const technicianService = {
    /**
     * Get all technicians
     */
    async getAllTechnicians(): Promise<Technician[]> {
        const response = await apiClient.get<Technician[]>('/api/technicians');
        return response.data;
    },

    /**
     * Get available technicians
     */
    async getAvailableTechnicians(): Promise<Technician[]> {
        const response = await apiClient.get<Technician[]>('/api/technicians/available');
        return response.data;
    },

    /**
     * Get technician by ID
     */
    async getTechnicianById(id: string): Promise<Technician> {
        const response = await apiClient.get<Technician>(`/api/technicians/${id}`);
        return response.data;
    },

    /**
     * Create new technician
     */
    async createTechnician(technician: Omit<Technician, 'technicianId'>): Promise<Technician> {
        const response = await apiClient.post<Technician>('/api/technicians', technician);
        return response.data;
    },

    /**
     * Update technician
     */
    async updateTechnician(id: string, technician: Partial<Technician>): Promise<Technician> {
        const response = await apiClient.put<Technician>(`/api/technicians/${id}`, technician);
        return response.data;
    },

    /**
     * Delete technician
     */
    async deleteTechnician(id: string): Promise<void> {
        await apiClient.delete(`/api/technicians/${id}`);
    },

    /**
     * Update technician skills
     */
    async updateSkills(id: string, skills: Skill[]): Promise<Technician> {
        const response = await apiClient.patch<Technician>(`/api/technicians/${id}/skills`, { skills });
        return response.data;
    },

    /**
     * Update technician availability
     */
    async updateAvailability(id: string, available: boolean): Promise<Technician> {
        const params = new URLSearchParams({ available: available.toString() });
        const response = await apiClient.put<Technician>(
            `/api/technicians/${id}/availability?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Update technician workload
     */
    async updateWorkload(id: string, workload: number): Promise<Technician> {
        const params = new URLSearchParams({ workload: workload.toString() });
        const response = await apiClient.put<Technician>(
            `/api/technicians/${id}/workload?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Update technician location
     */
    async updateLocation(id: string, location: { lat: number; lng: number }): Promise<Technician> {
        const response = await apiClient.patch<Technician>(`/api/technicians/${id}/location`, location);
        return response.data;
    },

    /**
     * Get interventions assigned to the current technician
     */
    async getMyInterventions(): Promise<any[]> {
        const response = await apiClient.get<any[]>('/api/technicians/me/interventions');
        return response.data;
    },

    /**
     * Update intervention status
     */
    async updateInterventionStatus(id: string, status: string): Promise<any> {
        const response = await apiClient.patch<any>(`/api/technicians/interventions/${id}/status`, { status });
        return response.data;
    },
};
