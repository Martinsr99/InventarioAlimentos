import { LocalNotifications } from '@capacitor/local-notifications';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const scheduleExpiryNotifications = async () => {
    // Skip notification scheduling on web
    if (!isNative) {
        return;
    }

    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('expiryDate', '<=', threeDaysFromNow));
    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map((doc) => {
        const product = doc.data();
        return {
            title: 'Expiry Reminder',
            body: `Your product ${product.name} is expiring soon!`,
            id: parseInt(doc.id.slice(-6), 36), 
            schedule: { at: new Date(product.expiryDate.seconds * 1000) }
        };
    });

    await LocalNotifications.schedule({ notifications });
};

export const sendShareInvitationNotification = async (toUserId: string, fromUser: User) => {
    try {
        // Add notification to Firestore
        await addDoc(collection(db, 'notifications'), {
            type: 'share_invitation',
            toUserId,
            fromUserId: fromUser.uid,
            fromUserEmail: fromUser.email,
            status: 'unread',
            createdAt: new Date().toISOString()
        });

        // Schedule local notification only on native platforms
        if (isNative) {
            await LocalNotifications.schedule({
                notifications: [{
                    title: 'New Share Invitation',
                    body: `${fromUser.email} wants to share their products with you`,
                    id: Math.floor(Math.random() * 100000),
                    schedule: { at: new Date() }
                }]
            });
        }

        // Add email notification to queue in Firestore
        await addDoc(collection(db, 'mail'), {
            to: fromUser.email,
            template: {
                name: 'share-invitation',
                data: {
                    fromEmail: fromUser.email
                }
            }
        });
    } catch (error) {
        console.error('Error sending share invitation notification:', error);
        throw error;
    }
};

export const markNotificationAsRead = async (notificationId: string) => {
    try {
        const notificationRef = collection(db, 'notifications');
        await addDoc(notificationRef, {
            status: 'read',
            readAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const getUnreadNotifications = async (userId: string) => {
    try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('toUserId', '==', userId),
            where('status', '==', 'unread')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting unread notifications:', error);
        return [];
    }
};
