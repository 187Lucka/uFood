import { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../api/users';
import { getUserById, followUser as apiFollowUser, unfollowUser as apiUnfollowUser } from '../api/users';

interface UserContextType {
    currentUser: User | null;
    followers: User[];
    following: User[];
    isLoading: boolean;
    loadUserData: (userId: string, token: string) => Promise<void>;
    followUser: (userId: string, token: string) => Promise<void>;
    unfollowUser: (userId: string, token: string) => Promise<void>;
    updateFollowersCount: (increment: boolean) => void;
    updateFollowingCount: (increment: boolean) => void;
    isFollowingUser: (userId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: any;
}

export function UserProvider({ children }: UserProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [followers, setFollowers] = useState<User[]>([]);
    const [following, setFollowing] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadUserData = useCallback(async (userId: string, token: string) => {
        try {
            setIsLoading(true);
            console.log('🔄 Loading user data from API...');
            
            const userData = await getUserById(userId, token);
            
            setCurrentUser(userData);
            setFollowers(userData.followers || []);
            setFollowing(userData.following || []);
            
            console.log('✅ User data loaded:', {
                user: userData.name,
                followers: userData.followers?.length || 0,
                following: userData.following?.length || 0
            });
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            setCurrentUser(null);
            setFollowers([]);
            setFollowing([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const followUser = useCallback(async (userId: string, token: string) => {
        try {
            console.log('➕ Following user:', userId);
            await apiFollowUser(userId, token);
            
            setFollowing(prev => {
                if (prev.some(user => user.id === userId)) {
                    return prev;
                }
                return [...prev, { id: userId, name: '', email: '' }];
            });
            
            console.log('✅ User followed successfully');
        } catch (error) {
            console.error('❌ Error following user:', error);
            throw error;
        }
    }, []);

    const unfollowUser = useCallback(async (userId: string, token: string) => {
        try {
            console.log('➖ Unfollowing user:', userId);
            await apiUnfollowUser(userId, token);
            
            setFollowing(prev => prev.filter(user => user.id !== userId));
            
            console.log('✅ User unfollowed successfully');
        } catch (error) {
            console.error('❌ Error unfollowing user:', error);
            throw error;
        }
    }, []);

    const updateFollowersCount = useCallback((increment: boolean) => {
        setFollowers(prev => {
            if (increment) {
                console.log('➕ Follower added (count only)');
                return prev;
            } else {
                console.log('➖ Follower removed (count only)');
                return prev;
            }
        });
    }, []);

    const updateFollowingCount = useCallback((increment: boolean) => {
        console.log(increment ? '➕ Following count increased' : '➖ Following count decreased');
    }, []);

    const isFollowingUser = useCallback((userId: string) => {
        return following.some(user => user.id === userId);
    }, [following]);

    return (
        <UserContext.Provider value={{
            currentUser,
            followers,
            following,
            isLoading,
            loadUserData,
            followUser,
            unfollowUser,
            updateFollowersCount,
            updateFollowingCount,
            isFollowingUser,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}