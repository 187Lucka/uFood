import type { userData } from '../users';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const loginUser = async (email: string, password: string): Promise<userData | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Login successful:', data);
            return data;
        } else {
            console.error('Login failed:', data);
            return null;
        }
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

export const signupUser = async (name: string, email: string, password: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            throw new Error('Failed to sign up');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error during signup:', error);
        throw error;
    }
};

export const logoutUser = async (token: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': token,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to logout');
        }

        return await response.json();
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
};