import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { adminService } from '../../services/api/adminService';
import { UserRole, EquipmentType, Skill, Technician, MaintenanceAdmin } from '../../types/api.types';
import LocationPickerMap from '../map/LocationPickerMap';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: () => void;
    user: any; // Using any for flexibility, but should ideally be a union type
    role: UserRole;
}

export default function EditUserModal({
    isOpen,
    onClose,
    onUserUpdated,
    user,
    role
}: EditUserModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Basic user info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Maintenance admin specific
    const [managedEquipmentTypes, setManagedEquipmentTypes] = useState<EquipmentType[]>([]);
    const [canConfigureScheduler, setCanConfigureScheduler] = useState(false);
    const [maxAssignmentsPerDay, setMaxAssignmentsPerDay] = useState(5);

    // Technician specific
    const [skills, setSkills] = useState<Skill[]>([]);
    const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

    // All available options
    const equipmentTypes: EquipmentType[] = Object.values(EquipmentType);
    const allSkills: Skill[] = Object.values(Skill);

    // Initialize form with user data
    useEffect(() => {
        if (isOpen && user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');

            if (role === 'MAINTENANCE_ADMIN') {
                const admin = user as MaintenanceAdmin;
                setManagedEquipmentTypes(admin.managedEquipmentTypes || []);
                setCanConfigureScheduler(admin.canConfigureScheduler || false);
                setMaxAssignmentsPerDay(admin.maxAssignmentsPerDay || 5);
            } else if (role === 'TECHNICIAN') {
                const tech = user as Technician;
                setSkills(tech.skills || []);
                if (tech.location && tech.location.coordinates) {
                    // GeoJson is [lng, lat]
                    setLocation({
                        lng: tech.location.coordinates[0],
                        lat: tech.location.coordinates[1]
                    });
                } else {
                    setLocation(undefined);
                }
            }

            setError(null);
            setSuccessMessage(null);
        }
    }, [isOpen, user, role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            let response;
            const baseUserData = {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
            };

            // Depending on role, call different update endpoints
            if (role === 'TECHNICIAN') {
                const techData: any = {
                    ...baseUserData,
                    skills,
                };

                if (location) {
                    techData.location = {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    };
                }

                // Use property access for ID to avoid compilation errors if types mismatch
                const id = (user as any).technicianId || (user as any).id || (user as any).userId;
                response = await adminService.updateTechnician(id, techData);
            } else if (role === 'MAINTENANCE_ADMIN') {
                const maintData = {
                    ...baseUserData,
                    managedEquipmentTypes,
                    canConfigureScheduler,
                    maxAssignmentsPerDay
                };
                const id = (user as any).maintenanceAdminId || (user as any).id;
                response = await adminService.updateMaintenanceAdmin(id, maintData);
            } else if (role === 'USER_ADMIN') {
                const id = (user as any).userAdminId || (user as any).id;
                response = await adminService.updateUserAdmin(id, baseUserData);
            } else if (role === 'CITIZEN') {
                const id = (user as any).userId || (user as any).id;
                response = await adminService.updateCitizen(id, baseUserData);
            } else {
                throw new Error("Unsupported role for update");
            }

            if (response && (response.success || response)) { // Handle different response structures if any
                setSuccessMessage('User updated successfully');
                setTimeout(() => {
                    onUserUpdated();
                    onClose();
                }, 1500);
            } else {
                // If response.success is false or missing (but error wasn't thrown)
                setError('Failed to update user');
            }
        } catch (err: any) {
            console.error('Error updating user:', err);
            setError(err.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    const toggleEquipmentType = (type: EquipmentType) => {
        setManagedEquipmentTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const toggleSkill = (skill: Skill) => {
        setSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setLocation({ lat, lng });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex justify-center min-h-screen px-4 pt-20 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
                    onClick={onClose}
                />

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-top sm:mt-24 sm:max-w-xl sm:w-full">
                    <div className="px-6 pt-5 pb-4 sm:p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Edit {role.replace('_', ' ')}
                            </h3>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">{successMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>

                            {role === 'MAINTENANCE_ADMIN' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Managed Equipment Types
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {equipmentTypes.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => toggleEquipmentType(type)}
                                                    className={`flex items-center justify-between p-2 rounded-lg border text-sm ${managedEquipmentTypes.includes(type)
                                                        ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20'
                                                        : 'bg-white border-gray-300'
                                                        }`}
                                                >
                                                    <span>{type}</span>
                                                    {managedEquipmentTypes.includes(type) && <CheckIcon className="h-4 w-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Assignments</label>
                                        <input type="number" min="1" value={maxAssignmentsPerDay} onChange={(e) => setMaxAssignmentsPerDay(parseInt(e.target.value))} className="mt-1 w-20 px-2 py-1 border rounded-lg" />
                                    </div>
                                </>
                            )}

                            {role === 'TECHNICIAN' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Skills
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {allSkills.map((skill) => (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() => toggleSkill(skill)}
                                                    className={`flex items-center justify-between p-2 rounded-lg border text-sm ${skills.includes(skill)
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20'
                                                        : 'bg-white border-gray-300'
                                                        }`}
                                                >
                                                    <span>{skill}</span>
                                                    {skills.includes(skill) && <CheckIcon className="h-4 w-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Location (Base of Operations)
                                        </label>
                                        <LocationPickerMap
                                            initialLat={location?.lat}
                                            initialLng={location?.lng}
                                            onLocationSelect={handleLocationSelect}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Selected: {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'None'}
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
