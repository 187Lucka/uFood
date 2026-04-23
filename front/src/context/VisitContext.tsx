import React, { createContext, useContext, useState, useCallback } from 'react';
import { getAllUserVisitsPaginated } from '../api/context';

export interface VisitRecord {
    id: string;
    restaurant_id: string;
    restaurant?: {
        id: string;
        name: string;
        address: string;
        phone: string;
        location: { lat: number; lng: number };
        directions: string;
        hours: string;
        photos: string[];
        genres: string[];
        priceRange: string;
        rating: number;
        priceRangeNumber?: number;
    };
    date: string;
    rating: number;
    comment: string;
    createdAt?: string;
}

interface VisitContextType {
    visits: VisitRecord[];
    addVisit: (visitData: Omit<VisitRecord, 'id' | 'createdAt'>) => void;
    getVisitsByRestaurant: (restaurantId: string) => VisitRecord[];
    getVisitedRestaurants: () => VisitRecord[];
    getVisitByRestaurantId: (restaurantId: string) => VisitRecord | undefined;
    hasVisited: (restaurantId: string) => boolean;
    loadVisitsFromAPI: (userId: string, token: string) => Promise<void>;
    isLoading: boolean;
    reloadVisits: (userId: string, token: string) => Promise<void>;
}

const VisitContext = createContext<VisitContextType | undefined>(undefined);

export function VisitProvider({ children }: { children: React.ReactNode }) {
    const [visits, setVisits] = useState<VisitRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadVisitsFromAPI = useCallback(async (userId: string, token: string) => {
        try {
            setIsLoading(true);
            console.log('🔥 Chargement de TOUTES les visites depuis l\'API...');
            
            // ✅ Utilisation de la fonction du dossier api/
            const allVisits = await getAllUserVisitsPaginated(userId, token);

            // Transformer les visites API en VisitRecord
            const transformedVisits: VisitRecord[] = allVisits.map((visit: any) => {
                return {
                    id: visit.id,
                    restaurant_id: visit.restaurant_id,
                    date: visit.date,
                    rating: visit.rating,
                    comment: visit.comment,
                    createdAt: visit.createdAt || new Date().toISOString(),
                };
            });
            
            setVisits(transformedVisits);
            console.log('✅ Toutes les visites chargées dans le Context:', transformedVisits.length);
        } catch (error) {
            console.error('❌ Erreur lors du chargement des visites depuis l\'API:', error);
            setVisits([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reloadVisits = useCallback(async (userId: string, token: string) => {
        console.log('🔄 Rechargement des visites...');
        await loadVisitsFromAPI(userId, token);
    }, [loadVisitsFromAPI]);

    const addVisit = useCallback((visitData: Omit<VisitRecord, 'id' | 'createdAt'>) => {
        console.log('➕ Ajout d\'une visite au Context:', visitData);
        
        const newVisit: VisitRecord = {
            ...visitData,
            id: visitData.id || `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
        };
        
        setVisits(prev => {
            // Vérifier si la visite existe déjà
            const exists = prev.some(v => v.restaurant_id === visitData.restaurant_id);
            console.log('Visite existe déjà?', exists);
            
            if (exists) {
                return prev;
            }
            return [...prev, newVisit];
        });
    }, []);

    const getVisitsByRestaurant = useCallback((restaurantId: string) => {
        return visits.filter(v => v.restaurant_id === restaurantId);
    }, [visits]);

    const getVisitedRestaurants = useCallback(() => {
        console.log('🔍 Récupération des restaurants visités. Total visites:', visits.length);
        return visits;
    }, [visits]);

    const getVisitByRestaurantId = useCallback((restaurantId: string) => {
        return visits.find(v => v.restaurant_id === restaurantId);
    }, [visits]);

    const hasVisited = useCallback((restaurantId: string) => {
        const result = visits.some(v => v.restaurant_id === restaurantId);
        console.log(`🔍 Restaurant ${restaurantId} visité? ${result}`);
        return result;
    }, [visits]);

    return (
        <VisitContext.Provider value={{
            visits,
            addVisit,
            getVisitsByRestaurant,
            getVisitedRestaurants,
            getVisitByRestaurantId,
            hasVisited,
            loadVisitsFromAPI,
            reloadVisits,
            isLoading,
        }}>
            {children}
        </VisitContext.Provider>
    );
}

export function useVisits() {
    const context = useContext(VisitContext);
    if (!context) {
        throw new Error('useVisits must be used within a VisitProvider');
    }
    return context;
}