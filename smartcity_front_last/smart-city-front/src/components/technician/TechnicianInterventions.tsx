import React, { useState, useEffect } from 'react';
import { technicianService } from '../../services/api/technicianService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

interface Intervention {
    interventionId: string;
    title: string;
    status: string;
    priority: string;
    createdDate: string;
    equipment?: {
        name: string;
    };
}

const TechnicianInterventions: React.FC = () => {
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchInterventions();
    }, []);

    const fetchInterventions = async () => {
        try {
            const data = await technicianService.getMyInterventions();
            setInterventions(data);
        } catch (error) {
            console.error('Failed to fetch interventions', error);
            toast.error('Failed to load interventions');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toUpperCase()) {
            case 'CRITICAL': return 'text-red-600 font-bold';
            case 'HIGH': return 'text-orange-600 font-semibold';
            case 'MEDIUM': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading interventions...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Interventions</h2>

            {interventions.length === 0 ? (
                <div className="bg-white dark:bg-boxdark rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No interventions assigned to you yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {interventions.map((intervention) => (
                        <div
                            key={intervention.interventionId}
                            onClick={() => navigate(`/technician/interventions/${intervention.interventionId}`)}
                            className="bg-white dark:bg-boxdark rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-transparent hover:border-primary"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        {intervention.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        Equipment: {intervention.equipment?.name || 'N/A'}
                                    </p>
                                    <div className="flex items-center space-x-4 text-sm">
                                        <span className={getPriorityColor(intervention.priority)}>
                                            {intervention.priority} Priority
                                        </span>
                                        <span className="text-gray-400">
                                            {new Date(intervention.createdDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(intervention.status)}`}>
                                    {intervention.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TechnicianInterventions;
