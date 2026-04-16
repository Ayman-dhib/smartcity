import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { interventionService } from '../../services/api/interventionService';
import { equipmentService } from '../../services/api/equipmentService';
import { Intervention, Equipment, InterventionStatus } from '../../types/api.types';
import AssignTechnicianModal from '../../components/maintenance/AssignTechnicianModal';
import InterventionModal from '../../components/maintenance/InterventionModal';
import EquipmentModal from '../../components/maintenance/EquipmentModal';
import {
    WrenchScrewdriverIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

// Simple Tabs Component
const Tabs = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
            onClick={() => onTabChange('interventions')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'interventions'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
        >
            Interventions
        </button>
        <button
            onClick={() => onTabChange('equipment')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'equipment'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
        >
            Equipment
        </button>
    </div>
);

export default function MaintenanceAdminDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('interventions');

    // Data State
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showInterventionModal, setShowInterventionModal] = useState(false);
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);

    useEffect(() => {
        if (user?.role !== 'MAINTENANCE_ADMIN') {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, navigate, activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'interventions') {
                const data = await interventionService.getMaintenanceInterventions();
                setInterventions(data);
            } else {
                const data = await equipmentService.getAllEquipment();
                setEquipments(data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteIntervention = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await interventionService.deleteIntervention(id);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete');
        }
    };

    const handleDeleteEquipment = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await equipmentService.deleteEquipment(id);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete');
        }
    };

    const openAssignModal = (intervention: Intervention) => {
        setSelectedIntervention(intervention);
        setShowAssignModal(true);
    };

    const openInterventionModal = (intervention: Intervention | null = null) => {
        setSelectedIntervention(intervention);
        setShowInterventionModal(true);
    };

    const openEquipmentModal = (eq: Equipment | null = null) => {
        setSelectedEquipment(eq);
        setShowEquipmentModal(true);
    };

    if (loading && !interventions.length && !equipments.length) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {user?.name}</p>
                </div>
            </div>

            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

            {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-6">{error}</div>}

            {activeTab === 'interventions' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
                            {/* Report Intervention button removed as per requirements */}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Title</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Technician</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interventions.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-4 text-center">No interventions found</td></tr>
                                ) : (
                                    interventions.map((intervention) => (
                                        <tr key={intervention.interventionId} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {intervention.title}
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{intervention.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${intervention.status === InterventionStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                                                    intervention.status === InterventionStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {intervention.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{intervention.interventionType}</td>
                                            <td className="px-6 py-4">
                                                {intervention.assignedTechnicianId ? (
                                                    <span className="text-green-600 font-medium">Assigned</span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openInterventionModal(intervention)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => openAssignModal(intervention)}
                                                        className="text-brand-600 hover:text-brand-900"
                                                        title="Assign Technician"
                                                    >
                                                        <WrenchScrewdriverIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteIntervention(intervention.interventionId)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={() => openEquipmentModal(null)}
                            className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-brand-600"
                        >
                            <PlusIcon className="h-5 w-5" /> Add Equipment
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Location</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipments.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-4 text-center">No equipment found</td></tr>
                                ) : (
                                    equipments.map((eq) => (
                                        <tr key={eq.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{eq.name}</td>
                                            <td className="px-6 py-4">{eq.type}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${eq.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' // Assuming Status enum matches
                                                    }`}>
                                                    {eq.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono">
                                                {eq.location?.coordinates?.join(', ') || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEquipmentModal(eq)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEquipment(eq.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedIntervention && (
                <AssignTechnicianModal
                    isOpen={showAssignModal}
                    onClose={() => setShowAssignModal(false)}
                    intervention={selectedIntervention}
                    onAssigned={fetchData}
                />
            )}

            <InterventionModal
                isOpen={showInterventionModal}
                onClose={() => setShowInterventionModal(false)}
                intervention={selectedIntervention}
                onSuccess={fetchData}
                citizenId={user?.userId}
            />

            <EquipmentModal
                isOpen={showEquipmentModal}
                onClose={() => setShowEquipmentModal(false)}
                equipment={selectedEquipment}
                onSuccess={fetchData}
            />
        </div>
    );
}
