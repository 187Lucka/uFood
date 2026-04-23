import { useEffect, useRef, useState } from 'preact/hooks';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import type { Restaurant } from '../../interface/restaurant';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
    restaurants: Restaurant[];
    onRestaurantClick: (restaurantId: string) => void;
}

function MapView({ restaurants, onRestaurantClick }: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const userMarkerRef = useRef<L.Marker | null>(null);

    // Icône personnalisée pour les restaurants
    const restaurantIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Icône pour la position de l'utilisateur
    const userIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Obtenir la géolocalisation de l'utilisateur
    const getUserLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLocation: [number, number] = [latitude, longitude];
                    setUserLocation(newLocation);
                    setIsLocating(false);
                    console.log('📍 Position utilisateur:', latitude, longitude);

                    // Centrer la carte sur l'utilisateur
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView(newLocation, 13);
                    }
                },
                (error) => {
                    console.error('❌ Erreur géolocalisation:', error);
                    setIsLocating(false);
                    // Position par défaut : Québec, Canada
                    const defaultPos: [number, number] = [46.8139, -71.2080];
                    setUserLocation(defaultPos);
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView(defaultPos, 11);
                    }
                }
            );
        } else {
            console.error('❌ Géolocalisation non supportée');
            setIsLocating(false);
            const defaultPos: [number, number] = [46.8139, -71.2080];
            setUserLocation(defaultPos);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setView(defaultPos, 11);
            }
        }
    };

    // Initialiser la carte
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Centre par défaut (Québec)
        const defaultCenter: [number, number] = [46.8139, -71.2080];

        // Créer la carte
        const map = L.map(mapRef.current).setView(defaultCenter, 11);

        // Ajouter le layer OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Charger la position de l'utilisateur
        getUserLocation();

        // Cleanup
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Mettre à jour le marqueur de l'utilisateur
    useEffect(() => {
        if (!mapInstanceRef.current || !userLocation) return;

        // Supprimer l'ancien marqueur utilisateur
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }

        // Ajouter le nouveau marqueur utilisateur
        const marker = L.marker(userLocation, { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup('<div class="custom-popup"><strong>📍 You are here</strong></div>');

        userMarkerRef.current = marker;
    }, [userLocation]);

    // Mettre à jour les marqueurs des restaurants
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        // Supprimer les anciens marqueurs
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Ajouter les nouveaux marqueurs
        restaurants.forEach((restaurant) => {
            const position: [number, number] = [
                restaurant.location.lat,
                restaurant.location.lng
            ];

            // Vérifier que les coordonnées sont valides
            if (position[0] === 0 && position[1] === 0) return;

            const popupContent = `
                <div class="custom-popup">
                    <img 
                        src="${restaurant.photos[0]}" 
                        alt="${restaurant.name}"
                        class="popup-image"
                    />
                    <h4>${restaurant.name}</h4>
                    <p class="popup-address">${restaurant.address}</p>
                    <div class="popup-details">
                        <span class="popup-rating">⭐ ${restaurant.rating}</span>
                        <span class="popup-price">${restaurant.priceRange}</span>
                    </div>
                    <div class="popup-genres">
                        ${restaurant.genres.slice(0, 2).join(', ')}
                    </div>
                    <button 
                        class="popup-view-btn"
                        onclick="window.navigateToRestaurant('${restaurant.id}')"
                    >
                        View Details →
                    </button>
                </div>
            `;

            const marker = L.marker(position, { icon: restaurantIcon })
                .addTo(mapInstanceRef.current!)
                .bindPopup(popupContent);

            marker.on('click', () => {
                console.log('🍽️ Restaurant cliqué:', restaurant.id);
            });

            markersRef.current.push(marker);
        });

        // Fonction globale pour la navigation (accessible depuis le popup)
        (window as any).navigateToRestaurant = (restaurantId: string) => {
            onRestaurantClick(restaurantId);
        };
    }, [restaurants, onRestaurantClick]);

    return (
        <div className="map-view-container">
            <button 
                className="locate-me-btn"
                onClick={getUserLocation}
                disabled={isLocating}
            >
                {isLocating ? '📍 Locating...' : '📍 My Location'}
            </button>

            <div ref={mapRef} className="map-element" />

            <div className="map-info">
                <p>🗺️ {restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} shown on map</p>
            </div>
        </div>
    );
}

export default MapView;