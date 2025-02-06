import { Http } from '@nativescript/core';

const API_BASE_URL = 'https://api.hawkergo.com/v1'; // Replace with actual API endpoint

export class ApiService {
    static async getHawkerCenters() {
        try {
            const response = await Http.request({
                url: `${API_BASE_URL}/hawker-centers`,
                method: 'GET'
            });
            return response.content.toJSON();
        } catch (error) {
            console.error('Error fetching hawker centers:', error);
            throw error;
        }
    }

    static async getNearbyHawkers(lat: number, lng: number) {
        try {
            const response = await Http.request({
                url: `${API_BASE_URL}/hawker-centers/nearby`,
                method: 'GET',
                parameters: {
                    lat: lat.toString(),
                    lng: lng.toString()
                }
            });
            return response.content.toJSON();
        } catch (error) {
            console.error('Error fetching nearby hawkers:', error);
            throw error;
        }
    }

    static async getQueueStatus(userId: string) {
        try {
            const response = await Http.request({
                url: `${API_BASE_URL}/queues/user/${userId}`,
                method: 'GET'
            });
            return response.content.toJSON();
        } catch (error) {
            console.error('Error fetching queue status:', error);
            throw error;
        }
    }

    static async joinQueue(stallId: string, userId: string) {
        try {
            const response = await Http.request({
                url: `${API_BASE_URL}/queues/join`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                content: JSON.stringify({
                    stallId,
                    userId
                })
            });
            return response.content.toJSON();
        } catch (error) {
            console.error('Error joining queue:', error);
            throw error;
        }
    }

    static async leaveQueue(queueId: string, userId: string) {
        try {
            const response = await Http.request({
                url: `${API_BASE_URL}/queues/${queueId}/leave`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                content: JSON.stringify({ userId })
            });
            return response.content.toJSON();
        } catch (error) {
            console.error('Error leaving queue:', error);
            throw error;
        }
    }

    static async getUserProfile(userId: string) {
        try {
            const response = await Http.request({
                url: `${API_BASE_URL}/users/${userId}`,
                method: 'GET'
            });
            return response.content.toJSON();
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }
}