import apiClient from './apiClient';
import { Equipment, EquipmentType, Status } from '../../types/api.types';

// ============================================================================
// Equipment Service
// ============================================================================

export const equipmentService = {
    /**
     * Get all equipment
     */
    async getAllEquipment(): Promise<Equipment[]> {
        const response = await apiClient.get<Equipment[]>('/api/equipment');
        return response.data;
    },

    /**
     * Get equipment by ID
     */
    async getEquipmentById(id: string): Promise<Equipment> {
        const response = await apiClient.get<Equipment>(`/api/equipment/${id}`);
        return response.data;
    },

    /**
     * Create new equipment
     */
    async createEquipment(equipment: Omit<Equipment, 'id'>): Promise<Equipment> {
        const response = await apiClient.post<Equipment>('/api/equipment', equipment);
        return response.data;
    },

    /**
     * Update equipment
     */
    async updateEquipment(id: string, equipment: Partial<Equipment>): Promise<Equipment> {
        const response = await apiClient.put<Equipment>(`/api/equipment/${id}`, equipment);
        return response.data;
    },

    /**
     * Delete equipment
     */
    async deleteEquipment(id: string): Promise<void> {
        await apiClient.delete(`/api/equipment/${id}`);
    },

    /**
     * Filter equipment by status
     */
    async filterByStatus(status: Status): Promise<Equipment[]> {
        const response = await apiClient.get<Equipment[]>(`/api/equipment/filter/status/${status}`);
        return response.data;
    },

    /**
     * Filter equipment by type
     */
    async filterByType(type: EquipmentType): Promise<Equipment[]> {
        const response = await apiClient.get<Equipment[]>(`/api/equipment/filter/type/${type}`);
        return response.data;
    },
};
