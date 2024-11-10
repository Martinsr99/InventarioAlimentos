import React, { useEffect, useState } from 'react';
import { deleteProduct, updateProduct } from '../../services/InventoryService';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    IonList,
    IonSearchbar,
    IonGrid,
    IonRow,
    IonCol
} from '@ionic/react';

interface Product {
    id: string;
    name: string;
    expiryDate: {
        seconds: number;
    };
    location: string;
}

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState('all');

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('userId', '==', user.uid));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const updatedProducts = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                })) as Product[];
                setProducts(updatedProducts);
            });

            return () => unsubscribe();
        }
    }, []);

    const handleDelete = async (productId: string) => {
        await deleteProduct(productId);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
    };

    const handleUpdate = async () => {
        if (editingProduct) {
            await updateProduct(editingProduct.id, {
                name: editingProduct.name,
                expiryDate: new Date(editingProduct.expiryDate.seconds * 1000),
                location: editingProduct.location,
            });
            setEditingProduct(null);
        }
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = filterLocation === 'all' || product.location === filterLocation;
        return matchesSearch && matchesLocation;
    });

    return (
        <div className="ion-padding">
            <IonGrid>
                <IonRow>
                    <IonCol>
                        <h2>Inventory List</h2>
                    </IonCol>
                </IonRow>
                
                <IonRow>
                    <IonCol size="12" sizeMd="6">
                        <IonSearchbar
                            value={searchTerm}
                            onIonChange={e => setSearchTerm(e.detail.value!)}
                            placeholder="Search by name"
                        />
                    </IonCol>
                    <IonCol size="12" sizeMd="6">
                        <IonItem>
                            <IonLabel>Location</IonLabel>
                            <IonSelect
                                value={filterLocation}
                                onIonChange={e => setFilterLocation(e.detail.value)}
                            >
                                <IonSelectOption value="all">All Locations</IonSelectOption>
                                <IonSelectOption value="fridge">Fridge</IonSelectOption>
                                <IonSelectOption value="freezer">Freezer</IonSelectOption>
                            </IonSelect>
                        </IonItem>
                    </IonCol>
                </IonRow>

                <IonRow>
                    <IonCol>
                        <IonList>
                            {filteredProducts.map((product) => (
                                <IonCard key={product.id}>
                                    {editingProduct && editingProduct.id === product.id ? (
                                        <IonCardContent>
                                            <IonItem>
                                                <IonLabel position="stacked">Name</IonLabel>
                                                <IonInput
                                                    value={editingProduct.name}
                                                    placeholder="Product Name"
                                                    onIonChange={e =>
                                                        setEditingProduct({ ...editingProduct, name: e.detail.value! })
                                                    }
                                                />
                                            </IonItem>
                                            
                                            <IonItem>
                                                <IonLabel position="stacked">Expiry Date</IonLabel>
                                                <IonInput
                                                    type="date"
                                                    value={new Date(editingProduct.expiryDate.seconds * 1000)
                                                        .toISOString()
                                                        .split('T')[0]}
                                                    onIonChange={e =>
                                                        setEditingProduct({
                                                            ...editingProduct,
                                                            expiryDate: { seconds: new Date(e.detail.value!).getTime() / 1000 },
                                                        })
                                                    }
                                                />
                                            </IonItem>
                                            
                                            <IonItem>
                                                <IonLabel position="stacked">Location</IonLabel>
                                                <IonSelect
                                                    value={editingProduct.location}
                                                    onIonChange={e =>
                                                        setEditingProduct({ ...editingProduct, location: e.detail.value })
                                                    }
                                                >
                                                    <IonSelectOption value="fridge">Fridge</IonSelectOption>
                                                    <IonSelectOption value="freezer">Freezer</IonSelectOption>
                                                </IonSelect>
                                            </IonItem>
                                            
                                            <IonButton expand="block" onClick={handleUpdate} color="success">
                                                Save
                                            </IonButton>
                                            <IonButton expand="block" onClick={() => setEditingProduct(null)} color="medium">
                                                Cancel
                                            </IonButton>
                                        </IonCardContent>
                                    ) : (
                                        <>
                                            <IonCardHeader>
                                                <IonCardTitle>{product.name}</IonCardTitle>
                                            </IonCardHeader>
                                            <IonCardContent>
                                                <IonItem lines="none">
                                                    <IonLabel>
                                                        <p>Expiry Date: {new Date(product.expiryDate.seconds * 1000).toLocaleDateString()}</p>
                                                        <p>Location: {product.location}</p>
                                                    </IonLabel>
                                                </IonItem>
                                                <IonButton expand="block" onClick={() => handleEdit(product)} color="primary">
                                                    Edit
                                                </IonButton>
                                                <IonButton expand="block" onClick={() => handleDelete(product.id)} color="danger">
                                                    Delete
                                                </IonButton>
                                            </IonCardContent>
                                        </>
                                    )}
                                </IonCard>
                            ))}
                        </IonList>
                    </IonCol>
                </IonRow>
            </IonGrid>
        </div>
    );
};

export default ProductList;
