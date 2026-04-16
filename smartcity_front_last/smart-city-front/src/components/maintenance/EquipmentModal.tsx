import { useState, useEffect } from 'react';
import { Equipment, EquipmentType, Status } from '../../types/api.types';
import { equipmentService } from '../../services/api/equipmentService';
import LocationPickerMap from '../map/LocationPickerMap';

interface EquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipment?: Equipment | null; // If null, create mode
    onSuccess: () => void;
}

export default function EquipmentModal({
    isOpen,
    onClose,
    equipment,
    onSuccess
}: EquipmentModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'LIGHTING' as EquipmentType,
        status: 'COMPLETED' as Status, // Default status
        latitude: '',
        longitude: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (equipment) {
            setFormData({
                name: equipment.name,
                type: equipment.type,
                status: equipment.status,
                latitude: equipment.location.coordinates[1].toString(),
                longitude: equipment.location.coordinates[0].toString(),
                address: equipment.address || ''
            });
        } else {
            // Reset form
            setFormData({
                name: '',
                type: 'LIGHTING' as EquipmentType,
                status: 'COMPLETED' as Status,
                latitude: '',
                longitude: '',
                address: ''
            });
        }
        setError(null);
    }, [equipment, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload: any = {
                name: formData.name,
                type: formData.type,
                status: formData.status,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
                },
                address: formData.address
            };

            if (equipment) {
                await equipmentService.updateEquipment(equipment.id, payload);
            } else {
                await equipmentService.createEquipment(payload);
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
                    {equipment ? 'Edit Equipment' : 'Add New Equipment'}
                </h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as EquipmentType })}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                {Object.values(EquipmentType).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                {Object.values(Status).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
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
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Click on the map to set the equipment location
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
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
