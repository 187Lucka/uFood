import './RestaurantDetails.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../../components/loading/loading';
import Map from '../../components/map/map';
import { getRestaurantById } from '../../api/restaurant';
import { createVisit } from '../../api/visits';
import { useVisits } from '../../context/VisitContext';
import { useLists } from '../../context/ListsContext';
import { AddRestaurantToListModal } from '../../components/addRestaurantToListModal/AddRestaurantToListModal';
import type { ApiRestaurant, OpeningHours } from '../../interface/restaurant';
import VisitModal from '../../components/visitModal/visitModal';

function RestaurantDetails() {
    const { restaurantId } = useParams<{ restaurantId: string }>();
    const navigate = useNavigate();
    const { hasVisited: contextHasVisited, addVisit, loadVisitsFromAPI } = useVisits();
    const { reloadLists } = useLists();
    
    const [restaurant, setRestaurant] = useState<ApiRestaurant | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isVisited, setIsVisited] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [showAddToListModal, setShowAddToListModal] = useState(false);

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const totalStars = 5;

        for (let i = 0; i < fullStars; i++) {
            stars.push('★');
        }

        if (hasHalfStar) {
            stars.push('★');
        }

        const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push('☆');
        }

        return stars.join('');
    };

    const formatOpeningHours = (openingHours: OpeningHours) => {
        const days = [
            { key: 'monday', name: 'Monday' },
            { key: 'tuesday', name: 'Tuesday' },
            { key: 'wednesday', name: 'Wednesday' },
            { key: 'thursday', name: 'Thursday' },
            { key: 'friday', name: 'Friday' },
            { key: 'saturday', name: 'Saturday' },
            { key: 'sunday', name: 'Sunday' }
        ];

        return days.map(day => {
            const hours = openingHours[day.key as keyof OpeningHours];
            return {
                day: day.name,
                hours: hours || 'Closed'
            };
        });
    };

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!restaurantId) {
                setError('Restaurant ID missing');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Token missing. Please log in again.');
                }

                const data = await getRestaurantById(restaurantId, token);
                setRestaurant(data);

            } catch (error) {
                console.error('Error fetching restaurant:', error);
                setError(error instanceof Error ? error.message : 'Error loading restaurant');

                if (error instanceof Error && error.message.includes('Token expir')) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurant();
    }, [restaurantId, navigate]);

    useEffect(() => {
        const checkIfVisited = async () => {
            try {
                if (!restaurant) return;

                const visitedInContext = contextHasVisited(restaurant.id);
                if (visitedInContext) {
                    setIsVisited(true);
                    return;
                }

                const token = localStorage.getItem('authToken');
                const userData = localStorage.getItem('userData');
                if (!token || !userData) {
                    setIsVisited(false);
                    return;
                }

                const user = JSON.parse(userData);
                await loadVisitsFromAPI(user.id, token);
                const visitedAfterLoad = contextHasVisited(restaurant.id);
                setIsVisited(visitedAfterLoad);
            } catch (error) {
                console.error('Erreur lors de la vérification de la visite:', error);
            }
        };

        if (restaurant) checkIfVisited();
    }, [restaurant, contextHasVisited, loadVisitsFromAPI]);

    if (isLoading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="restaurant-details">
                <div className="error-container">
                    <div className="error-card">
                        <h2>Error</h2>
                        <p>{error}</p>
                        <button onClick={() => navigate('/')} className="back-btn">
                            Back to restaurants
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="restaurant-details">
                <div className="error-container">
                    <div className="error-card">
                        <h2>Restaurant not found</h2>
                        <p>The restaurant you're looking for doesn't exist.</p>
                        <button onClick={() => navigate('/')} className="back-btn">
                            Back to restaurants
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleMarkAsVisited = () => {
        if (isVisited) {
            alert('You have already visited this restaurant!');
            return;
        }
        setShowVisitModal(true);
    };

    const handleSaveVisit = async (visitData: { date: string; rating: number; comment: string }) => {
        try {
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');

            if (!token || !userData) {
                alert('Vous devez être connecté pour enregistrer une visite.');
                navigate('/login');
                return;
            }

            const user = JSON.parse(userData);

            await createVisit(
                user.id,
                restaurant.id,
                visitData.date,
                visitData.rating,
                visitData.comment,
                token
            );

            addVisit({
                id: `${restaurant.id}-${Date.now()}`,
                restaurant_id: restaurant.id,
                date: visitData.date,
                rating: visitData.rating,
                comment: visitData.comment,
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    address: restaurant.address,
                    phone: restaurant.tel,
                    location: {
                        lat: restaurant.location.coordinates[1],
                        lng: restaurant.location.coordinates[0]
                    },
                    directions: `https://maps.google.com/?q=${restaurant.location.coordinates[1]},${restaurant.location.coordinates[0]}`,
                    hours: 'Hours available',
                    photos: restaurant.pictures,
                    genres: restaurant.genres,
                    priceRange: '$'.repeat(restaurant.price_range || 1),
                    rating: restaurant.rating,
                    priceRangeNumber: restaurant.price_range || 1
                }
            });

            setIsVisited(true);
            setShowVisitModal(false);
            alert('Visite enregistrée avec succès !');
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la visite:', error);
            alert('Erreur lors de l\'enregistrement de la visite.');
        }
    };

    const handleAddToList = () => {
        setShowAddToListModal(true);
    };

    const handleListModalClose = () => {
        setShowAddToListModal(false);
    };

    const handleListModalSuccess = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            if (token && userData) {
                const parsedUser = JSON.parse(userData);
                await reloadLists(parsedUser.id, token);
            }
        } catch (error) {
            console.error('Erreur lors du rechargement des listes:', error);
        }
        setShowAddToListModal(false);
    };

    const formattedHours = formatOpeningHours(restaurant.opening_hours);
    const priceRange = '$'.repeat(restaurant.price_range || 1);

    return (
        <div className="restaurant-details">
            <div className="restaurant-details-container">
                <button onClick={() => navigate('/')} className="back-btn">
                    ← Back to restaurants
                </button>

                <div className="unified-restaurant-card">
                    <div className="restaurant-hero">
                        {restaurant.pictures && restaurant.pictures.length > 0 && (
                            <div className="hero-image-container">
                                <img
                                    src={restaurant.pictures[0]}
                                    alt={restaurant.name}
                                    className="hero-image"
                                />
                                <div className="hero-overlay"></div>
                            </div>
                        )}
                        <div className="hero-content">
                            <h1 className="restaurant-name">{restaurant.name}</h1>
                            <div className="rating-section">
                                <div className="rating-display">
                                    <span className="stars">{renderStars(restaurant.rating)}</span>
                                    <span className="rating-number">{restaurant.rating.toFixed(1)}/5</span>
                                </div>
                                <div className="price-display">{priceRange}</div>
                                
                                <div className="action-buttons-container">
                                    <button
                                        className={`visit-btn ${isVisited ? 'visited' : ''}`}
                                        onClick={handleMarkAsVisited}
                                    >
                                        {isVisited ? '✓ Visited' : 'Visited?'}
                                    </button>
                                    
                                    <button
                                        className="add-to-list-btn"
                                        onClick={handleAddToList}
                                    >
                                        <span className="btn-icon">📋</span>
                                        Ajouter à une liste
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="restaurant-content">
                        <div className="info-section">
                            <h2 className="section-title">📋 Information</h2>

                            <div className="info-grid">
                                <div className="info-card">
                                    <div className="info-header">
                                        <h3>📍 Address</h3>
                                    </div>
                                    <p className="info-text">{restaurant.address}</p>
                                    <button
                                        onClick={() => window.open(
                                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`,
                                            '_blank'
                                        )}
                                        className="action-btn"
                                    >
                                        🗺️ View on Google Maps
                                    </button>
                                </div>

                                <div className="info-card">
                                    <div className="info-header">
                                        <h3>📞 Phone Number</h3>
                                    </div>
                                    <p className="info-text">{restaurant.tel}</p>
                                    <a href={`tel:${restaurant.tel}`} className="action-btn phone-btn">
                                        📞 Call
                                    </a>
                                </div>

                                <div className="info-card">
                                    <div className="info-header">
                                        <h3>🍽️ Cuisine Genres</h3>
                                    </div>
                                    <div className="genres-container">
                                        {restaurant.genres.map((genre, index) => (
                                            <span key={index} className="genre-tag">{genre}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-header">
                                        <h3>🌐 GPS Coordinates</h3>
                                    </div>
                                    <div className="coordinates">
                                        <p>Latitude: {restaurant.location.coordinates[1]}</p>
                                        <p>Longitude: {restaurant.location.coordinates[0]}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Map restaurant={restaurant} />

                        <div className="hours-section">
                            <h2 className="section-title">🕐 Opening Hours</h2>
                            <div className="hours-card">
                                <div className="hours-grid">
                                    {formattedHours.map((dayInfo, index) => (
                                        <div key={index} className="hours-item">
                                            <span className="day-name">{dayInfo.day}</span>
                                            <span className={`hours-time ${dayInfo.hours === 'Closed' ? 'closed' : 'open'}`}>
                                                {dayInfo.hours}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {restaurant.pictures && restaurant.pictures.length > 1 && (
                            <div className="photos-section">
                                <h2 className="section-title">📷 Gallery</h2>
                                <div className="photo-gallery">
                                    {restaurant.pictures.map((photo, index) => (
                                        <div key={index} className="photo-item">
                                            <img
                                                src={photo}
                                                alt={`${restaurant.name} ${index + 1}`}
                                                className="gallery-photo"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showVisitModal && (
                <VisitModal
                    restaurant={{ id: restaurant.id, name: restaurant.name }}
                    onClose={() => setShowVisitModal(false)}
                    onSave={handleSaveVisit}
                />
            )}

            {showAddToListModal && restaurant && (
                <AddRestaurantToListModal
                    restaurantId={restaurant.id}
                    restaurantName={restaurant.name}
                    onClose={handleListModalClose}
                    onSuccess={handleListModalSuccess}
                />
            )}
        </div>
    );
}

export default RestaurantDetails;