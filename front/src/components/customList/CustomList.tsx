import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurantsInList, deleteList, removeRestaurantFromList } from '../../api/lists';
import { AddToListModal } from '../addToListModal/AddToListModal';
import { ConfirmModal } from '../confirmModal/ConfirmModal';
import './CustomList.css';

interface CustomListProps {
    listId: string;
    listName: string;
    restaurantIds: (string | { id: string })[];
    userId: string;
    token: string;
    onDeleted?: () => void;
    onUpdated?: () => void;
    onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface ApiRestaurantMini {
    id: string;
    name: string;
}

export function CustomList({ 
    listId, 
    listName, 
    restaurantIds, 
    userId,
    token, 
    onDeleted, 
    onUpdated,
    onShowToast 
}: CustomListProps) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [restaurants, setRestaurants] = useState<ApiRestaurantMini[]>([]);
    const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const normalizeRestaurantIds = (ids: (string | { id: string })[]): string[] => {
        if (!Array.isArray(ids)) return [];
        
        return ids
            .filter(id => id != null)
            .map(id => {
                if (typeof id === 'string') return id;
                if (typeof id === 'object' && id.id) return id.id;
                return null;
            })
            .filter((id): id is string => id !== null);
    };

    useEffect(() => {
        const loadRestaurants = async () => {
            if (!isOpen) {
                setRestaurants([]);
                return;
            }

            const normalizedIds = normalizeRestaurantIds(restaurantIds);

            if (normalizedIds.length === 0) {
                setRestaurants([]);
                return;
            }

            setIsLoadingRestaurants(true);
            try {
                const data = await getRestaurantsInList(normalizedIds, token);
                setRestaurants(data);
            } catch (error) {
                console.error('❌ Error loading restaurants:', error);
                setRestaurants([]);
            } finally {
                setIsLoadingRestaurants(false);
            }
        };

        loadRestaurants();
    }, [isOpen, restaurantIds, listId, token]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        setShowDeleteConfirm(false);

        try {
            await deleteList(listId, token);
            
            if (onShowToast) {
                onShowToast(`List "${listName}" deleted successfully!`, 'success');
            }
            
            if (onDeleted) {
                onDeleted();
            }
        } catch (error) {
            console.error('❌ Error deleting list:', error);
            if (onShowToast) {
                onShowToast('Failed to delete list', 'error');
            }
        }
    };

    const handleRemoveRestaurant = async (restaurantId: string, restaurantName: string) => {
        if (!confirm(`Remove "${restaurantName}" from this list?`)) {
            return;
        }

        try {
            await removeRestaurantFromList(listId, restaurantId, token);
            
            setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
            
            if (onShowToast) {
                onShowToast(`"${restaurantName}" removed from list`, 'success');
            }
            
            if (onUpdated) {
                onUpdated();
            }
        } catch (error) {
            console.error('❌ Error removing restaurant:', error);
            if (onShowToast) {
                onShowToast('Failed to remove restaurant', 'error');
            }
        }
    };

    const handleRestaurantClick = (restaurantId: string) => {
        navigate(`/restaurant/${restaurantId}`);
    };

    const normalizedIds = normalizeRestaurantIds(restaurantIds);

    return (
        <>
            <div className="custom-list">
                <div className="custom-list-header" onClick={handleToggle}>
                    <div className="custom-list-title">
                        <span className="list-name">{listName}</span>
                        <span className="restaurant-count">
                            ({normalizedIds.length} restaurant{normalizedIds.length !== 1 ? 's' : ''})
                        </span>
                    </div>
                    <div className="custom-list-actions">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowEditModal(true);
                            }}
                            className="action-btn edit-btn"
                            title="Edit"
                        >
                            ✎
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick();
                            }}
                            className="action-btn delete-btn"
                            title="Delete"
                        >
                            ×
                        </button>
                        <button className="action-btn toggle-btn" title={isOpen ? 'Close' : 'Open'}>
                            {isOpen ? '▴' : '▾'}
                        </button>
                    </div>
                </div>

                {isOpen && (
                    <div className="custom-list-content">
                        {isLoadingRestaurants ? (
                            <div className="custom-list-loading">Loading restaurants...</div>
                        ) : restaurants.length === 0 ? (
                            <div className="custom-list-empty">No restaurants in this list yet.</div>
                        ) : (
                            <ul className="custom-list-restaurants">
                                {restaurants.map((restaurant) => (
                                    <li key={restaurant.id} className="custom-list-restaurant-item">
                                        <span
                                            className="restaurant-name-link"
                                            onClick={() => handleRestaurantClick(restaurant.id)}
                                        >
                                            {restaurant.name}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveRestaurant(restaurant.id, restaurant.name)}
                                            className="remove-restaurant-btn"
                                            title="Remove from list"
                                        >
                                            −
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <AddToListModal
                    listId={listId}
                    listName={listName}
                    token={token}
                    onClose={() => {
                        setShowEditModal(false);
                    }}
                    onSuccess={() => {
                        setShowEditModal(false);
                        if (onShowToast) {
                            onShowToast('List updated successfully!', 'success');
                        }
                        if (onUpdated) {
                            onUpdated();
                        }
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <ConfirmModal
                    title="Delete List"
                    message={`Are you sure you want to delete "${listName}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    isDangerous={true}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </>
    );
}