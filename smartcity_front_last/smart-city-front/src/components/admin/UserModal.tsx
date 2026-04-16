import { useState, useEffect } from 'react';
import { adminService } from '../../services/api/adminService';
import { UserRole, Skill, EquipmentType } from '../../types/api.types';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: any | null;
    onSuccess: () => void;
}

export default function UserModal({
    isOpen,
    onClose,
    user,
    onSuccess
}: UserModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        photoUrl: '',
        password: '',
        role: 'CITIZEN' as UserRole,
        skills: [] as Skill[],
        department: '',
        managedEquipmentTypes: [] as EquipmentType[],
        maxAssignmentsPerDay: 5,
        canConfigureScheduler: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                photoUrl: user.photoUrl || '',
                password: '',
                role: user.role || 'CITIZEN',
                skills: user.skills || [],
                department: user.department || '',
                managedEquipmentTypes: user.managedEquipmentTypes || [],
                maxAssignmentsPerDay: user.maxAssignmentsPerDay || 5,
                canConfigureScheduler: user.canConfigureScheduler || false
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                photoUrl: '',
                password: '',
                role: 'CITIZEN' as UserRole,
                skills: [],
                department: '',
                managedEquipmentTypes: [],
                maxAssignmentsPerDay: 5,
                canConfigureScheduler: false
            });
        }
        setError(null);
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const baseData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined
            };

            if (user) {
                // UPDATE mode
                const id = user.userId || user.id || user.technicianId || user.userAdminId || user.maintenanceAdminId;

                if (formData.role === 'TECHNICIAN') {
                    await adminService.updateTechnician(id, { ...baseData, skills: formData.skills });
                } else if (formData.role === 'MAINTENANCE_ADMIN') {
                    await adminService.updateMaintenanceAdmin(id, {
                        ...baseData,
                        department: formData.department,
                        maxAssignmentsPerDay: formData.maxAssignmentsPerDay,
                        canConfigureScheduler: formData.canConfigureScheduler
                    });
                } else if (formData.role === 'USER_ADMIN') {
                    await adminService.updateUserAdmin(id, { ...baseData, department: formData.department });
                } else {
                    await adminService.updateCitizen(id, baseData);
                }
            } else {
                // CREATE mode
                if (formData.role === 'MAINTENANCE_ADMIN') {
                    await adminService.createMaintenanceAdmin({
                        ...baseData,
                        phone: baseData.phone || '',
                        password: formData.password,
                        department: formData.department,
                        managedEquipmentTypes: formData.managedEquipmentTypes,
                        maxAssignmentsPerDay: formData.maxAssignmentsPerDay,
                        canConfigureScheduler: formData.canConfigureScheduler
                    });
                } else if (formData.role === 'USER_ADMIN') {
                    await adminService.createUserAdmin({
                        ...baseData,
                        phone: baseData.phone || '',
                        password: formData.password,
                        department: formData.department
                    });
                } else {
                    await adminService.createUser({
                        ...baseData,
                        password: formData.password,
                        role: formData.role
                    });
                }
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleSkill = (skill: Skill) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {user ? 'Edit User' : 'Add New User'}
                </h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!user && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="CITIZEN">Citizen</option>
                                <option value="TECHNICIAN">Technician</option>
                                <option value="USER_ADMIN">User Admin</option>
                                <option value="MAINTENANCE_ADMIN">Maintenance Admin</option>
                            </select>
                        </div>
                    )}

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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {!user && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    )}

                    {formData.role === 'TECHNICIAN' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</label>
                            <div className="flex flex-wrap gap-2">
                                {[Skill.ELECTRICAL, Skill.PLUMBING, Skill.ROAD_WORK, Skill.GENERAL, Skill.EMERGENCY, Skill.HEIGHTS, Skill.CONSTRUCTION, Skill.NETWORK, Skill.WASTE_MANAGEMENT, Skill.TRAFFIC_CONTROL].map(skill => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => toggleSkill(skill)}
                                        className={`px-3 py-1 text-sm rounded ${formData.skills.includes(skill) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                    >
                                        {skill.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.role === 'USER_ADMIN' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                            <input
                                type="text"
                                required
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="e.g. IT, Operations"
                            />
                        </div>
                    )}

                    {formData.role === 'MAINTENANCE_ADMIN' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                            <input
                                type="text"
                                required
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="e.g. Infrastructure Department"
                            />
                        </div>
                    )}

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
            </div >
        </div >
    );
}
