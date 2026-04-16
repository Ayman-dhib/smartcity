import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { mapService } from '../../services/api/mapService';
import { MapPointDTO } from '../../types/api.types';
import L from 'leaflet';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for different types
const equipmentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const interventionIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Map Controller Component for programmatic moves
function MapController({ center, zoom, bounds }: { center?: [number, number], zoom?: number, bounds?: L.LatLngBounds }) {
    const map = useMap();

    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (center) {
            map.flyTo(center, zoom || 13, {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, zoom, bounds, map]);

    return null;
}

export default function InteractiveMap() {
    const [mapPoints, setMapPoints] = useState<MapPointDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedPoint, setSelectedPoint] = useState<MapPointDTO | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');

    // Map control state
    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
    const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
    const [mapBounds, setMapBounds] = useState<L.LatLngBounds | undefined>(undefined);

    useEffect(() => {
        const fetchPoints = async () => {
            try {
                const data = await mapService.getAllMapPoints();
                // Filter out invalid points immediately
                const validPoints = data.filter(p => p && typeof p.latitude === 'number' && typeof p.longitude === 'number');
                setMapPoints(validPoints);

                // Fit bounds to all valid points on load
                if (validPoints.length > 0) {
                    const bounds = L.latLngBounds(validPoints.map(p => [p.latitude, p.longitude]));
                    setMapBounds(bounds);
                }
            } catch (error) {
                console.error('Failed to fetch map points:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPoints();
    }, []);

    const handleCreateRequest = (point: MapPointDTO) => {
        navigate('/report-issue', {
            state: {
                equipmentId: point.id,
                latitude: point.latitude,
                longitude: point.longitude,
                address: point.name
            }
        });
    };

    const handleSearchSelect = (point: MapPointDTO) => {
        setSelectedPoint(point);
        setMapCenter([point.latitude, point.longitude]);
        setMapZoom(16);
        setMapBounds(undefined); // Clear bounds to allow flying to specific point
    };

    const filteredPoints = mapPoints.filter(point => {
        // Double check validity (though we filtered on load)
        if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') return false;

        const name = point.name || '';
        const description = point.description || '';

        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || point.type === filterType || (point.metadata && point.metadata.equipmentType === filterType);
        const matchesStatus = filterStatus === 'ALL' || point.status === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    // Search suggestions
    const searchSuggestions = searchTerm.length > 1
        ? mapPoints.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
        : [];

    if (loading) {
        return (
            <div className="h-[600px] w-full rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                <span className="text-gray-400 font-medium">Loading Map Data...</span>
            </div>
        );
    }

    // Default center (Tunis, Tunisia)
    const defaultCenter: [number, number] = [36.8065, 10.1815];

    return (
        <div className="relative h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Top Bar: Search & Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center z-10 shadow-sm">
                <div className="flex-1 min-w-[250px] relative">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search equipment, interventions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Search Suggestions Dropdown */}
                    {searchTerm.length > 1 && searchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                            {searchSuggestions.map(point => (
                                <button
                                    key={point.id}
                                    onClick={() => {
                                        setSearchTerm(point.name);
                                        handleSearchSelect(point);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0 border-gray-100 dark:border-gray-700 transition-colors flex items-center gap-2"
                                >
                                    <span className={`w-2 h-2 rounded-full ${point.type === 'EQUIPMENT' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{point.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    <option value="ALL">All Types</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="INTERVENTION">Intervention</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BROKEN">Broken</option>
                </select>
            </div>

            <div className="flex-1 relative">
                <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />

                    <MarkerClusterGroup
                        chunkedLoading
                        showCoverageOnHover={false}
                        maxClusterRadius={50}
                    >
                        {filteredPoints.map((point) => {
                            // Determine icon based on status
                            // If status is NOT 'ACTIVE' (and implies intervention), use Red icon
                            // Or check metadata 'hasActiveIntervention'
                            const hasActiveIntervention = point.metadata?.hasActiveIntervention === 'true';
                            // Also consider status directly if backend sets it to IN_PROGRESS/PENDING
                            const isIntervention = hasActiveIntervention ||
                                point.status === 'PENDING' ||
                                point.status === 'IN_PROGRESS' ||
                                point.type === 'INTERVENTION'; // Fallback

                            return (
                                <Marker
                                    key={point.id}
                                    position={[point.latitude, point.longitude]}
                                    icon={isIntervention ? interventionIcon : equipmentIcon}
                                    eventHandlers={{
                                        click: () => {
                                            setSelectedPoint(point);
                                            setMapCenter([point.latitude, point.longitude]);
                                            setMapZoom(16);
                                            setMapBounds(undefined);
                                        },
                                    }}
                                />
                            );
                        })}
                    </MarkerClusterGroup>
                </MapContainer>

                {/* Side Panel / Drawer */}
                {selectedPoint && (
                    <div className="absolute top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-[1000] overflow-y-auto border-l border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">{selectedPoint.name}</h2>
                                <button
                                    onClick={() => setSelectedPoint(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${selectedPoint.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            selectedPoint.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                selectedPoint.status === 'ACTIVE' || selectedPoint.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                        {selectedPoint.status || 'UNKNOWN'}
                                    </span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{selectedPoint.type}</span>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-3 border border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</span>
                                        <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{selectedPoint.metadata?.equipmentType || selectedPoint.metadata?.interventionType || 'N/A'}</span>
                                    </div>

                                    {selectedPoint.metadata?.address && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Location</span>
                                            <span className="text-sm text-gray-800 dark:text-gray-200">{selectedPoint.metadata.address}</span>
                                        </div>
                                    )}

                                    {selectedPoint.metadata?.lastMaintenance && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Update</span>
                                            <span className="text-sm text-gray-800 dark:text-gray-200">{new Date(selectedPoint.metadata.lastMaintenance).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    {selectedPoint.description && (
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                                "{selectedPoint.description}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Active Intervention Details */}
                                {selectedPoint.metadata?.hasActiveIntervention === 'true' && (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl space-y-3 border border-red-100 dark:border-red-800">
                                        <h3 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Active Intervention
                                        </h3>

                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Title</span>
                                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{selectedPoint.metadata.interventionTitle}</span>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</span>
                                            <span className="text-sm font-bold text-red-600 dark:text-red-400">{selectedPoint.metadata.interventionStatus}</span>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Priority</span>
                                            <span className="text-sm text-gray-800 dark:text-gray-200">{selectedPoint.metadata.interventionPriority}</span>
                                        </div>

                                        {selectedPoint.metadata.interventionDescription && (
                                            <div className="pt-2 border-t border-red-200 dark:border-red-800/50">
                                                <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                                                    "{selectedPoint.metadata.interventionDescription}"
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => navigate(`/interventions/${selectedPoint.metadata?.interventionId}`)}
                                            className="w-full mt-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm"
                                        >
                                            View Full Details
                                        </button>
                                    </div>
                                )}

                                {/* Report Issue Button - Only if NO active intervention */}
                                {selectedPoint.type === 'EQUIPMENT' &&
                                    selectedPoint.metadata?.hasActiveIntervention !== 'true' &&
                                    user?.role === 'CITIZEN' && (
                                        <button
                                            onClick={() => handleCreateRequest(selectedPoint)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                        >
                                            <span>Report Issue</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
