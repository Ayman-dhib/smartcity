import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { technicianService } from '../../services/api/technicianService';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Skeleton from '../common/Skeleton';

// Fix Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface InterventionDetails {
    interventionId: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    interventionType: string;
    createdDate: string;
    location?: {
        coordinates: [number, number]; // [lng, lat]
    };
    equipment?: {
        name: string;
        type: string;
        status: string;
        location?: {
            coordinates: [number, number];
        };
    };
}

const InterventionDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [intervention, setIntervention] = useState<InterventionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchInterventionDetails(id);

            // Poll every 30 seconds
            const intervalId = setInterval(() => fetchInterventionDetails(id, true), 30000);
            return () => clearInterval(intervalId);
        }
    }, [id]);

    const fetchInterventionDetails = async (interventionId: string, isPolling = false) => {
        try {
            // We can reuse getMyInterventions and filter, or fetch specific if endpoint exists.
            // Since we don't have a specific GET /api/technicians/interventions/{id} yet, 
            // we'll fetch all and find (or rely on the list view data if passed via state, but fetch is safer).
            // Ideally, we should add GET /api/technicians/interventions/{id} to controller.
            // For now, let's use the list endpoint and filter client-side as a fallback, 
            // OR assume the backend allows GET /api/technicians/interventions/{id} (which I should add).

            // WAIT: The backend controller I created ONLY has getMyInterventions (list).
            // I should update the backend to include getInterventionById for technicians.
            // BUT, for now, I will fetch all and filter to avoid context switching too much, 
            // unless the list is huge. Given constraints, I'll fetch all.

            const allInterventions = await technicianService.getMyInterventions();
            const found = allInterventions.find((i: any) => i.interventionId === interventionId);

            if (found) {
                setIntervention(found);
            } else if (!isPolling) {
                toast.error('Intervention not found or access denied');
                navigate('/technician/interventions');
            }
        } catch (error) {
            console.error('Failed to fetch details', error);
            if (!isPolling) toast.error('Failed to load intervention details');
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!intervention || !id) return;

        setUpdating(true);
        try {
            const updated = await technicianService.updateInterventionStatus(id, newStatus);
            setIntervention(updated);
            toast.success(`Status updated to ${newStatus}`);
        } catch (error: any) {
            console.error('Failed to update status', error);
            toast.error(error.response?.data || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Skeleton className="h-6 w-32 mb-6" />
                <div className="bg-white dark:bg-boxdark rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <div className="flex items-center space-x-3">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Skeleton className="h-10 w-32 rounded" />
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                            <div>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                            <div>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-24 w-full rounded-md" />
                            </div>
                        </div>
                        <div className="h-80 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <Skeleton className="h-full w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!intervention) return <div className="p-6 text-center text-red-500">Intervention not found</div>;

    const isPending = intervention.status === 'PENDING';
    const isInProgress = intervention.status === 'IN_PROGRESS';
    const isCompleted = intervention.status === 'COMPLETED';

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => navigate('/technician/interventions')}
                className="mb-6 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
            >
                ← Back to Dashboard
            </button>

            <div className="bg-white dark:bg-boxdark rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{intervention.title}</h1>
                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                ${isPending ? 'bg-yellow-100 text-yellow-800' :
                                    isInProgress ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'}`}>
                                {intervention.status}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                {new Date(intervention.createdDate).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                        {isPending && (
                            <button
                                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                                disabled={updating}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {updating ? 'Updating...' : 'Start Work'}
                            </button>
                        )}
                        {isInProgress && (
                            <button
                                onClick={() => handleStatusUpdate('COMPLETED')}
                                disabled={updating}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {updating ? 'Updating...' : 'Mark Completed'}
                            </button>
                        )}
                        {isCompleted && (
                            <span className="text-green-600 font-semibold flex items-center">
                                ✓ Completed
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Details */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</h3>
                            <p className="mt-1 text-gray-900 dark:text-gray-200">{intervention.description}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</h3>
                            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs text-gray-500 dark:text-gray-400">Type</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white">{intervention.interventionType}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500 dark:text-gray-400">Priority</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-white">{intervention.priority}</dd>
                                </div>
                            </dl>
                        </div>

                        {intervention.equipment && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Equipment</h3>
                                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    <p className="font-semibold text-gray-900 dark:text-white">{intervention.equipment.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{intervention.equipment.type}</p>
                                    <p className="text-xs text-gray-500 mt-1">Status: {intervention.equipment.status}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div className="h-80 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        {(intervention.location || intervention.equipment?.location) ? (
                            <MapContainer
                                center={[
                                    (intervention.location?.coordinates[1] || intervention.equipment?.location?.coordinates[1])!,
                                    (intervention.location?.coordinates[0] || intervention.equipment?.location?.coordinates[0])!
                                ]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Marker position={[
                                    (intervention.location?.coordinates[1] || intervention.equipment?.location?.coordinates[1])!,
                                    (intervention.location?.coordinates[0] || intervention.equipment?.location?.coordinates[0])!
                                ]}>
                                    <Popup>
                                        {intervention.title}
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                No location data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterventionDetails;
