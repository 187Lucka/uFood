import { useState, useEffect } from 'react';
import './AddToListModal.css';
import { useLists } from '../../context/ListsContext';
import { addRestaurantToList, removeRestaurantFromList, updateListName } from '../../api/lists';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface AddToListModalProps {
    listId: string;
    listName: string;
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface Restaurant {
    id: string;
    name: string;
    address: string;
    rating: number;
    pictures: string[];
}

export function AddToListModal({ listId, listName, token, onClose, onSuccess }: AddToListModalProps) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
    const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
    
    const [editedName, setEditedName] = useState(listName);
    const [isRenamingList, setIsRenamingList] = useState(false);

    const { lists, addRestaurantToListLocal, removeRestaurantFromListLocal } = useLists();

    useEffect(() => {
        const loadRestaurants = async () => {
            setIsLoadingRestaurants(true);
            try {
                const response = await fetch(`${API_BASE_URL}/restaurants?limit=200`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to load restaurants');
                }

                const data = await response.json();
                const restaurantsList = Array.isArray(data) ? data : (data.items || []);
                setRestaurants(restaurantsList);
                setFilteredRestaurants(restaurantsList);
                console.log('✅ Loaded restaurants:', restaurantsList.length);
            } catch (error) {
                console.error('❌ Error loading restaurants:', error);
            } finally {
                setIsLoadingRestaurants(false);
            }
        };

        loadRestaurants();
    }, [token]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredRestaurants(restaurants);
        } else {
            const filtered = restaurants.filter(restaurant =>
                restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredRestaurants(filtered);
        }
    }, [searchQuery, restaurants]);

    const handleRenameList = async () => {
        if (editedName.trim() === '' || editedName === listName) {
            return;
        }

        try {
            setIsRenamingList(true);
            await updateListName(listId, editedName, token);
            console.log('✅ Liste renommée');
        } catch (error) {
            console.error('❌ Erreur rename:', error);
            setEditedName(listName);
        } finally {
            setIsRenamingList(false);
        }
    };

    const handleRestaurantToggle = (restaurantId: string) => {
        const currentList = lists.find(l => l.id === listId);
        if (!currentList) return;

        const restaurantIds = (currentList.restaurants || []).map((r: any) => 
            typeof r === 'string' ? r : (r.id || r)
        ).filter(Boolean);

        const isInList = restaurantIds.includes(restaurantId);

        if (isInList) {
            // ✅ Restaurant déjà dans la liste → Toggle pour retirer
            setSelectedToRemove(prev => {
                const newSet = new Set(prev);
                if (newSet.has(restaurantId)) {
                    newSet.delete(restaurantId);
                } else {
                    newSet.add(restaurantId);
                }
                return newSet;
            });
            // Retirer de selectedToAdd si présent
            setSelectedToAdd(prev => {
                const newSet = new Set(prev);
                newSet.delete(restaurantId);
                return newSet;
            });
        } else {
            // ✅ Restaurant pas dans la liste → Toggle pour ajouter
            setSelectedToAdd(prev => {
                const newSet = new Set(prev);
                if (newSet.has(restaurantId)) {
                    newSet.delete(restaurantId);
                } else {
                    newSet.add(restaurantId);
                }
                return newSet;
            });
        }
    };

    const isRestaurantInList = (restaurantId: string) => {
        const currentList = lists.find(l => l.id === listId);
        if (!currentList) return false;

        const restaurantIds = (currentList.restaurants || []).map((r: any) => 
            typeof r === 'string' ? r : (r.id || r)
        ).filter(Boolean);

        return restaurantIds.includes(restaurantId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Renommer d'abord si nécessaire
        if (editedName !== listName) {
            await handleRenameList();
        }

        if (selectedToAdd.size === 0 && selectedToRemove.size === 0) {
            // Aucun changement, juste fermer
            onSuccess();
            onClose();
            return;
        }

        setIsSubmitting(true);

        try {
            // ✅ Ajouter les restaurants sélectionnés
            for (const restaurantId of Array.from(selectedToAdd)) {
                try {
                    console.log(`📥 Adding restaurant ${restaurantId} to list ${listId}`);
                    await addRestaurantToList(listId, restaurantId, token);
                    addRestaurantToListLocal(listId, restaurantId);
                    console.log(`✅ Added restaurant ${restaurantId}`);
                } catch (error: any) {
                    console.error(`❌ Failed to add ${restaurantId}:`, error);
                }
            }

            // ✅ Retirer les restaurants sélectionnés
            for (const restaurantId of Array.from(selectedToRemove)) {
                try {
                    console.log(`📤 Removing restaurant ${restaurantId} from list ${listId}`);
                    await removeRestaurantFromList(listId, restaurantId, token);
                    removeRestaurantFromListLocal(listId, restaurantId);
                    console.log(`✅ Removed restaurant ${restaurantId}`);
                } catch (error: any) {
                    console.error(`❌ Failed to remove ${restaurantId}:`, error);
                }
            }

            // ✅ Toujours appeler onSuccess puis fermer
            onSuccess();
            onClose();
        } catch (error) {
            console.error('❌ Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTotalChanges = () => {
        return selectedToAdd.size + selectedToRemove.size;
    };

    return (
        <div className="modal-backdrop-lists" onClick={onClose}>
            <div className="modal-lists" onClick={(e) => e.stopPropagation()}>
                <div className="modal-lists-header">
                    <div style={{ flex: 1 }}>
                        <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName((e.target as HTMLInputElement).value)}
                            onBlur={handleRenameList}
                            className="list-name-edit-input"
                            disabled={isRenamingList}
                        />
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }} 
                        className="modal-lists-close"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-lists-search">
                    <input
                        type="text"
                        placeholder="Search restaurants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                        className="search-input-lists"
                    />
                </div>

                <div className="modal-lists-body">
                {isLoadingRestaurants ? (
                    <div className="loading-message">Loading restaurants...</div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="no-results-message">
                        {searchQuery ? 'No restaurants found matching your search.' : 'No restaurants available.'}
                    </div>
                ) : (
                    filteredRestaurants.map((restaurant) => {
                        const inList = isRestaurantInList(restaurant.id);
                        const selectedForAdding = selectedToAdd.has(restaurant.id);
                        const selectedForRemoval = selectedToRemove.has(restaurant.id);
                        const isSelected = selectedForAdding || selectedForRemoval;

                        return (
                            <div
                                key={restaurant.id}
                                className={`restaurant-item-modal ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleRestaurantToggle(restaurant.id)}
                            >
                                {restaurant.pictures?.[0] && (
                                    <img
                                        src={restaurant.pictures[0]}
                                        alt={restaurant.name}
                                        className="restaurant-item-image"
                                    />
                                )}
                                <div className="restaurant-item-info">
                                    <h4 className="restaurant-item-name">{restaurant.name}</h4>
                                    <p className="restaurant-item-address">{restaurant.address}</p>
                                </div>
                                <div className="restaurant-item-right">
                                    {inList && !selectedForRemoval ? (
                                        <span className="already-added-badge">✓ In List</span>
                                    ) : selectedForRemoval ? (
                                        <span className="already-added-badge" style={{ background: '#ef4444' }}>✕ Remove</span>
                                    ) : (
                                        <input
                                            type="checkbox"
                                            checked={selectedForAdding}
                                            onChange={() => {}}
                                            className="restaurant-checkbox"
                                        />
                                    )}
                                    <div className="restaurant-item-rating">
                                        <span className="stars">{'★'.repeat(Math.floor(restaurant.rating))}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

                <div className="modal-lists-footer">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }} 
                        className="modal-lists-btn-cancel"
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="modal-lists-btn-submit"
                        type="button"
                    >
                        {isSubmitting ? 'Saving...' : getTotalChanges() === 0 ? 'Close' : `Save ${getTotalChanges()} change${getTotalChanges() !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}