const API_BASE_URL = import.meta.env.VITE_API_URL;

export type CustomList = {
    id: string;
    name: string;
    owner: string;
    restaurants: string[];
};

export type ApiRestaurantMini = {
    id: string;
    name: string;
};

export const createList = async (name: string, userId: string, token: string): Promise<CustomList> => {
    try {
        console.log('📝 Creating list with:', { name, owner: userId });
        
        const response = await fetch(`${API_BASE_URL}/favorites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                name: name,
                owner: userId,  // ⬅️ C'est correct
                restaurants: []
            }),
        });

        console.log('📤 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Liste créée (raw):', data);
        
        // ⬅️ CORRIGER: Normaliser la réponse
        const normalizedList: CustomList = {
            id: data.id || data._id,
            name: data.name,
            owner: typeof data.owner === 'string' ? data.owner : data.owner?.id || data.owner?._id || userId,
            restaurants: Array.isArray(data.restaurants) ? data.restaurants : []
        };
        
        console.log('✅ Liste normalisée:', normalizedList);
        return normalizedList;
    } catch (error) {
        console.error('Error creating list:', error);
        throw error;
    }
};

export const getUserLists = async (userId: string, token: string): Promise<CustomList[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : (data.items || []);
    } catch (error) {
        console.error('Error fetching user lists:', error);
        throw error;
    }
};

export const getListById = async (listId: string, token: string): Promise<CustomList> => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${listId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            if (response.status === 404) {
                throw new Error('Liste non trouvée');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching list:', error);
        throw error;
    }
};

export const updateListName = async (listId: string, newName: string, token: string): Promise<CustomList> => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${listId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newName }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error('Échec de la mise à jour du nom de la liste');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating list name:', error);
        throw error;
    }
};

export const deleteList = async (listId: string, token: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${listId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error('Échec de la suppression de la liste');
        }
    } catch (error) {
        console.error('Error deleting list:', error);
        throw error;
    }
};

// ⬅️ CORRIGER: Ajouter plus de logs
// ⬅️ CORRIGER: Le bon endpoint selon le Swagger
export const addRestaurantToList = async (
    listId: string,
    restaurantId: string,
    token: string
): Promise<void> => {
    try {
        console.log(`🔄 Ajout restaurant ${restaurantId} à liste ${listId}`);
        console.log(`📍 URL: ${API_BASE_URL}/favorites/${listId}/restaurants`);
        
        const response = await fetch(`${API_BASE_URL}/favorites/${listId}/restaurants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: restaurantId }), // ⬅️ BODY avec {"id": "..."}
        });

        console.log(`📊 Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error response (${response.status}):`, errorText);
            
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            if (response.status === 409) {
                throw new Error('Ce restaurant est déjà dans cette liste');
            }
            if (response.status === 404) {
                throw new Error('Liste ou restaurant non trouvé');
            }
            throw new Error(`Échec de l'ajout du restaurant à la liste (${response.status}): ${errorText}`);
        }

        console.log(`✅ Restaurant ${restaurantId} ajouté à la liste ${listId}`);
    } catch (error) {
        console.error('❌ Error adding restaurant to list:', error);
        throw error;
    }
};

export const removeRestaurantFromList = async (
    listId: string,
    restaurantId: string,
    token: string
): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${listId}/restaurants/${restaurantId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error('Échec de la suppression du restaurant de la liste');
        }
    } catch (error) {
        console.error('Error removing restaurant from list:', error);
        throw error;
    }
};

export const getRestaurantsInList = async (restaurantIds: string[], token: string): Promise<ApiRestaurantMini[]> => {
    try {
        if (restaurantIds.length === 0) {
            return [];
        }

        const promises = restaurantIds.map((id) =>
            fetch(`${API_BASE_URL}/restaurants/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }).then(res => {
                if (!res.ok) {
                    console.warn(`Restaurant ${id} non trouvé`);
                    return null;
                }
                return res.json();
            })
        );

        const results = await Promise.all(promises);
        return results
            .filter((r): r is any => r !== null)
            .map((r) => ({ id: r.id, name: r.name }));
    } catch (error) {
        console.error('Error fetching restaurants in list:', error);
        return [];
    }
};