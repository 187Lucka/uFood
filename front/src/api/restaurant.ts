import type { ApiRestaurant } from '../interface/restaurant';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const getRestaurants = async (token: string): Promise<ApiRestaurant[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.items || data;
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        throw error;
    }
};

export const getAllRestaurantsPaginated = async (token: string): Promise<ApiRestaurant[]> => {
    try {
        let allFetchedRestaurants: ApiRestaurant[] = [];
        let currentPage = 0;
        let hasMore = true;
        const limit = 100;

        while (hasMore) {
            const response = await fetch(
                `${API_BASE_URL}/restaurants?limit=${limit}&page=${currentPage}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Expired or invalid token. Please log in again.');
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const apiRestaurants: ApiRestaurant[] = data.items || [];

            allFetchedRestaurants = [...allFetchedRestaurants, ...apiRestaurants];
            hasMore = apiRestaurants.length === limit;
            currentPage++;
        }

        return allFetchedRestaurants;
    } catch (error) {
        console.error('Error fetching all restaurants:', error);
        throw error;
    }
};

export const getRestaurantById = async (restaurantId: string, token: string): Promise<ApiRestaurant> => {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            if (response.status === 404) {
                throw new Error('Restaurant non trouvé');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
    }
};

export const getFavoriteLists = async (token: string, listIds: string[]): Promise<{ id: string; name: string }[]> => {
    try {
        if (listIds.length === 0) {
            return [];
        }

        const promises = listIds.map((id) =>
            fetch(`${API_BASE_URL}/favorites/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }).then(res => res.json())
        );

        const results = await Promise.all(promises);
        return results.map((r: any) => ({ id: r.id, name: r.name }));
    } catch (error) {
        console.error('Error fetching favorite lists:', error);
        throw error;
    }
};

export const addRestaurantToList = async (
    token: string,
    listId: string,
    restaurant: ApiRestaurant
): Promise<void> => {
    try {
        const getRes = await fetch(`${API_BASE_URL}/favorites/${listId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!getRes.ok) {
            throw new Error('Failed to fetch favorite list');
        }

        const listData = await getRes.json();
        const existing = Array.isArray(listData.restaurants) ? listData.restaurants : [];

        if (existing.some((r: any) => r.id === restaurant.id)) {
            throw new Error('This restaurant is already in the selected list.');
        }

        const response = await fetch(`${API_BASE_URL}/favorites/${listId}/restaurants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(restaurant),
        });

        if (!response.ok) {
            throw new Error('Failed to add restaurant to list');
        }
    } catch (error) {
        console.error('Error adding restaurant to list:', error);
        throw error;
    }
};
