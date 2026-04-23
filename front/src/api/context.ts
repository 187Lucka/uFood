const API_BASE_URL = import.meta.env.VITE_API_URL;

export const getAllUserVisitsPaginated = async (userId: string, token: string): Promise<any[]> => {
    try {
        let allVisits: any[] = [];
        let page = 0;
        let hasMore = true;
        const limit = 100;
        
        while (hasMore) {
            const response = await fetch(
                `${API_BASE_URL}/users/${userId}/restaurants/visits?limit=${limit}&page=${page}`,
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
            const pageVisits = Array.isArray(data) ? data : data.items || [];
            
            console.log(`✅ Page ${page}: ${pageVisits.length} visites`);
            allVisits = [...allVisits, ...pageVisits];
            
            hasMore = pageVisits.length === limit;
            page++;
        }
        
        console.log('📊 Total visites chargées:', allVisits.length);
        return allVisits;
    } catch (error) {
        console.error('Erreur lors du chargement paginé des visites:', error);
        throw error;
    }
};

export const getAllUserLists = async (userId: string, token: string): Promise<any[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/users/${userId}/favorites`,
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
        const userLists = Array.isArray(data) ? data : (data.items || []);
        
        console.log('✅ Listes chargées:', userLists.length);
        return userLists;
    } catch (error) {
        console.error('Erreur lors du chargement des listes:', error);
        throw error;
    }
};