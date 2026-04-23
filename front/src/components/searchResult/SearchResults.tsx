import './SearchResults.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { followUser, unfollowUser, isFollowing } from '../../api/users';
import type { User } from '../../api/users';
import type { Restaurant } from '../../interface/restaurant';

interface SearchResultsProps {
    users: User[];
    restaurants: Restaurant[];
    isLoading: boolean;
    onClose: () => void;
}

function SearchResults({ users, restaurants, isLoading, onClose }: SearchResultsProps) {
    const navigate = useNavigate();
    const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
    const [loadingFollow, setLoadingFollow] = useState<Record<string, boolean>>({});

    // Charger le statut de follow pour chaque utilisateur
    useEffect(() => {
        const checkFollowStatus = async () => {
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            
            if (!token || !userData) return;

            const currentUser = JSON.parse(userData);
            const statusPromises = users.map(async (user) => {
                const following = await isFollowing(currentUser.id, user.id, token);
                return { userId: user.id, following };
            });

            const results = await Promise.all(statusPromises);
            const statusMap: Record<string, boolean> = {};
            results.forEach(({ userId, following }) => {
                statusMap[userId] = following;
            });
            setFollowingStatus(statusMap);
        };

        if (users.length > 0) {
            checkFollowStatus();
        }
    }, [users]);

    const handleUserClick = (userId: string) => {
        navigate(`/user/${userId}`);
        onClose();
    };

    const handleRestaurantClick = (restaurantId: string) => {
        navigate(`/restaurant/${restaurantId}`);
        onClose();
    };

    const handleFollowToggle = async (e: React.MouseEvent, userId: string) => {
        e.stopPropagation(); // Empêcher la navigation vers le profil

        const token = localStorage.getItem('authToken');
        if (!token) return;

        setLoadingFollow(prev => ({ ...prev, [userId]: true }));

        try {
            const isCurrentlyFollowing = followingStatus[userId];
            
            if (isCurrentlyFollowing) {
                await unfollowUser(userId, token);
                setFollowingStatus(prev => ({ ...prev, [userId]: false }));
            } else {
                await followUser(userId, token);
                setFollowingStatus(prev => ({ ...prev, [userId]: true }));
            }
        } catch (error) {
            console.error('Erreur lors du follow/unfollow:', error);
        } finally {
            setLoadingFollow(prev => ({ ...prev, [userId]: false }));
        }
    };

    if (isLoading) {
        return (
            <div className="search-results-dropdown">
                <div className="search-results-loading">
                    <div className="spinner"></div>
                    <span>Searching...</span>
                </div>
            </div>
        );
    }

    const hasResults = users.length > 0 || restaurants.length > 0;

    if (!hasResults) {
        return (
            <div className="search-results-dropdown">
                <div className="no-results">
                    <p>No results found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="search-results-dropdown">
            {users.length > 0 && (
                <div className="results-section">
                    <h4 className="results-section-title">
                        <svg className="section-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Users
                    </h4>
                    <div className="results-list">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="result-item user-item"
                                onClick={() => handleUserClick(user.id)}
                            >
                                <div className="user-avatar">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-info">
                                    <div className="user-name">{user.name}</div>
                                    <div className="user-email">{user.email}</div>
                                </div>
                                <button
                                    className={`follow-btn-small ${followingStatus[user.id] ? 'following' : ''}`}
                                    onClick={(e) => handleFollowToggle(e, user.id)}
                                    disabled={loadingFollow[user.id]}
                                >
                                    {loadingFollow[user.id] ? (
                                        '...'
                                    ) : followingStatus[user.id] ? (
                                        '✓'
                                    ) : (
                                        '+'
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {restaurants.length > 0 && (
                <div className="results-section">
                    <h4 className="results-section-title">
                        <svg className="section-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
                        </svg>
                        Restaurants
                    </h4>
                    <div className="results-list">
                        {restaurants.slice(0, 5).map((restaurant) => (
                            <div
                                key={restaurant.id}
                                className="result-item restaurant-item"
                                onClick={() => handleRestaurantClick(restaurant.id)}
                            >
                                <div className="restaurant-image">
                                    <img src={restaurant.photos[0]} alt={restaurant.name} />
                                </div>
                                <div className="restaurant-info">
                                    <div className="restaurant-name">{restaurant.name}</div>
                                    <div className="restaurant-details">
                                        <span className="restaurant-genres">
                                            {restaurant.genres.slice(0, 2).join(', ')}
                                        </span>
                                        <span className="restaurant-price">{restaurant.priceRange}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchResults;