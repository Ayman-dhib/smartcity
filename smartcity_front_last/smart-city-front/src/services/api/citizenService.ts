import apiClient from './apiClient';
import { Intervention, RatingRequestDTO, RatingResponseDTO } from '../../types/api.types';

export interface ReportIssueRequest {
    citizenId: string;
    equipmentId: string;
    description: string;
    interventionType: string;
}

export const citizenService = {
    /**
     * Report a new issue (create intervention)
     */
    async reportIssue(data: Omit<ReportIssueRequest, 'citizenId'>): Promise<Intervention> {
        // Send JSON directly (matching @RequestBody)
        // Note: citizenId is now extracted from JWT on backend, so we don't strictly need to send it,
        // but if the DTO requires it, we might need to send a dummy or update the DTO.
        // For now, let's send the data as is, but the backend will ignore the citizenId field if present.
        const response = await apiClient.post<any>('/api/citizens/report-issue', data);

        // Backend now returns { success: true, intervention: ... }
        if (response.data.intervention) {
            return response.data.intervention;
        }
        return response.data; // Fallback
    },

    /**
     * Get interventions for the authenticated citizen
     */
    async getMyInterventions(): Promise<{ interventions: Intervention[] }> {
        const response = await apiClient.get<{ success: boolean, interventions: Intervention[] }>('/api/citizens/interventions');
        return response.data;
    },

    /**
     * Submit rating for a completed intervention
     */
    async submitRating(ratingRequest: RatingRequestDTO): Promise<RatingResponseDTO> {
        const response = await apiClient.post<RatingResponseDTO>(
            '/api/rating/submit', 
            ratingRequest
        );
        return response.data;
    },
};