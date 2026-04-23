import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './User.css';
import { useVisits } from '../../context/VisitContext';
import { useLists } from '../../context/ListsContext';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/toast/Toast';
import VisitModal from '../../components/visitModal/visitModal';
import { CustomList } from '../../components/customList/CustomList';
import { AddToListModal } from '../../components/addToListModal/AddToListModal';
import { createList } from '../../api/lists';
import { getRestaurantById } from '../../api/restaurant';

interface UserData {
    id: string;
    name: string;
    email: string;
    rating?: number;
    followers?: any[];
    following?: any[];
}

interface SelectedList {
    id: string;
    name: string;
}

interface EnrichedVisit {
    id: string;
    restaurant_id: string;
    date: string;
    rating: number;
    comment: string;
    createdAt?: string;
    restaurant?: any;
}

function User() {
    const navigate = useNavigate();
    const { visits, loadVisitsFromAPI } = useVisits();
    const { lists, loadUserLists, addList, reloadLists, removeList } = useLists();
    const { followers, following, loadUserData } = useUser();
    const { toasts, removeToast, success, error } = useToast();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [newListName, setNewListName] = useState('');
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
    const [selectedListForAdding, setSelectedListForAdding] = useState<SelectedList | null>(null);

    const [enrichedVisits, setEnrichedVisits] = useState<EnrichedVisit[]>([]);
    const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);

    const [selectedVisit, setSelectedVisit] = useState<EnrichedVisit | null>(null);
    const [showVisitDetailsModal, setShowVisitDetailsModal] = useState(false);

    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);

    const calculateAverageRating = () => {
        if (visits.length === 0) return 0;
        const sum = visits.reduce((acc, visit) => acc + (visit.rating || 0), 0);
        return sum / visits.length;
    };

    const averageRating = calculateAverageRating();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const storedUserData = localStorage.getItem('userData');

        if (!token || !storedUserData) {
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUserData);
            setUserData(parsedUser);
            loadVisitsFromAPI(parsedUser.id, token);
            loadUserLists(parsedUser.id, token);
            loadUserData(parsedUser.id, token);
        } catch (error) {
            console.error('Error:', error);
            navigate('/login');
        }
    }, [navigate, loadVisitsFromAPI, loadUserLists, loadUserData]);

    useEffect(() => {
        const enrichVisits = async () => {
            if (visits.length === 0) return;

            const token = localStorage.getItem('authToken');
            if (!token) return;

            setIsLoadingRestaurants(true);

            try {
                const enriched = await Promise.all(
                    visits.map(async (visit) => {
                        if (visit.restaurant) {
                            return visit;
                        }

                        try {
                            const restaurant = await getRestaurantById(visit.restaurant_id, token);
                            return {
                                ...visit,
                                restaurant: {
                                    name: restaurant.name,
                                    address: restaurant.address,
                                    photos: restaurant.pictures,
                                }
                            };
                        } catch (error) {
                            console.warn(`⚠️ Impossible de charger le restaurant ${visit.restaurant_id}`);
                            return visit;
                        }
                    })
                );

                setEnrichedVisits(enriched.reverse());
            } catch (error) {
                console.error('Error enriching visits:', error);
            } finally {
                setIsLoadingRestaurants(false);
            }
        };

        enrichVisits();
    }, [visits]);

    const handleCreateList = async () => {
        if (!newListName.trim()) {
            error('Please enter a list name');
            return;
        }

        const token = localStorage.getItem('authToken');
        const storedUserData = localStorage.getItem('userData');

        if (!token || !storedUserData) {
            error('You must be logged in');
            return;
        }

        try {
            setIsCreatingList(true);
            const parsedUser = JSON.parse(storedUserData);
            
            const createdList = await createList(newListName, parsedUser.id, token);
            addList(createdList);
            success(`List "${newListName}" created successfully!`);
            setNewListName('');
            
            // ✅ Ouvrir la modale pour ajouter des restaurants
            setSelectedListForAdding({ id: createdList.id, name: createdList.name });
            setShowAddRestaurantModal(true);
        } catch (err) {
            console.error('Error:', err);
            error('Error creating list');
        } finally {
            setIsCreatingList(false);
        }
    };

    const handleVisitClick = (visit: EnrichedVisit) => {
        setSelectedVisit(visit);
        setShowVisitDetailsModal(true);
    };

    const indexOfLastVisit = currentPage * itemsPerPage;
    const indexOfFirstVisit = indexOfLastVisit - itemsPerPage;
    const currentVisits = enrichedVisits.slice(indexOfFirstVisit, indexOfLastVisit);
    const totalPages = Math.ceil(enrichedVisits.length / itemsPerPage);

    const renderStars = (rating: number) => {
        const validRating = Math.min(Math.max(rating || 0, 0), 5);
        const fullStars = Math.floor(validRating);
        const emptyStars = 5 - fullStars;

        return (
            <>
                {Array.from({ length: fullStars }, (_, i) => (
                    <span key={`full-${i}`} className="star filled">★</span>
                ))}
                {Array.from({ length: emptyStars }, (_, i) => (
                    <span key={`empty-${i}`} className="star empty">☆</span>
                ))}
            </>
        );
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        navigate('/login');
    };

    if (!userData) {
        return <div>Loading...</div>;
    }

    const visitsWithRestaurant = currentVisits.filter(visit => visit.restaurant);

    return (
        <div className="user-page">
            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            <div className="user-container">
                <div className="user-content">
                    <div className="unified-user-card">
                        {/* User Info */}
                        <div className="user-info">
                            <h1 className="user-name">{userData.name}</h1>
                            <div className="user-details">
                                <div className="detail-item">
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">
                                        {typeof userData.email === 'string' ? userData.email : 'N/A'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Average Rating</span>
                                    <span className="detail-value rating">
                                        {renderStars(averageRating)}
                                    </span>
                                </div>
                                <div 
                                    className="detail-item clickable"
                                    onClick={() => setShowFollowersModal(true)}
                                >
                                    <span className="detail-label">Followers</span>
                                    <span className="detail-value">
                                        {followers.length}
                                    </span>
                                </div>
                                <div 
                                    className="detail-item clickable"
                                    onClick={() => setShowFollowingModal(true)}
                                >
                                    <span className="detail-label">Following</span>
                                    <span className="detail-value">
                                        {following.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* My Lists */}
                        <div className="lists-section">
                            <h3>My Lists</h3>
                            <div className="create-list-form">
                                <input
                                    type="text"
                                    placeholder="Enter new list name..."
                                    value={newListName}
                                    onChange={(e) => setNewListName((e.target as HTMLInputElement).value)}
                                    onKeyPress={(e: any) => e.key === 'Enter' && handleCreateList()}
                                    className="list-name-input"
                                />
                                <button
                                    onClick={handleCreateList}
                                    disabled={isCreatingList}
                                    className="create-list-btn"
                                >
                                    {isCreatingList ? 'Creating...' : 'Create'}
                                </button>
                            </div>

                            <div className="lists-container">
                                {lists.length === 0 ? (
                                    <p className="empty-lists-message">
                                        You don't have any lists yet. Create one to get started!
                                    </p>
                                ) : (
                                    lists.map((list) => (
                                        <CustomList
                                            key={list.id}
                                            listId={list.id}
                                            listName={list.name}
                                            restaurantIds={list.restaurants || []}
                                            userId={userData.id}
                                            token={localStorage.getItem('authToken') || ''}
                                            onDeleted={() => {
                                                console.log('🔵 onDeleted callback called in User.tsx');
                                                console.log('🔵 List ID to remove:', list.id);
                                                console.log('🔵 Current lists before removal:', lists.length);
                                                
                                                removeList(list.id);
                                                
                                                console.log('🔵 removeList() called');
                                                
                                                // Vérifier après un court délai
                                                setTimeout(() => {
                                                    console.log('🔵 Lists after removal (should be -1):', lists.length);
                                                }, 100);
                                            }}
                                            onUpdated={async () => {
                                                const token = localStorage.getItem('authToken');
                                                if (token && userData) {
                                                    await reloadLists(userData.id, token);
                                                }
                                            }}
                                            onShowToast={(message, type) => {
                                                if (type === 'success') success(message);
                                                else if (type === 'error') error(message);
                                            }}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Visited Restaurants */}
                        <div className="visited-restaurants-section">
                            <h3>My Visits</h3>
                            {isLoadingRestaurants ? (
                                <div className="loading-message">Loading restaurants...</div>
                            ) : visitsWithRestaurant.length === 0 ? (
                                <p className="no-visits-message">
                                    You haven't visited any restaurants yet.
                                </p>
                            ) : (
                                <>
                                    <div className="visited-list">
                                        {visitsWithRestaurant.map((visit) => (
                                            <div
                                                key={visit.id}
                                                className="visited-list-item"
                                                onClick={() => handleVisitClick(visit)}
                                            >
                                                {visit.restaurant.photos?.[0] && (
                                                    <img
                                                        src={visit.restaurant.photos[0]}
                                                        alt={visit.restaurant.name || 'Restaurant'}
                                                        className="visited-list-image"
                                                    />
                                                )}
                                                <div className="visited-list-info">
                                                    <h4 className="visited-list-name">
                                                        {visit.restaurant.name || 'Unknown Restaurant'}
                                                    </h4>
                                                    <p className="visited-list-address">
                                                        {visit.restaurant.address || 'No address'}
                                                    </p>
                                                </div>
                                                <div className="visited-list-rating">
                                                    <div className="stars">{renderStars(visit.rating)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="pagination">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="pagination-btn"
                                            >
                                                Previous
                                            </button>
                                            <span className="pagination-info">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="pagination-btn"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Add Restaurant */}
            {showAddRestaurantModal && selectedListForAdding && (
                <AddToListModal
                    listId={selectedListForAdding.id}
                    listName={selectedListForAdding.name}
                    token={localStorage.getItem('authToken') || ''}
                    onClose={() => setShowAddRestaurantModal(false)}
                    onSuccess={async () => {
                        const token = localStorage.getItem('authToken');
                        if (token && userData) {
                            await reloadLists(userData.id, token);
                        }
                        setShowAddRestaurantModal(false);
                    }}
                />
            )}

            {/* Modal Visit Details */}
            {showVisitDetailsModal && selectedVisit && (
                <VisitModal
                    restaurant={{
                        id: selectedVisit.restaurant_id,
                        name: selectedVisit.restaurant?.name || 'Restaurant'
                    }}
                    onClose={() => setShowVisitDetailsModal(false)}
                    onSave={async () => {}}
                    readOnly={true}
                    showDetailsButton={true}
                    onViewDetails={() => navigate(`/restaurant/${selectedVisit.restaurant_id}`)}
                    defaultDate={selectedVisit.date}
                    defaultRating={selectedVisit.rating}
                    defaultComment={selectedVisit.comment}
                />
            )}

            {/* Modal Followers */}
            {showFollowersModal && (
                <div className="followers-modal-overlay" onClick={() => setShowFollowersModal(false)}>
                    <div className="followers-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="followers-modal-header">
                            <h2>Followers</h2>
                            <button onClick={() => setShowFollowersModal(false)} className="close-btn">✕</button>
                        </div>
                        <div className="followers-modal-body">
                            {followers.length > 0 ? (
                                <ul className="followers-list">
                                    {followers.map((follower: any) => {
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

            {/* Modal Following */}
            {showFollowingModal && (
                <div className="followers-modal-overlay" onClick={() => setShowFollowingModal(false)}>
                    <div className="followers-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="followers-modal-header">
                            <h2>Following</h2>
                            <button onClick={() => setShowFollowingModal(false)} className="close-btn">✕</button>
                        </div>
                        <div className="followers-modal-body">
                            {following.length > 0 ? (
                                <ul className="followers-list">
                                    {following.map((followedUser: any) => {
                                        const followingId = followedUser.id || followedUser._id;
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
                                                {followedUser.name || followedUser.email || 'User'}
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

export default User;