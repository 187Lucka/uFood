import { useState, useEffect } from 'react';
import './AddRestaurantToListModal.css';
import { useLists } from '../../context/ListsContext';
import { addRestaurantToList, removeRestaurantFromList } from '../../api/lists';

interface AddRestaurantToListModalProps {
    restaurantId: string;
    restaurantName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddRestaurantToListModal({ 
    restaurantId, 
    restaurantName, 
    onClose, 
    onSuccess 
}: AddRestaurantToListModalProps) {
    const { lists, loadUserLists, addRestaurantToListLocal, removeRestaurantFromListLocal } = useLists();
    const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
    const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            const parsedUser = JSON.parse(userData);
            loadUserLists(parsedUser.id, token);
        }
    }, [loadUserLists]);

    const handleToggleList = (listId: string) => {
        const list = lists.find(l => l.id === listId);
        if (!list) return;

        const restaurantIds = (list.restaurants || []).map((r: any) => 
            typeof r === 'string' ? r : (r.id || r)
        ).filter(Boolean);

        const isInList = restaurantIds.includes(restaurantId);

        if (isInList) {
            // ✅ Restaurant déjà dans la liste → Toggle pour retirer
            setSelectedToRemove(prev => {
                const newSet = new Set(prev);
                if (newSet.has(listId)) {
                    newSet.delete(listId);
                } else {
                    newSet.add(listId);
                }
                return newSet;
            });
            // Retirer de selectedToAdd si présent
            setSelectedToAdd(prev => {
                const newSet = new Set(prev);
                newSet.delete(listId);
                return newSet;
            });
        } else {
            // ✅ Restaurant pas dans la liste → Toggle pour ajouter
            setSelectedToAdd(prev => {
                const newSet = new Set(prev);
                if (newSet.has(listId)) {
                    newSet.delete(listId);
                } else {
                    newSet.add(listId);
                }
                return newSet;
            });
        }
    };

    const isRestaurantInList = (listId: string) => {
        const list = lists.find(l => l.id === listId);
        if (!list) return false;

        const restaurantIds = (list.restaurants || []).map((r: any) => 
            typeof r === 'string' ? r : (r.id || r)
        ).filter(Boolean);

        return restaurantIds.includes(restaurantId);
    };

    const handleSubmit = async () => {
        if (selectedToAdd.size === 0 && selectedToRemove.size === 0) {
            onClose();
            return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('You must be logged in');
            return;
        }

        setIsSubmitting(true);

        try {
            // ✅ Ajouter aux listes sélectionnées
            for (const listId of Array.from(selectedToAdd)) {
                try {
                    await addRestaurantToList(listId, restaurantId, token);
                    addRestaurantToListLocal(listId, restaurantId);
                } catch (error) {
                    console.error(`Failed to add to list ${listId}:`, error);
                }
            }

            // ✅ Retirer des listes sélectionnées
            for (const listId of Array.from(selectedToRemove)) {
                try {
                    await removeRestaurantFromList(listId, restaurantId, token);
                    removeRestaurantFromListLocal(listId, restaurantId);
                } catch (error) {
                    console.error(`Failed to remove from list ${listId}:`, error);
                }
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating lists:', error);
            alert('Failed to update lists');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTotalChanges = () => {
        return selectedToAdd.size + selectedToRemove.size;
    };

    return (
        <div className="add-restaurant-modal-overlay" onClick={onClose}>
            <div className="add-restaurant-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-restaurant-modal-header">
                    <h2>Add "{restaurantName}" to lists</h2>
                    <button onClick={onClose} className="close-btn">✕</button>
                </div>

                <div className="add-restaurant-modal-body">
                    {lists.length === 0 ? (
                        <div className="no-lists-message">
                            <p>You don't have any lists yet.</p>
                            <p>Create a list from your profile page!</p>
                        </div>
                    ) : (
                        <div className="lists-selection">
                            {lists.map((list) => {
                                const inList = isRestaurantInList(list.id);
                                const selectedForAdding = selectedToAdd.has(list.id);
                                const selectedForRemoval = selectedToRemove.has(list.id);
                                const restaurantCount = Array.isArray(list.restaurants) 
                                    ? list.restaurants.length 
                                    : 0;

                                // ✅ Déterminer les classes CSS
                                let itemClass = 'list-selection-item';
                                if (selectedForAdding || selectedForRemoval) {
                                    itemClass += ' selected';
                                }
                                if (inList && !selectedForRemoval) {
                                    itemClass += ' in-list';
                                }
                                if (selectedForRemoval) {
                                    itemClass += ' to-remove';
                                }

                                return (
                                    <div
                                        key={list.id}
                                        className={itemClass}
                                        onClick={() => handleToggleList(list.id)}
                                    >
                                        <div className="list-checkbox">
                                            ✓
                                        </div>
                                        <div className="list-info">
                                            <div className="list-name">{list.name}</div>
                                            <div className="list-count">
                                                {restaurantCount} restaurant{restaurantCount !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        {/* ✅ Badges conditionnels */}
                                        {inList && !selectedForRemoval && (
                                            <span className="list-badge in-list">✓ In List</span>
                                        )}
                                        {selectedForRemoval && (
                                            <span className="list-badge remove">✕ Remove</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="add-restaurant-modal-footer">
                    <button onClick={onClose} className="cancel-btn">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="submit-btn"
                    >
                        {isSubmitting 
                            ? 'Saving...' 
                            : getTotalChanges() === 0 
                                ? 'Close' 
                                : `Save ${getTotalChanges()} change${getTotalChanges() !== 1 ? 's' : ''}`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}