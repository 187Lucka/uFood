import { createContext, useContext, useState, useCallback } from 'preact/compat';
import { getAllUserLists } from '../api/context';

export interface CustomList {
    id: string;
    name: string;
    owner: string;
    restaurants: string[];
}

interface ListsContextType {
    lists: CustomList[];
    isLoading: boolean;
    loadUserLists: (userId: string, token: string) => Promise<void>;
    addList: (list: CustomList) => void;
    updateList: (listId: string, updates: Partial<CustomList>) => void;
    removeList: (listId: string) => void;
    addRestaurantToListLocal: (listId: string, restaurantId: string) => void;
    removeRestaurantFromListLocal: (listId: string, restaurantId: string) => void;
    reloadLists: (userId: string, token: string) => Promise<void>;
    getListById: (listId: string) => CustomList | undefined;
}

const ListsContext = createContext<ListsContextType | undefined>(undefined);

export function ListsProvider({ children }: { children: any }) {
    const [lists, setLists] = useState<CustomList[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadUserLists = useCallback(async (userId: string, token: string) => {
        try {
            setIsLoading(true);
            console.log('📥 Chargement des listes pour:', userId);
            
            const userLists = await getAllUserLists(userId, token);
            
            console.log('✅ Listes chargées:', userLists);
            setLists(userLists);
        } catch (error) {
            console.error('❌ Erreur lors du chargement des listes:', error);
            setLists([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reloadLists = useCallback(async (userId: string, token: string) => {
        console.log('🔄 Rechargement des listes...');
        await loadUserLists(userId, token);
    }, [loadUserLists]);

    const addList = useCallback((list: CustomList) => {
        console.log('➕ Ajout d\'une liste au Context:', list);
        setLists(prev => [...prev, list]);
    }, []);

    const updateList = useCallback((listId: string, updates: Partial<CustomList>) => {
        console.log('📝 Mise à jour de la liste:', listId, updates);
        setLists(prev => prev.map(list => 
            list.id === listId ? { ...list, ...updates } : list
        ));
    }, []);

    const removeList = useCallback((listId: string) => {
        console.log('🗑️ Suppression de la liste:', listId);
        setLists(prev => prev.filter(list => list.id !== listId));
    }, []);

    const addRestaurantToListLocal = useCallback((listId: string, restaurantId: string) => {
        console.log('➕ Ajout restaurant', restaurantId, 'à la liste', listId);
        setLists(prev => prev.map(list => {
            if (list.id === listId) {
                if (list.restaurants && list.restaurants.includes(restaurantId)) {
                    return list;
                }
                return {
                    ...list,
                    restaurants: [...(list.restaurants || []), restaurantId]
                };
            }
            return list;
        }));
    }, []);

    const removeRestaurantFromListLocal = useCallback((listId: string, restaurantId: string) => {
        console.log('➖ Retrait restaurant', restaurantId, 'de la liste', listId);
        setLists(prev => prev.map(list => {
            if (list.id === listId) {
                return {
                    ...list,
                    restaurants: (list.restaurants || []).filter(id => id !== restaurantId)
                };
            }
            return list;
        }));
    }, []);

    const getListById = useCallback((listId: string) => {
        return lists.find(list => list.id === listId);
    }, [lists]);

    return (
        <ListsContext.Provider value={{
            lists,
            isLoading,
            loadUserLists,
            addList,
            updateList,
            removeList,
            addRestaurantToListLocal,
            removeRestaurantFromListLocal,
            reloadLists,
            getListById,
        }}>
            {children}
        </ListsContext.Provider>
    );
}

export function useLists() {
    const context = useContext(ListsContext);
    if (!context) {
        throw new Error('useLists must be used within a ListsProvider');
    }
    return context;
}