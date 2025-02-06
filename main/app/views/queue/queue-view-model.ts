import { Observable } from '@nativescript/core';
import { QueueService, QueueInfo } from '../../services/queue.service';

export class QueueViewModel extends Observable {
    private queueService: QueueService;
    private _activeQueues: Array<QueueInfo>;
    private _activeQueuesMessage: string;
    private readonly userId = 'current-user-id'; // Replace with actual user ID from auth

    constructor() {
        super();
        this.queueService = QueueService.getInstance();
        this.setupQueueBindings();
        this.loadActiveQueues();
    }

    get activeQueues(): Array<QueueInfo> {
        return this._activeQueues;
    }

    get activeQueuesMessage(): string {
        return this._activeQueuesMessage;
    }

    private setupQueueBindings() {
        this.queueService.on(Observable.propertyChangeEvent, (propertyChangeData: any) => {
            if (propertyChangeData.propertyName === 'activeQueues') {
                this._activeQueues = propertyChangeData.value;
                this._activeQueuesMessage = this._activeQueues.length > 0 
                    ? "You are currently in queue at the following stalls:"
                    : "You are not in any queues at the moment.";
                
                this.notifyPropertyChange('activeQueues', this._activeQueues);
                this.notifyPropertyChange('activeQueuesMessage', this._activeQueuesMessage);
            }
        });
    }

    private loadActiveQueues() {
        this._activeQueues = this.queueService.activeQueues;
        this._activeQueuesMessage = this._activeQueues.length > 0 
            ? "You are currently in queue at the following stalls:"
            : "You are not in any queues at the moment.";
            
        this.notifyPropertyChange('activeQueues', this._activeQueues);
        this.notifyPropertyChange('activeQueuesMessage', this._activeQueuesMessage);
    }

    async joinQueue(stallId: string) {
        try {
            await this.queueService.joinQueue(stallId, this.userId);
        } catch (error) {
            console.error('Error joining queue:', error);
            // Handle error (show alert, etc.)
        }
    }

    async leaveQueue(queueId: string) {
        try {
            await this.queueService.leaveQueue(queueId, this.userId);
        } catch (error) {
            console.error('Error leaving queue:', error);
            // Handle error (show alert, etc.)
        }
    }
}