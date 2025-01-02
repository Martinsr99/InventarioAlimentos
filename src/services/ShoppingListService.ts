import { db, auth } from '../firebaseConfig';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
}

export class ShoppingListService {
  private static COLLECTION_NAME = 'shoppingList';

  static async addItem(item: Omit<ShoppingListItem, 'id' | 'userId' | 'createdAt'>) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const itemData = {
      ...item,
      userId: user.uid,
      createdAt: new Date(),
      completed: false
    };

    const docRef = await addDoc(collection(db, this.COLLECTION_NAME), itemData);
    return docRef.id;
  }

  static async deleteItem(itemId: string) {
    await deleteDoc(doc(db, this.COLLECTION_NAME, itemId));
  }

  static async updateItem(itemId: string, updates: Partial<ShoppingListItem>) {
    await updateDoc(doc(db, this.COLLECTION_NAME, itemId), updates);
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
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ShoppingListItem[];
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
