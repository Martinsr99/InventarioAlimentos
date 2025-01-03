import { LocalNotifications } from '@capacitor/local-notifications';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

const checkNotificationPermissions = async () => {
    if (!isNative) return true;

    try {
        // Check if permissions are already granted
        const { display } = await LocalNotifications.checkPermissions();
        
        if (display === 'granted') {
            return true;
        }

        // Request permissions if not granted
        const { display: newPermission } = await LocalNotifications.requestPermissions();
        return newPermission === 'granted';
    } catch (error) {
        console.error('Error checking notification permissions:', error);
        return false;
    }
};

export const scheduleExpiryNotifications = async () => {
    // Skip notification scheduling on web
    if (!isNative) {
        return;
    }

    // Check permissions first
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
        throw new Error('Notification permissions not granted');
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

    if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
    }
};

export const sendShareInvitationNotification = async (toUserId: string, fromUser: User, type: 'invitation' | 'accepted' = 'invitation') => {
    try {
        // Add notification to Firestore
        await addDoc(collection(db, 'notifications'), {
            type: type === 'invitation' ? 'share_invitation' : 'invitation_accepted',
            toUserId,
            fromUserId: fromUser.uid,
            fromUserEmail: fromUser.email,
            status: 'unread',
            createdAt: new Date().toISOString()
        });

        // Schedule local notification only on native platforms
        if (isNative) {
            const hasPermission = await checkNotificationPermissions();
            if (hasPermission) {
                await LocalNotifications.schedule({
                    notifications: [{
                        title: type === 'invitation' ? 'New Share Invitation' : 'Invitation Accepted',
                        body: type === 'invitation' 
                            ? `${fromUser.email} wants to share their products with you`
                            : `${fromUser.email} accepted your share invitation`,
                        id: Math.floor(Math.random() * 100000),
                        schedule: { at: new Date() }
                    }]
                });
            }
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
