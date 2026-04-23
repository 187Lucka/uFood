import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface MapProps {
  restaurant: {
    name: string;
    location: {
      coordinates: number[];
    };
  };
}

const Map: React.FC<MapProps> = ({ restaurant }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.innerHTML = '';

    const [lng, lat] = restaurant.location.coordinates;

    let userLat = 48.8566;
    let userLng = 2.3522;

    const map = L.map(mapRef.current).setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const restaurantIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    const userIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    L.marker([lat, lng], { icon: restaurantIcon }).addTo(map).bindPopup(restaurant.name);

    let routingControl: any = null;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLat = position.coords.latitude;
          userLng = position.coords.longitude;

          L.marker([userLat, userLng], { icon: userIcon }).addTo(map).bindPopup('Vous êtes ici');

          // @ts-ignore
          routingControl = L.Routing.control({
            waypoints: [
              L.latLng(userLat, userLng),
              L.latLng(lat, lng)
            ],
            routeWhileDragging: false,
            draggableWaypoints: false,
            addWaypoints: false,
            show: false,
            createMarker: () => null
          }).addTo(map);
        },
        () => {
          console.warn('Géolocalisation non autorisée ou indisponible.');
        }
      );
    }

    return () => {
      map.remove();
      if (routingControl) {
        routingControl.remove();
      }
    };
  }, [restaurant]);

  return (
    <div>
      <h2 className="section-title">🗺️ Itinéraire</h2>
      <div ref={mapRef} style={{ height: '350px', width: '100%', borderRadius: '12px', marginBottom: '2rem' }} />
    </div>
  );
};

export default Map;