import { useState, useEffect } from 'react';
import { Intervention, InterventionPriority, InterventionStatus, Equipment } from '../../types/api.types';
import { interventionService } from '../../services/api/interventionService';
import { equipmentService } from '../../services/api/equipmentService';
import LocationPickerMap from '../map/LocationPickerMap';

interface InterventionModalProps {
    isOpen: boolean;
    onClose: () => void;
    intervention?: Intervention | null;
    onSuccess: () => void;
    citizenId?: string;
}

export default function InterventionModal({
    isOpen,
    onClose,
    intervention,
    onSuccess,
    citizenId = 'admin-placeholder'
}: InterventionModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        interventionType: 'ROAD',
        priority: 'MEDIUM' as InterventionPriority,
        status: 'PENDING' as InterventionStatus,
        latitude: '',
        longitude: '',
        address: '',
        equipmentId: ''
    });
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEquipments = async () => {
            try {
                const data = await equipmentService.getAllEquipment();
                setEquipments(data);
            } catch (err) {
                console.error('Failed to fetch equipment', err);
            }
        };
        if (isOpen) {
            fetchEquipments();
        }
    }, [isOpen]);

    useEffect(() => {
        if (intervention) {
            setFormData({
                title: intervention.title,
                description: intervention.description,
                interventionType: intervention.interventionType,
                priority: intervention.priority as InterventionPriority,
                status: intervention.status as InterventionStatus,
                latitude: intervention.location?.coordinates?.[1]?.toString() || '',
                longitude: intervention.location?.coordinates?.[0]?.toString() || '',
                address: intervention.address || '',
                equipmentId: intervention.equipmentId || ''
            });
        } else {
            setFormData({
                title: '',
                description: '',
                interventionType: 'ROAD',
                priority: 'MEDIUM' as InterventionPriority,
                status: 'PENDING' as InterventionStatus,
                latitude: '',
                longitude: '',
                address: '',
                equipmentId: ''
            });
        }
        setError(null);
    }, [intervention, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (intervention) {
                // Update
                await interventionService.updateMaintenanceIntervention(intervention.interventionId, {
                    title: formData.title,
                    description: formData.description,
                    interventionType: formData.interventionType,
                    priority: formData.priority,
                    status: formData.status,
                    location: {
                        type: 'Point',
                        coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
                    },
                    address: formData.address,
                    equipmentId: formData.equipmentId || undefined
                });
            } else {
                // Create
                await interventionService.createIntervention(
                    citizenId,
                    formData.description,
                    formData.interventionType,
                    parseFloat(formData.longitude),
                    parseFloat(formData.latitude),
                    formData.address
                );
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {intervention ? 'Edit Intervention' : 'New Intervention'}
                </h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            disabled={!intervention}
                            placeholder={!intervention ? "Auto-generated" : ""}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Related Equipment (Optional)</label>
                        <select
                            value={formData.equipmentId}
                            onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">-- No Equipment --</option>
                            {equipments.map(eq => (
                                <option key={eq.id} value={eq.id}>
                                    {eq.name} ({eq.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select
                                value={formData.interventionType}
                                onChange={(e) => setFormData({ ...formData, interventionType: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="ROAD">Road</option>
                                <option value="WATER">Water</option>
                                <option value="LIGHTING">Lighting</option>
                                <option value="TRAFFIC">Traffic</option>
                            </select>
                        </div>
                        {intervention && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InterventionStatus })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    {Object.values(InterventionStatus).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {intervention && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as InterventionPriority })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    {Object.values(InterventionPriority).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                        <LocationPickerMap
                            initialLat={formData.latitude ? parseFloat(formData.latitude) : undefined}
                            initialLng={formData.longitude ? parseFloat(formData.longitude) : undefined}
                            onLocationSelect={(lat, lng) => {
                                setFormData({
                                    ...formData,
                                    latitude: lat.toString(),
                                    longitude: lng.toString()
                                });
                            }}
                        />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Click on the map to set the intervention location
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
