import { db, auth } from '../firebaseConfig';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
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

      // Guardar en la lista de compras
      const itemData: FirestoreShoppingListItem = {
        ...item,
        userId: user.uid,
        sharedWith: item.sharedWith || [],
        createdAt: Timestamp.fromDate(new Date()),
        completed: false
      };

      console.log('Adding shopping list item:', itemData);
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), itemData);
      console.log('Added shopping list item with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding shopping list item:', error);
      throw error;
    }
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

    try {
      console.log('Getting shopping list items for user:', user.uid);
      
      // Get items where user is owner or shared with
      const [ownedItems, sharedItems] = await Promise.all([
        getDocs(query(
          collection(db, this.COLLECTION_NAME),
          where('userId', '==', user.uid)
        )),
        getDocs(query(
          collection(db, this.COLLECTION_NAME),
          where('sharedWith', 'array-contains', user.uid)
        ))
      ]);

      console.log('Owned items:', ownedItems.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      console.log('Shared items:', sharedItems.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const allItems = [...ownedItems.docs, ...sharedItems.docs];
      const mappedItems = allItems.map(doc => {
        const data = doc.data() as FirestoreShoppingListItem;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          sharedWith: data.sharedWith || []
        } as ShoppingListItem;
      });

      console.log('Mapped items:', mappedItems);
      return mappedItems;
    } catch (error) {
      console.error('Error getting shopping list items:', error);
      throw error;
    }
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
