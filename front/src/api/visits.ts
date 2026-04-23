const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Visit {
    id: string;
    restaurant_id: string;
    rating: number;
    comment: string;
    date: string;
}

export interface CreateVisitData {
    restaurant_id: string;
    date: string;
    rating: number;
    comment: string;
}

export const getUserVisits = async (userId: string, token: string): Promise<Visit[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/users/${userId}/restaurants/visits`,
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
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 getUserVisits réponse brute:', data);
        
        // L'API retourne { items: [...], total: X } ou directement [...]
        const visits = Array.isArray(data) ? data : (data.items || []);
        console.log('✅ getUserVisits visites extraites:', visits);
        
        return visits;
    } catch (error) {
        console.error('Error fetching user visits:', error);
        throw error;
    }
};

export const createVisit = async (
    userId: string,
    visitData: CreateVisitData,
    token: string
): Promise<Visit> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/users/${userId}/restaurants/visits`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(visitData),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ createVisit réponse:', data);
        return data;
    } catch (error) {
        console.error('Error creating visit:', error);
        throw error;
    }
};

export const getVisitById = async (
    userId: string,
    visitId: string,
    token: string
): Promise<Visit> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/users/${userId}/restaurants/visits/${visitId}`,
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
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            if (response.status === 404) {
                throw new Error('Visite non trouvée');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching visit:', error);
        throw error;
    }
};

export const updateVisit = async (
    userId: string,
    visitId: string,
    visitData: Partial<CreateVisitData>,
    token: string
): Promise<Visit> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/users/${userId}/restaurants/visits/${visitId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(visitData),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating visit:', error);
        throw error;
    }
};

export const deleteVisit = async (
    userId: string,
    visitId: string,
    token: string
): Promise<void> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/users/${userId}/restaurants/visits/${visitId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting visit:', error);
        throw error;
    }
};

// ❌ FONCTION SUPPRIMÉE - N'est plus utilisée car on utilise le Context
// La fonction hasVisitedRestaurant a été retirée car elle faisait des appels API redondants
// Utilisez maintenant useVisits().hasVisited() à la place