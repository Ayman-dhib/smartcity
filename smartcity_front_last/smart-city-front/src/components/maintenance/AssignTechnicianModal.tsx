import { useState, useEffect } from 'react';
import { Technician, Intervention } from '../../types/api.types';
import { adminService } from '../../services/api/adminService';
import { interventionService } from '../../services/api/interventionService';

interface AssignTechnicianModalProps {
    isOpen: boolean;
    onClose: () => void;
    intervention: Intervention;
    onAssigned: () => void;
}

export default function AssignTechnicianModal({
    isOpen,
    onClose,
    intervention,
    onAssigned
}: AssignTechnicianModalProps) {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [selectedTechId, setSelectedTechId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTechnicians();
        }
    }, [isOpen]);

    const fetchTechnicians = async () => {
        try {
            const technicians = await adminService.getAllTechnicians();
            // Technician model typically uses 'available' but doesn't have 'active' status like admins
            // Show all technicians or filter by availability if needed. 
            // For now, showing all to ensure list is populated.
            setTechnicians(technicians);
        } catch (err) {
            console.error('Error fetching technicians:', err);
            setError('Failed to load technicians');
        }
    };

    const handleAssign = async () => {
        if (!selectedTechId) return;

        try {
            setLoading(true);
            setError(null);
            // Note: The service integration might need adjustment based on exact API payload
            // Ideally we should pass the tech ID to the assign endpoint
            // Current service method: assignTechnician(interventionId) - backend might Auto-assign or we need another endpoint
            // Assuming for now we rely on the existing one or need to update it.
            // Wait, the prompt asked to "affect a technician to an intervention".
            // Let's assume there is an endpoint or we use the auto-assign but specific tech assignment is better.
            // Since existing service `assignTechnician` seems to trigger auto-assignment or similar (see params),
            // we might need to fake it or use a different call if available.
            // Looking at `assignTechnician` in service: It takes `interventionId` as param.
            // To create Manual Assignment, we probably need to Update the intervention itself with `assignedTechnicianId`.

            // Use the specific assignment endpoint for Maintenance Admins
            await interventionService.assignTechnicianManual(intervention.interventionId, selectedTechId);

            onAssigned();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to assign technician');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Assign Technician
                </h3>

                <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Intervention: <span className="font-medium text-gray-900 dark:text-white">{intervention.title}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Select Technician
                        </label>
                        <select
                            value={selectedTechId}
                            onChange={(e) => setSelectedTechId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">-- Select a technician --</option>
                            {technicians.map((tech) => (
                                <option key={tech.technicianId} value={tech.technicianId}>
                                    {tech.name} ({tech.skills.join(', ')})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedTechId || loading}
                        className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
                    >
                        {loading ? 'Assigning...' : 'Assign'}
                    </button>
                </div>
            </div>
        </div>
    );
}
