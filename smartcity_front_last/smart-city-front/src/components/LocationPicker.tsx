import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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

interface LocationPickerProps {
    initialLocation?: { x: number; y: number } | null; // x=lng, y=lat (GeoJsonPoint format)
    onLocationSelect: (location: { x: number; y: number }) => void;
}

const LocationMarker = ({ position, setPosition, onSelect }: any) => {
    useMapEvents({
        click(e) {
            const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPosition(newPos);
            onSelect({ x: newPos.lng, y: newPos.lat }); // GeoJsonPoint is [lng, lat]
        },
    });

    return position ? <Marker position={position} /> : null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ initialLocation, onLocationSelect }) => {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (initialLocation) {
            setPosition({ lat: initialLocation.y, lng: initialLocation.x });
        }
    }, [initialLocation]);

    // Default center (e.g., Paris or user's location)
    const defaultCenter = position || { lat: 48.8566, lng: 2.3522 };

    return (
        <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300">
            <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker position={position} setPosition={setPosition} onSelect={onLocationSelect} />
            </MapContainer>
        </div>
    );
};

export default LocationPicker;
