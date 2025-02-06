import { ApiService } from './api.service';
import { LocalNotifications } from '@nativescript/local-notifications';
import { Observable } from '@nativescript/core';

export class QueueService extends Observable {
    private static instance: QueueService;
    private _activeQueues: Map<string, QueueInfo> = new Map();
    private updateInterval: number;

    private constructor() {
        super();
        this.setupNotifications();
        this.startQueueUpdates();
    }

    static getInstance(): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }

    get activeQueues(): QueueInfo[] {
        return Array.from(this._activeQueues.values());
    }

    async joinQueue(stallId: string, userId: string): Promise<QueueInfo> {
        try {
            const queueInfo = await ApiService.joinQueue(stallId, userId);
            this._activeQueues.set(queueInfo.queueId, queueInfo);
            this.notifyPropertyChange('activeQueues', this.activeQueues);
            
            // Schedule notifications
            this.scheduleQueueNotifications(queueInfo);
            
            return queueInfo;
        } catch (error) {
            console.error('Error joining queue:', error);
            throw error;
        }
    }

    async leaveQueue(queueId: string, userId: string): Promise<void> {
        try {
            await ApiService.leaveQueue(queueId, userId);
            this._activeQueues.delete(queueId);
            this.notifyPropertyChange('activeQueues', this.activeQueues);
            
            // Cancel related notifications
            await LocalNotifications.cancel(parseInt(queueId));
        } catch (error) {
            console.error('Error leaving queue:', error);
            throw error;
        }
    }

    private async setupNotifications() {
        try {
            const hasPermission = await LocalNotifications.requestPermission();
            if (hasPermission) {
                LocalNotifications.addOnMessageReceivedCallback(notification => {
                    console.log('Queue notification received:', notification);
                });
            }
        } catch (error) {
            console.error('Error setting up notifications:', error);
        }
    }

    private scheduleQueueNotifications(queueInfo: QueueInfo) {
        const estimatedMinutes = parseInt(queueInfo.estimatedTime);
        if (isNaN(estimatedMinutes)) return;

        // Notify when 5 minutes away
        if (estimatedMinutes > 5) {
            LocalNotifications.schedule([{
                id: parseInt(queueInfo.queueId),
                title: 'Almost Your Turn!',
                body: `Your queue at ${queueInfo.stallName} will be ready in about 5 minutes`,
                at: new Date(Date.now() + (estimatedMinutes - 5) * 60000)
            }]);
        }

        // Notify when it's your turn
        LocalNotifications.schedule([{
            id: parseInt(queueInfo.queueId) + 1000,
            title: 'Your Turn!',
            body: `It's your turn at ${queueInfo.stallName}`,
            at: new Date(Date.now() + estimatedMinutes * 60000)
        }]);
    }

    private startQueueUpdates() {
        this.updateInterval = setInterval(async () => {
            for (const [queueId, queueInfo] of this._activeQueues) {
                try {
                    const updatedInfo = await ApiService.getQueueStatus(queueInfo.userId);
                    if (updatedInfo) {
                        this._activeQueues.set(queueId, updatedInfo);
                        this.notifyPropertyChange('activeQueues', this.activeQueues);
                    }
                } catch (error) {
                    console.error('Error updating queue status:', error);
                }
            }
        }, 30000); // Update every 30 seconds
    }

    stopQueueUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

export interface QueueInfo {
    queueId: string;
    stallId: string;
    stallName: string;
    hawkerCenter: string;
    queueNumber: string;
    userId: string;
    estimatedTime: string;
    peopleAhead: number;
    progress: number;
}