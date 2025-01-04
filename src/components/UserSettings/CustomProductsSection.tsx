import React, { useEffect, useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonList,
  IonButton,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSpinner,
} from '@ionic/react';
import { trash } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUserProducts, deleteUserProduct } from '../../services/UserProductsService';
import './CustomProductsSection.css';

interface CustomProduct {
  name: string;
  category: string;
}

const CustomProductsSection: React.FC = () => {
  const [products, setProducts] = useState<CustomProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  const loadProducts = async () => {
    try {
      const userProducts = await getUserProducts();
      setProducts(userProducts);
    } catch (error) {
      console.error('Error loading custom products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [t]);

  const handleDelete = async (productName: string) => {
    try {
      await deleteUserProduct(productName);
      await loadProducts(); // Recargar la lista después de eliminar
    } catch (error) {
      console.error('Error deleting custom product:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <IonSpinner />
      </div>
    );
  }

  return (
    <div className="custom-products-section">
      <h2>{t('settings.customProducts')}</h2>
      {products.length === 0 ? (
        <p>{t('settings.noCustomProducts')}</p>
      ) : (
        <IonList>
          {products.map((product, index) => (
            <IonItemSliding key={index}>
              <IonItem>
                <IonLabel>
                  <h2>{product.name}</h2>
                  <p>{t(`categories.${product.category}`)}</p>
                </IonLabel>
              </IonItem>
              <IonItemOptions side="end">
                <IonItemOption color="danger" onClick={() => handleDelete(product.name)}>
                  <IonIcon slot="icon-only" icon={trash} />
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>
      )}
    </div>
  );
};

export default CustomProductsSection;
