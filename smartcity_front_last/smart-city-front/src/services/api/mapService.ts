import apiClient from './apiClient';
import { MapPointDTO, Technician } from '../../types/api.types';

// ============================================================================
// Map Service
// ============================================================================

export const mapService = {
    /**
     * Get all equipment map points
     */
    async getAllEquipmentPoints(): Promise<MapPointDTO[]> {
        const response = await apiClient.get<MapPointDTO[]>('/api/map/equipments');
        return response.data;
    },

    /**
     * Get all intervention map points
     */
    async getAllInterventionPoints(): Promise<MapPointDTO[]> {
        const response = await apiClient.get<MapPointDTO[]>('/api/map/interventions');
        return response.data;
    },

    /**
     * Get all map points (equipment + interventions)
     */
    async getAllMapPoints(): Promise<MapPointDTO[]> {
        const response = await apiClient.get<MapPointDTO[]>('/api/map/all');
        return response.data;
    },

    /**
     * Get nearby technicians for an equipment
     */
    async getNearbyTechnicians(equipmentId: string, maxDistance: number = 10): Promise<Technician[]> {
        const params = new URLSearchParams({
            equipmentId,
            maxDistance: maxDistance.toString(),
        });
        const response = await apiClient.get<Technician[]>(
            `/api/public/map/nearby-technicians?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Get nearby map points (generic)
     */
    async getNearbyPoints(lat: number, lng: number, radius: number): Promise<MapPointDTO[]> {
        const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            radius: radius.toString(),
        });
        const response = await apiClient.get<MapPointDTO[]>(
            `/api/map/nearby?${params.toString()}`
        );
        return response.data;
    },
};
