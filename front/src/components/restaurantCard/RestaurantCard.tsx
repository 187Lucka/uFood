import './RestaurantCard.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import VisitModal from '../visitModal/visitModal';
import { useVisits } from '../../context/VisitContext';
import { createVisit } from '../../api/visits';

interface RestaurantCardProps {
    restaurant: {
        id: string;
        name: string;
        address: string;
        phone: string;
        location: {
            lat: number;
            lng: number;
        };
        directions: string;
        hours: string;
        photos: string[];
        genres: string[];
        priceRange: string;
        rating: number;
        priceRangeNumber?: number;
    };
    onAddToFavorites?: (restaurantId: string) => void;
    isVisitedView?: boolean;
    onVisitClick?: () => void;
}

function RestaurantCard({ restaurant, onAddToFavorites, isVisitedView = false, onVisitClick }: RestaurantCardProps) {
    const navigate = useNavigate();
    const { hasVisited, addVisit, reloadVisits } = useVisits();
    const [isFavorite, setIsFavorite] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [isVisited, setIsVisited] = useState(false);

    // Vérifier si le restaurant est visité en utilisant UNIQUEMENT le Context
    const checkIfVisited = useCallback(() => {
        const visited = hasVisited(restaurant.id);
        console.log(`🔍 Restaurant ${restaurant.name} (${restaurant.id}) visité? ${visited}`);
        setIsVisited(visited);
    }, [restaurant.id, restaurant.name, hasVisited]);

    // Vérifier au montage et quand hasVisited change
    useEffect(() => {
        checkIfVisited();
    }, [checkIfVisited]);

    const handleCardClick = (e: React.MouseEvent) => {
        if (isVisitedView && !(e.target as HTMLElement).closest('button')) {
            onVisitClick?.();
            return;
        }
        
        if (!isVisitedView) {
            navigate(`/restaurant/${restaurant.id}`);
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const totalStars = 5;

        for (let i = 0; i < fullStars; i++) stars.push('★');
        if (hasHalfStar) stars.push('☆');
        const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) stars.push('☆');

        return stars.join('');
    };

    const handleAddressClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(restaurant.directions, '_blank');
    };

    const handlePhoneClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleAddToFavorites = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFavorite(true);
        if (onAddToFavorites) onAddToFavorites(restaurant.id);
    };

    const handleMarkAsVisited = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isVisitedView) {
            setShowVisitModal(true);
        }
    };

    const handleSaveVisit = async (visitData: { date: string; rating: number; comment: string }) => {
        console.log('🎬 handleSaveVisit appelée avec:', visitData);
        try {
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            
            console.log('📋 Token présent?', !!token, 'userData présent?', !!userData);
            
            if (!token || !userData) {
                throw new Error('Token ou données utilisateur manquants');
            }

            const user = JSON.parse(userData);
            
            console.log('💾 Création de la visite via API... Restaurant:', restaurant.id);
            
            // Créer la visite via l'API
            const createdVisit = await createVisit(user.id, {
                restaurant_id: restaurant.id,
                date: visitData.date,
                rating: visitData.rating,
                comment: visitData.comment,
            }, token);

            console.log('✅ Visite créée:', createdVisit);

            // Ajouter au context (optimistic update)
            console.log('➕ Ajout au context');
            addVisit({
                id: createdVisit.id,
                restaurant_id: restaurant.id,
                restaurant,
                date: visitData.date,
                rating: visitData.rating,
                comment: visitData.comment,
            });

            // IMPORTANT: Recharger les visites depuis l'API pour sync complète
            console.log('🔄 Rechargement des visites depuis l\'API...');
            await reloadVisits(user.id, token);
            console.log('✅ Rechargement terminé');

            // Re-vérifier immédiatement après le rechargement
            console.log('🔄 Re-vérification de la visite après rechargement...');
            checkIfVisited();
            console.log('✅ Vérification terminée');

            setShowVisitModal(false);
            console.log(`✅ Visite de ${restaurant.name} enregistrée avec succès!`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement de la visite:', error);
            alert('Erreur lors de l\'enregistrement de la visite. Veuillez réessayer.');
        }
    };

    return (
        <>
            <div 
                className={`restaurant-card ${isVisitedView ? 'visited-view' : ''}`} 
                onClick={handleCardClick}
                style={{ cursor: 'pointer' }}
            >
                <img src={restaurant.photos[0]} alt={restaurant.name} />
                <div className="restaurant-card-content">
                    <h2>{restaurant.name}</h2>

                    <div className="restaurant-info">
                        <div className="info-item">
                            <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            <span className="address" onClick={handleAddressClick}>{restaurant.address}</span>
                        </div>

                        <div className="info-item">
                            <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                            </svg>
                            <a href={`tel:${restaurant.phone}`} className="phone" onClick={handlePhoneClick}>{restaurant.phone}</a>
                        </div>

                        <div className="info-item">
                            <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <div className="genres">{restaurant.genres.join(" • ")}</div>
                        </div>

                        <div className="info-item">
                            <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                            <span className="hours">{restaurant.hours}</span>
                        </div>
                    </div>

                    <div className="restaurant-footer">
                        <div className="price-range">{restaurant.priceRange}</div>

                        <div className="rating">
                            <span className="rating-stars">{renderStars(restaurant.rating)}</span>
                            <span>{restaurant.rating}/5</span>
                        </div>

                        {!isVisitedView && (
                            <div className="action-buttons">
                                <button
                                    className={`visit-btn ${isVisited ? 'visited' : ''}`}
                                    onClick={handleMarkAsVisited}
                                    title={isVisited ? "Déjà visité" : "Marquer comme visité"}
                                >
                                    {isVisited ? '✓ Visited' : 'Visited?'}
                                </button>
                            </div>
                        )}
                        
                        {isVisitedView && (
                            <div className="action-buttons">
                                <button
                                    className="visit-btn visited disabled"
                                    disabled
                                    title="Déjà visité"
                                >
                                    ✓ Visited
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showVisitModal && !isVisitedView && (
                <VisitModal
                    restaurant={restaurant}
                    onClose={() => setShowVisitModal(false)}
                    onSave={handleSaveVisit}
                />
            )}
        </>
    );
}

export default RestaurantCard;