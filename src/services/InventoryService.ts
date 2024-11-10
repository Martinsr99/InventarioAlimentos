import { db, auth } from '../firebaseConfig';
import { collection, addDoc, Timestamp ,query, where, getDocs, deleteDoc, doc, updateDoc} from 'firebase/firestore';

interface Product {
    name: string;
    expiryDate: Date;
    location: string;
}

interface ProductUpdate {
    name?: string;
    expiryDate?: Date;
    location?: string;
}

export const addProduct = async (product: Product) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        await addDoc(collection(db, 'products'), {
            ...product,
            expiryDate: Timestamp.fromDate(product.expiryDate),
            addedAt: Timestamp.now(),
            userId: user.uid
        });
        console.log('Product added successfully');
    } catch (error) {
        console.error('Error adding product:', error);
    }
};

export const getProducts = async (userId: string) => {
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

export const deleteProduct = async (productId: string) => {
    try {
        await deleteDoc(doc(db, 'products', productId));
        console.log('Product deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error);
    }
};

export const updateProduct = async (productId: string, updatedData: ProductUpdate) => {
    try {
        const productRef = doc(db, 'products', productId);
        const dataToUpdate: any = { ...updatedData };
        
        if (updatedData.expiryDate) {
            dataToUpdate.expiryDate = Timestamp.fromDate(updatedData.expiryDate);
        }
        
        await updateDoc(productRef, dataToUpdate);
        console.log('Product updated successfully');
    } catch (error) {
        console.error('Error updating product:', error);
    }
};