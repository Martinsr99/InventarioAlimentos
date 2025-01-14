import { MessagePayload } from 'firebase/messaging';

export interface FirebaseMessage extends MessagePayload {
    notification?: {
        title?: string;
        body?: string;
        image?: string;
    };
    data?: {
        [key: string]: string;
    };
}
