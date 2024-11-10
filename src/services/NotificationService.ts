import { LocalNotifications } from '@capacitor/local-notifications';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const scheduleExpiryNotifications = async () => {
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
