import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
} from '@ionic/react';
import { getProducts } from '../../../services/InventoryService';
import { getAcceptedShareUsers } from '../../../services/SharedProductsService';
import { useLanguage } from '../../../contexts/LanguageContext';
import { auth } from '../../../firebaseConfig';
import EditProductForm from './EditProductForm';
import { ProductCategory, ProductLocation } from '../../../constants/productConstants';

interface ProductData {
  name: string;
  expiryDate: string;
  quantity: number;
  category?: ProductCategory;
  location: ProductLocation;
  notes?: string;
  sharedWith?: string[];
}

interface EditProductProps {
  onProductUpdated?: () => void;
}

const EditProduct: React.FC<EditProductProps> = ({ onProductUpdated }) => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [sharedUsers, setSharedUsers] = useState<{ userId: string; email: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) {
        history.replace('/');
        return;
      }

      try {
        const [products, users] = await Promise.all([
          getProducts(),
          getAcceptedShareUsers(auth.currentUser)
        ]);

        const product = products.find(p => p.id === id);
        if (product) {
          setProductData({
            name: product.name,
            expiryDate: product.expiryDate,
            quantity: product.quantity,
            category: product.category as ProductCategory | undefined,
            location: product.location as ProductLocation,
            notes: product.notes,
            sharedWith: product.sharedWith,
          });
          setSharedUsers(users);
        } else {
          history.replace('/');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        history.replace('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, history]);

  const handleSuccess = () => {
    if (onProductUpdated) {
      onProductUpdated();
    }
    setTimeout(() => {
      history.replace('/');
    }, 1000);
  };

  if (isLoading || !productData) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" />
            </IonButtons>
            <IonTitle>{t('products.edit')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-spinner">
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>{t('products.edit')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <EditProductForm
          productId={id}
          initialData={productData}
          sharedUsers={sharedUsers}
          onSuccess={handleSuccess}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProduct;
