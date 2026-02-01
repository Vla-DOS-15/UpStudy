import api from '@/lib/axios';

export interface Author {
    id: string;
    userName: string;
    avatarUrl: string | null;
    rating: number;
    completedOrdersCount: number;
    aboutMe: string | null;
    reviewsCount: number;
}

export const userService = {
    async getTopAuthors(limit = 20): Promise<Author[]> {
        const response = await api.get(`/Users/authors?limit=${limit}`);
        return response.data;
    },

    async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/Users/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async updateProfile(data: any): Promise<void> {
        await api.put('/Users/profile', data);
    },
};
