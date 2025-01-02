import { db, auth } from '../firebaseConfig';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  completed: boolean;
  userId: string;
  createdAt: Date | Timestamp;
}

interface FirestoreShoppingListItem extends Omit<ShoppingListItem, 'id' | 'createdAt'> {
  createdAt: Timestamp;
}

export class ShoppingListService {
  private static COLLECTION_NAME = 'shoppingList';

  static async addItem(item: Omit<ShoppingListItem, 'id' | 'userId' | 'createdAt'>) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const itemData: FirestoreShoppingListItem = {
      ...item,
      userId: user.uid,
      createdAt: Timestamp.fromDate(new Date()),
      completed: false
    };

    const docRef = await addDoc(collection(db, this.COLLECTION_NAME), itemData);
    return docRef.id;
  }

  static async deleteItem(itemId: string) {
    await deleteDoc(doc(db, this.COLLECTION_NAME, itemId));
  }

  // Alias para mantener consistencia con el nombre usado en el componente
  static deleteShoppingItem = ShoppingListService.deleteItem;

  static async updateItem(itemId: string, updates: Partial<ShoppingListItem>) {
    const updateData = { ...updates };
    if (updates.createdAt && updates.createdAt instanceof Date) {
      updateData.createdAt = Timestamp.fromDate(updates.createdAt);
    }
    await updateDoc(doc(db, this.COLLECTION_NAME, itemId), updateData);
  }

  static async toggleItemCompletion(itemId: string, completed: boolean) {
    await updateDoc(doc(db, this.COLLECTION_NAME, itemId), { completed });
  }

  static async getUserItems() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreShoppingListItem;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as ShoppingListItem;
    });
  }

  static async deleteCompletedItems() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', user.uid),
      where('completed', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }
}
