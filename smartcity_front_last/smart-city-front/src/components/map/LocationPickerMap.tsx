import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import L from 'leaflet';

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

interface LocationPickerMapProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ position, setPosition, onLocationSelect }: any) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        if (position) {
            // Optional: Fly to the new position when set externally or clicked?
            // Usually valid to fly to it if it was set initially.
            // map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position} />
    );
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function LocationPickerMap({ initialLat, initialLng, onLocationSelect }: LocationPickerMapProps) {
    // Default to Tunis if no initial location
    const defaultCenter: [number, number] = [36.8065, 10.1815];

    const [position, setPosition] = useState<L.LatLng | null>(null);

    useEffect(() => {
        if (typeof initialLat === 'number' && typeof initialLng === 'number') {
            setPosition(new L.LatLng(initialLat, initialLng));
        }
    }, [initialLat, initialLng]);

    const center: [number, number] = position ? [position.lat, position.lng] : defaultCenter;

    return (
        <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm relative z-0">
             <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    position={position}
                    setPosition={setPosition}
                    onLocationSelect={onLocationSelect}
                />
                {!position && <MapUpdater center={defaultCenter} />}
                {position && <MapUpdater center={[position.lat, position.lng]} />}
            </MapContainer>
            <div className="absolute top-2 right-2 bg-white/90 p-2 rounded shadow text-xs text-gray-600 z-[400] pointer-events-none">
                Click map to set location
            </div>
        </div>
    );
}
