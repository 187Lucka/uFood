const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T> {
    data?: T;
    status: number;
    message?: string;
}

class ApiService {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${API_BASE_URL}${endpoint}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            const data = await response.json();

            return {
                data,
                status: response.status,
                message: response.statusText,
            };
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    }
    async getStatus() {
        return this.request<{ status: string }>('/status');
    }
}

export const apiService = new ApiService();