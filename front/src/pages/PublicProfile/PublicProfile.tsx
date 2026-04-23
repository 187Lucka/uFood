import './PublicProfile.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// ✅ MODIFICATION : Supprimer isFollowing de l'import car on va utiliser le contexte
import { getUserById, followUser as apiFollowUser, unfollowUser as apiUnfollowUser } from '../../api/users';
import { getUserVisits } from '../../api/visits';
import { getRestaurantById } from '../../api/restaurant';
import type { User } from '../../api/users';
import type { Visit } from '../../api/visits';
import type { VisitRecord } from '../../context/VisitContext';
import { useUser } from '../../context/UserContext';
import Loading from '../../components/loading/loading';
import VisitModal from '../../components/visitModal/visitModal';

function PublicProfile() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { followUser, unfollowUser, isFollowingUser } = useUser();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [visits, setVisits] = useState<VisitRecord[]>([]);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isLoadingVisits, setIsLoadingVisits] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [error, setError] = useState<string>('');

    const renderStars = (rating: number) => {
        const normalizedRating = Math.min(Math.max(rating || 0, 0), 5);
        const stars = [];
        const fullStars = Math.floor(normalizedRating);
        for (let i = 0; i < fullStars; i++) {
            stars.push('★');
        }
        return stars.join('');
    };

    useEffect(() => {
        const loadUserProfile = async () => {
            if (!userId) return;

            try {
                setIsLoadingProfile(true);
                const token = localStorage.getItem('authToken');
                const currentUserData = localStorage.getItem('userData');

                if (!token || !currentUserData) {
                    navigate('/login');
                    return;
                }

                const currentUser = JSON.parse(currentUserData);

                if (currentUser.id === userId) {
                    navigate('/profil');
                    return;
                }

                const user = await getUserById(userId, token);
                setProfileUser(user);
                await loadUserVisits(userId, token);

            } catch (error) {
                console.error('Erreur lors du chargement du profil:', error);
                setError('Unable to load user profile');
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadUserProfile();
    }, [userId, navigate]);

    const loadUserVisits = async (targetUserId: string, token: string) => {
        try {
            setIsLoadingVisits(true);
            console.log('🔥 Chargement des visites de l\'utilisateur:', targetUserId);
            
            const visitsData = await getUserVisits(targetUserId, token);
            console.log('📊 Visites récupérées:', visitsData);

            const visitsWithRestaurants = await Promise.all(
                visitsData.map(async (visit: Visit) => {
                    try {
                        const restaurant = await getRestaurantById(visit.restaurant_id, token);
                        return {
                            ...visit,
                            restaurant: {
                                id: restaurant.id,
                                name: restaurant.name,
                                address: restaurant.address,
                                phone: restaurant.tel,
                                location: {
                                    lat: restaurant.location?.coordinates?.[1] || 0,
                                    lng: restaurant.location?.coordinates?.[0] || 0
                                },
                                directions: `https://maps.google.com/?q=${restaurant.location?.coordinates?.[1]},${restaurant.location?.coordinates?.[0]}`,
                                hours: 'Hours available',
                                photos: restaurant.pictures || [],
                                genres: restaurant.genres || [],
                                priceRange: '$'.repeat(restaurant.price_range || 1),
                                rating: restaurant.rating,
                                priceRangeNumber: restaurant.price_range || 1
                            }
                        };
                    } catch (error) {
                        console.error(`Erreur lors du chargement du restaurant ${visit.restaurant_id}:`, error);
                        return null;
                    }
                })
            );

            const validVisits = visitsWithRestaurants.filter(v => v !== null) as VisitRecord[];
            setVisits(validVisits);
            console.log('✅ Visites avec restaurants chargées:', validVisits);

        } catch (error) {
            console.error('Erreur lors du chargement des visites:', error);
        } finally {
            setIsLoadingVisits(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!userId) return;

        try {
            setIsFollowLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const currentlyFollowing = isFollowingUser(userId);

            if (currentlyFollowing) {
                console.log('➖ Unfollowing user:', userId);
                await unfollowUser(userId, token);
                
                setProfileUser(prev => {
                    if (!prev) return prev;
                    const currentUserId = JSON.parse(localStorage.getItem('userData')!).id;
                    return {
                        ...prev,
                        followers: prev.followers?.filter(f => f.id !== currentUserId) || []
                    };
                });
            } else {
                console.log('➕ Following user:', userId);
                await followUser(userId, token);
                
                setProfileUser(prev => {
                    if (!prev) return prev;
                    const currentUserData = JSON.parse(localStorage.getItem('userData')!);
                    return {
                        ...prev,
                        followers: [
                            ...(prev.followers || []),
                            {
                                id: currentUserData.id,
                                name: currentUserData.name,
                                email: currentUserData.email
                            }
                        ]
                    };
                });
            }

            console.log('✅ Follow status updated successfully');
        } catch (error) {
            console.error('❌ Error toggling follow:', error);
            alert('Unable to perform this action. Please try again.');
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleVisitClick = (visit: VisitRecord) => {
        setSelectedVisit(visit);
        setShowVisitModal(true);
    };

    const handleViewRestaurantDetails = () => {
        if (selectedVisit) {
            navigate(`/restaurant/${selectedVisit.restaurant_id}`);
        }
    };

    if (isLoadingProfile) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="public-profile-container">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="public-profile-container">
                <div className="error-message">User not found</div>
            </div>
        );
    }

    const isFollowing = userId ? isFollowingUser(userId) : false;

    return (
        <div className="public-profile-container">
            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-info">
                        <div className="profile-avatar">
                            {profileUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-details">
                            <h1>{profileUser.name}</h1>
                            <p className="profile-email">{profileUser.email}</p>
                        </div>

                        <div className="follow-section">
                            <button 
                                className={`follow-btn ${isFollowing ? 'following' : ''}`}
                                onClick={handleFollowToggle}
                                disabled={isFollowLoading}
                            >
                                {isFollowLoading ? 'Loading...' : isFollowing ? (
                                    <>
                                        <span>✓</span> Following
                                    </>
                                ) : (
                                    <>
                                        <span>+</span> Follow
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-label">Rating</span>
                                <span className="stat-value rating">{renderStars(profileUser.rating || 1)}</span>
                            </div>
                            <div 
                                className="stat-item clickable" 
                                onClick={() => setShowFollowersModal(true)}
                            >
                                <span className="stat-label">Followers</span>
                                <span className="stat-value">{profileUser.followers?.length || 0}</span>
                            </div>
                            <div 
                                className="stat-item clickable"
                                onClick={() => setShowFollowingModal(true)}
                            >
                                <span className="stat-label">Following</span>
                                <span className="stat-value">{profileUser.following?.length || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Visits</span>
                                <span className="stat-value">{visits.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="visits-section">
                        <h3>Recent Visits</h3>
                        {isLoadingVisits ? (
                            <div className="loading-visits">Loading visits...</div>
                        ) : visits.length === 0 ? (
                            <div className="no-visits">
                                <p>No visits yet</p>
                            </div>
                        ) : (
                            <div className="visits-list">
                                {visits.map((visit) => (
                                    <div
                                        key={visit.id}
                                        className="visit-item"
                                        onClick={() => handleVisitClick(visit)}
                                    >
                                        <div className="visit-image">
                                            <img 
                                                src={visit.restaurant?.photos?.[0] || 'https://via.placeholder.com/150'} 
                                                alt={visit.restaurant?.name}
                                            />
                                        </div>
                                        <div className="visit-info">
                                            <h4>{visit.restaurant?.name}</h4>
                                            <p className="visit-address">{visit.restaurant?.address}</p>
                                            <div className="visit-rating">
                                                <span className="visit-stars">{'★'.repeat(Math.floor(visit.rating))}</span>
                                                <span className="visit-rating-number">{visit.rating}/5</span>
                                            </div>
                                        </div>
                                        <div className="visit-arrow">→</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showVisitModal && selectedVisit && (
                <VisitModal
                    restaurant={{ id: selectedVisit.restaurant_id, name: selectedVisit.restaurant?.name || 'Restaurant' }}
                    onClose={() => setShowVisitModal(false)}
                    onSave={async () => {}}
                    readOnly={true}
                    showDetailsButton={true}
                    onViewDetails={handleViewRestaurantDetails}
                    defaultDate={selectedVisit.date}
                    defaultRating={selectedVisit.rating}
                    defaultComment={selectedVisit.comment}
                />
            )}

            {showFollowersModal && (
                <div className="followers-modal-overlay" onClick={() => setShowFollowersModal(false)}>
                    <div className="followers-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="followers-modal-header">
                            <h2>Followers</h2>
                            <button onClick={() => setShowFollowersModal(false)} className="close-btn">✕</button>
                        </div>
                        <div className="followers-modal-body">
                            {Array.isArray(profileUser.followers) && profileUser.followers.length > 0 ? (
                                <ul className="followers-list">
                                    {profileUser.followers.map((follower: any) => {
                                        const followerId = follower.id || follower._id;
                                        return (
                                            <li 
                                                key={followerId} 
                                                className="follower-item clickable-user"
                                                onClick={() => {
                                                    if (followerId) {
                                                        navigate(`/user/${followerId}`);
                                                        setShowFollowersModal(false);
                                                    }
                                                }}
                                            >
                                                {follower.name || follower.email || 'User'}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="no-followers">No followers yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showFollowingModal && (
                <div className="followers-modal-overlay" onClick={() => setShowFollowingModal(false)}>
                    <div className="followers-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="followers-modal-header">
                            <h2>Following</h2>
                            <button onClick={() => setShowFollowingModal(false)} className="close-btn">✕</button>
                        </div>
                        <div className="followers-modal-body">
                            {Array.isArray(profileUser.following) && profileUser.following.length > 0 ? (
                                <ul className="followers-list">
                                    {profileUser.following.map((following: any) => {
                                        const followingId = following.id || following._id;
                                        return (
                                            <li 
                                                key={followingId} 
                                                className="follower-item clickable-user"
                                                onClick={() => {
                                                    if (followingId) {
                                                        navigate(`/user/${followingId}`);
                                                        setShowFollowingModal(false);
                                                    }
                                                }}
                                            >
                                                {following.name || following.email || 'User'}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="no-followers">Not following anyone yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PublicProfile;