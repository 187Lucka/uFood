const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface User {
    id: string;
    name: string;
    email: string;
    rating?: number;
    followers?: User[];
    following?: User[];
}

export interface SearchUsersResponse {
    items: User[];
    total: number;
}

/**
 * Rechercher des utilisateurs par nom
 */
export const searchUsers = async (query: string, token: string): Promise<User[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/users?q=${encodeURIComponent(query)}`,
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
        console.log('🔍 Recherche utilisateurs:', data);
        
        // L'API retourne { items: [...] } ou directement [...]
        return Array.isArray(data) ? data : (data.items || []);
    } catch (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error);
        throw error;
    }
};

/**
 * Récupérer un utilisateur par son ID
 */
export const getUserById = async (userId: string, token: string): Promise<User> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/users/${userId}`,
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
                throw new Error('Utilisateur non trouvé');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('👤 Utilisateur récupéré:', data);
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        throw error;
    }
};

/**
 * Suivre un utilisateur
 */
export const followUser = async (userId: string, token: string): Promise<void> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/follow`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ id: userId }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        console.log('✅ Utilisateur suivi avec succès');
    } catch (error) {
        console.error('Erreur lors du suivi de l\'utilisateur:', error);
        throw error;
    }
};

/**
 * Ne plus suivre un utilisateur
 */
export const unfollowUser = async (userId: string, token: string): Promise<void> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/follow/${userId}`,
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

        console.log('✅ Utilisateur non suivi avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'arrêt du suivi:', error);
        throw error;
    }
};

/**
 * Récupérer la liste des followers d'un utilisateur
 */
export const getUserFollowers = async (userId: string, token: string): Promise<User[]> => {
    try {
        const user = await getUserById(userId, token);
        return user.followers || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des followers:', error);
        throw error;
    }
};

/**
 * Récupérer la liste des utilisateurs suivis
 */
export const getUserFollowing = async (userId: string, token: string): Promise<User[]> => {
    try {
        const user = await getUserById(userId, token);
        return user.following || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des following:', error);
        throw error;
    }
};

/**
 * Vérifier si l'utilisateur courant suit un autre utilisateur
 */
export const isFollowing = async (currentUserId: string, targetUserId: string, token: string): Promise<boolean> => {
    try {
        const following = await getUserFollowing(currentUserId, token);
        return following.some(user => user.id === targetUserId);
    } catch (error) {
        console.error('Erreur lors de la vérification du suivi:', error);
        return false;
    }
};