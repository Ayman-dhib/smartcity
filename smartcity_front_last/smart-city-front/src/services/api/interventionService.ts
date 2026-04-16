import apiClient from './apiClient';
import {
    Intervention,
    SchedulerRealDataResponse,
    AssignTechnicianResponse,
    AIProcessResponse,
    AnalyzeInterventionResponse,
} from '../../types/api.types';

// ============================================================================
// Intervention Service
// ============================================================================

export const interventionService = {
    /**
     * Create new intervention (report issue)
     */
    async createIntervention(
        citizenId: string,
        description: string,
        interventionType: string,
        longitude: number,
        latitude: number,
        address?: string
    ): Promise<Intervention> {
        const params = new URLSearchParams({
            citizenId,
            description,
            interventionType,
            longitude: longitude.toString(),
            latitude: latitude.toString(),
            ...(address && { address }),
        });

        const response = await apiClient.post<Intervention>(
            `/api/citizens/report-issue?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Get all interventions and technicians
     */
    async getAllInterventions(): Promise<SchedulerRealDataResponse> {
        const response = await apiClient.get<SchedulerRealDataResponse>('/api/scheduler/real-data');
        return response.data;
    },

    /**
     * Get intervention by ID (filtered client-side)
     */
    async getInterventionById(id: string): Promise<Intervention | null> {
        try {
            const response = await apiClient.get<Intervention>(`/api/citizens/interventions/${id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch intervention:", error);
            return null;
        }
    },

    /**
     * Get interventions by technician ID (filtered client-side)
     */
    async getInterventionsByTechnician(technicianId: string): Promise<Intervention[]> {
        const data = await this.getAllInterventions();
        return data.interventions.filter((i) => i.assignedTechnicianId === technicianId);
    },

    /**
     * Get interventions by citizen ID (filtered client-side)
     * Note: Backend doesn't store citizenId in intervention, so this is a placeholder
     */
    async getInterventionsByCitizen(_citizenId: string): Promise<Intervention[]> {
        const data = await this.getAllInterventions();
        // TODO: Backend needs to add citizenId field to Intervention model
        // For now, return all interventions
        return data.interventions;
    },

    /**
     * Assign technician to intervention
     */
    async assignTechnician(interventionId: string): Promise<AssignTechnicianResponse> {
        const params = new URLSearchParams({ interventionId });
        const response = await apiClient.post<AssignTechnicianResponse>(
            `/api/scheduler/assign-technician?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Process intervention with AI
     */
    async processInterventionWithAI(interventionId: string): Promise<AIProcessResponse> {
        const params = new URLSearchParams({ interventionId });
        const response = await apiClient.post<AIProcessResponse>(
            `/api/scheduler/ai-process-real-intervention?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Get AI analysis for intervention
     */
    async analyzeIntervention(interventionId: string): Promise<AnalyzeInterventionResponse> {
        const params = new URLSearchParams({ interventionId });
        const response = await apiClient.get<AnalyzeInterventionResponse>(
            `/api/scheduler/analyze-intervention?${params.toString()}`
        );
        return response.data;
    },
    /**
     * Update intervention
     */
    async updateIntervention(id: string, intervention: Partial<Intervention>): Promise<Intervention> {
        const response = await apiClient.put<Intervention>(`/api/interventions/${id}`, intervention);
        return response.data;
    },

    /**
     * Delete intervention
     */
    async deleteIntervention(id: string): Promise<void> {
        await apiClient.delete(`/api/maintenance/interventions/${id}`);
    },

    /**
     * Assign technician to intervention (Manual - Maintenance Admin)
     */
    async assignTechnicianManual(interventionId: string, technicianId: string, notes?: string): Promise<Intervention> {
        const response = await apiClient.patch<Intervention>(
            `/api/maintenance/interventions/${interventionId}/assign`,
            { technicianId, assignmentNotes: notes }
        );
        return response.data;
    },

    /**
     * Get all interventions (Maintenance Admin)
     * Supports filtering via query params if needed, for now just fetches all
     */
    async getMaintenanceInterventions(): Promise<Intervention[]> {
        const response = await apiClient.get<Intervention[]>('/api/maintenance/interventions');
        return response.data;
    },

    /**
     * Update intervention (Maintenance Admin)
     */
    async updateMaintenanceIntervention(id: string, intervention: Partial<Intervention>): Promise<Intervention> {
        const response = await apiClient.put<Intervention>(`/api/maintenance/interventions/${id}`, intervention);
        return response.data;
    },
};
