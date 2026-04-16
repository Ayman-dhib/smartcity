import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { adminService } from '../../services/api/adminService';
import { UserRole, EquipmentType, Skill, Technician, MaintenanceAdmin } from '../../types/api.types';

interface SimpleUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user?: any;
    initialRole?: UserRole;
}

export default function SimpleUserModal({
    isOpen,
    onClose,
    onSuccess,
    user,
    initialRole = 'CITIZEN'
}: SimpleUserModalProps) {
    const isEditMode = !!user;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form State
    const [role, setRole] = useState<UserRole>(initialRole);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // Role Specific State
    const [skills, setSkills] = useState<Skill[]>([]);
    const [managedEquipmentTypes, setManagedEquipmentTypes] = useState<EquipmentType[]>([]);
    const [maxAssignmentsPerDay, setMaxAssignmentsPerDay] = useState(5);
    const [canConfigureScheduler, setCanConfigureScheduler] = useState(false);

    // Safe enum conversion
    const equipmentTypes = [
        EquipmentType.LIGHTING,
        EquipmentType.TRAFFIC,
        EquipmentType.ROAD,
        EquipmentType.WATER
    ];

    const allSkills = Object.values(Skill);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setSuccessMessage(null);
            if (user) {
                // EDIT MODE
                setRole(user.role || initialRole); // Ideally role comes from user object
                setName(user.name || '');
                setEmail(user.email || '');
                setPhone(user.phone || '');
                setPassword(''); // No password edit here for simplicity

                // Technician specific
                if (user.role === 'TECHNICIAN' || initialRole === 'TECHNICIAN') {
                    const tech = user as Technician;
                    setSkills(tech.skills || []);
                }

                // Maintenance Admin specific
                if (user.role === 'MAINTENANCE_ADMIN' || initialRole === 'MAINTENANCE_ADMIN') {
                    const admin = user as MaintenanceAdmin;
                    setManagedEquipmentTypes(admin.managedEquipmentTypes || []);
                    setMaxAssignmentsPerDay(admin.maxAssignmentsPerDay || 5);
                    setCanConfigureScheduler(admin.canConfigureScheduler || false);
                }

            } else {
                // CREATE MODE - Reset
                setRole(initialRole);
                setName('');
                setEmail('');
                setPhone('');
                setPassword('');
                setSkills([]);
                setManagedEquipmentTypes([]);
                setMaxAssignmentsPerDay(5);
                setCanConfigureScheduler(false);
            }
        }
    }, [isOpen, user, initialRole]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const baseData = {
                name,
                email,
                phone: phone || undefined
            };

            if (isEditMode) {
                // UPDATE
                let response;
                const id = user.userId || user.id || user.technicianId || user.userAdminId || user.maintenanceAdminId;

                if (role === 'TECHNICIAN') {
                    const techData: any = { ...baseData, skills };
                    response = await adminService.updateTechnician(id, techData);
                } else if (role === 'MAINTENANCE_ADMIN') {
                    response = await adminService.updateMaintenanceAdmin(id, {
                        ...baseData,
                        managedEquipmentTypes,
                        maxAssignmentsPerDay,
                        canConfigureScheduler
                    });
                } else if (role === 'USER_ADMIN') {
                    response = await adminService.updateUserAdmin(id, baseData);
                } else {
                    response = await adminService.updateCitizen(id, baseData);
                }

                if (response) setSuccessMessage("User updated successfully!");

            } else {
                // CREATE
                let response;
                if (role === 'MAINTENANCE_ADMIN') {
                    response = await adminService.createMaintenanceAdmin({
                        ...baseData,
                        phone: baseData.phone || '',
                        password,
                        managedEquipmentTypes,
                        maxAssignmentsPerDay,
                        canConfigureScheduler
                    });
                } else {
                    // Generic create for user, tech, citizen (via signup endpoint usually, or specific if exists)
                    // adminService.createUser handles routing
                    response = await adminService.createUser({
                        ...baseData,
                        password,
                        role
                    });
                }
                if (response) setSuccessMessage("User created successfully!");
            }

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);

        } catch (err: any) {
            console.error("Error saving user:", err);
            setError(err.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex justify-center min-h-screen px-4 pt-20 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose} />

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-top sm:mt-24 sm:max-w-2xl sm:w-full">
                    <form onSubmit={handleSubmit} className="px-6 pt-5 pb-4 sm:p-6 space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {isEditMode ? 'Edit User' : 'Create New User'}
                            </h3>
                            <button type="button" onClick={onClose}><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
                        </div>

                        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
                        {successMessage && <div className="p-3 bg-green-100 text-green-700 rounded">{successMessage}</div>}

                        {!isEditMode && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 bg-white border"
                                >
                                    <option value="CITIZEN">Citizen</option>
                                    <option value="TECHNICIAN">Technician</option>
                                    <option value="USER_ADMIN">User Admin</option>
                                    <option value="MAINTENANCE_ADMIN">Maintenance Admin</option>
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
                            </div>
                            {!isEditMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
                                </div>
                            )}
                        </div>

                        {/* Role Specific Fields */}
                        {role === 'TECHNICIAN' && (
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-2 dark:text-white">Technician Details</h4>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skills</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {allSkills.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setSkills(prev => prev.includes(s) ? prev.filter(k => k !== s) : [...prev, s])}
                                                className={`px-2 py-1 text-xs rounded border ${skills.includes(s) ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {role === 'MAINTENANCE_ADMIN' && (
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium mb-2 dark:text-white">Maintenance Admin Details</h4>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Equipments</label>
                                    <div className="flex gap-2">
                                        {equipmentTypes.map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setManagedEquipmentTypes(prev => prev.includes(t) ? prev.filter(k => k !== t) : [...prev, t])}
                                                className={`px-2 py-1 text-xs rounded border ${managedEquipmentTypes.includes(t) ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300">Cancel</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50">
                                {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
