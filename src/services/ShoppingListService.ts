import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  Timestamp, 
  writeBatch,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { addUserProduct } from './UserProductsService';
import { searchPredefinedProducts } from './PredefinedProductsService';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  completed: boolean;
  userId: string;
  sharedWith?: string[];
  createdAt: Date | Timestamp;
}

interface FirestoreShoppingListItem extends Omit<ShoppingListItem, 'id' | 'createdAt'> {
  createdAt: Timestamp;
  sharedWith?: string[];
}

export class ShoppingListService {
  private static COLLECTION_NAME = 'shoppingList';

  static async addItem(
    item: Omit<ShoppingListItem, 'id' | 'userId' | 'createdAt'> & { sharedWith?: string[] }, 
    language: string
  ) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // Verificar si el producto ya existe en los predefinidos
      const predefinedProducts = await searchPredefinedProducts(item.name, language);
      const exactMatch = predefinedProducts.find(p => 
        p.name.toLowerCase() === item.name.toLowerCase()
      );

      // Si no existe en predefinidos y tiene categoría, guardarlo como producto personalizado sin idioma
      if (!exactMatch && item.category) {
        await addUserProduct({
          name: item.name,
          category: item.category
        });
      }

      // Ensure sharedWith is properly initialized
      const sharedWith = Array.isArray(item.sharedWith) ? item.sharedWith : [];

      // Guardar en la lista de compras
      const itemData: FirestoreShoppingListItem = {
        ...item,
        userId: user.uid,
        sharedWith,
        createdAt: Timestamp.fromDate(new Date()),
        completed: item.completed ?? false
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), itemData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding shopping list item:', error);
      throw error;
    }
  }

  static async deleteItem(itemId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const docRef = doc(db, this.COLLECTION_NAME, itemId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Item not found');
      }

      const itemData = docSnap.data();
      
      // Only allow deletion if user is owner or shared with
      if (itemData.userId !== user.uid && !(itemData.sharedWith || []).includes(user.uid)) {
        throw new Error('Permission denied');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting shopping list item:', error);
      throw error;
    }
  }

  // Alias para mantener consistencia con el nombre usado en el componente
  static deleteShoppingItem = ShoppingListService.deleteItem;

  static async updateItem(itemId: string, updates: Partial<ShoppingListItem>) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const docRef = doc(db, this.COLLECTION_NAME, itemId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Item not found');
      }

      const currentData = docSnap.data();
      const updateData = { ...updates };
      
      // Handle date conversion
      if (updates.createdAt && updates.createdAt instanceof Date) {
        updateData.createdAt = Timestamp.fromDate(updates.createdAt);
      }

      // Handle sharedWith array
      if ('sharedWith' in updates) {
        // Ensure it's an array and remove duplicates
        const newSharedWith = Array.isArray(updates.sharedWith) ? [...new Set(updates.sharedWith)] : [];
        
        // If the current user is not the owner, preserve their access
        if (currentData.userId !== user.uid && !newSharedWith.includes(user.uid)) {
          newSharedWith.push(user.uid);
        }
        
        updateData.sharedWith = newSharedWith;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating shopping list item:', error);
      throw error;
    }
  }

  static async toggleItemCompletion(itemId: string, completed: boolean) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const docRef = doc(db, this.COLLECTION_NAME, itemId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Item not found');
      }

      const itemData = docSnap.data();
      
      // Only allow toggling if user is owner or shared with
      if (itemData.userId !== user.uid && !(itemData.sharedWith || []).includes(user.uid)) {
        throw new Error('Permission denied');
      }

      await updateDoc(docRef, { completed });
    } catch (error) {
      console.error('Error toggling item completion:', error);
      throw error;
    }
  }

  static subscribeToUserItems(callback: (items: ShoppingListItem[]) => void) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Create queries for both owned and shared items
    const itemsQuery = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', user.uid)
    );

    const sharedItemsQuery = query(
      collection(db, this.COLLECTION_NAME),
      where('sharedWith', 'array-contains', user.uid)
    );

    let unsubscribeShared: (() => void) | null = null;
    let ownedItems: ShoppingListItem[] = [];
    let sharedItems: ShoppingListItem[] = [];

    // Set up listener for owned items
    const unsubscribeOwned = onSnapshot(itemsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
      ownedItems = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreShoppingListItem;
        return {
          id: doc.id,
          name: data.name,
          quantity: data.quantity,
          category: data.category,
          completed: data.completed ?? false,
          userId: data.userId,
          sharedWith: data.sharedWith || [],
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      callback([...ownedItems, ...sharedItems]);
    });

    // Set up listener for shared items
    unsubscribeShared = onSnapshot(sharedItemsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
      sharedItems = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreShoppingListItem;
        return {
          id: doc.id,
          name: data.name,
          quantity: data.quantity,
          category: data.category,
          completed: data.completed ?? false,
          userId: data.userId,
          sharedWith: data.sharedWith || [],
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      callback([...ownedItems, ...sharedItems]);
    });

    // Return cleanup function for both listeners
    return () => {
      unsubscribeOwned();
      if (unsubscribeShared) {
        unsubscribeShared();
      }
    };
  }

  static async deleteCompletedItems() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // Only delete completed items that the user owns
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', user.uid),
        where('completed', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      // Use a batch write for atomic operation
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      if (querySnapshot.docs.length > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error deleting completed items:', error);
      throw error;
    }
  }
}
