import React, { useEffect, useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonText,
  IonAlert,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle
} from '@ionic/react';
import { trash, create } from 'ionicons/icons';
import { deleteProduct, getProducts, Product } from '../../services/InventoryService';
import { useLanguage } from '../../contexts/LanguageContext';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      setError(t('errors.productLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      setError(t('errors.productDelete'));
    }
    setProductToDelete(null);
  };

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryText = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return t('products.expired');
    }
    if (daysUntilExpiry === 0) {
      return t('products.today');
    }
    if (daysUntilExpiry === 1) {
      return t('products.tomorrow');
    }
    return `${daysUntilExpiry} ${t('products.days')}`;
  };

  if (loading) {
    return (
      <div className="ion-text-center ion-padding">
        <IonSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ion-text-center ion-padding">
        <IonText color="danger">{error}</IonText>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('products.title')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="ion-text-center">
            <IonText color="medium">
              <p>{t('products.noProducts')}</p>
              <p>{t('products.addFirst')}</p>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('products.title')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {products.map(product => {
              const daysUntilExpiry = calculateDaysUntilExpiry(product.expiryDate);
              const expiryText = getExpiryText(daysUntilExpiry);
              const isExpired = daysUntilExpiry < 0;

              return (
                <IonItem key={product.id}>
                  <IonLabel>
                    <h2>{product.name}</h2>
                    <p>{t('categories.' + product.category.toLowerCase())}</p>
                    <p>
                      {t('products.expiresIn')}: 
                      <IonText color={isExpired ? 'danger' : daysUntilExpiry <= 3 ? 'warning' : 'medium'}>
                        {' '}{expiryText}
                      </IonText>
                    </p>
                    {product.notes && <p>{product.notes}</p>}
                  </IonLabel>
                  <IonButton 
                    fill="clear" 
                    slot="end"
                    onClick={() => setProductToDelete(product.id)}
                  >
                    <IonIcon icon={trash} slot="icon-only" />
                  </IonButton>
                  <IonButton 
                    fill="clear" 
                    slot="end"
                    routerLink={`/edit-product/${product.id}`}
                  >
                    <IonIcon icon={create} slot="icon-only" />
                  </IonButton>
                </IonItem>
              );
            })}
          </IonList>
        </IonCardContent>
      </IonCard>

      <IonAlert
        isOpen={!!productToDelete}
        onDidDismiss={() => setProductToDelete(null)}
        header={t('products.confirmDelete')}
        message={t('products.confirmDeleteMessage')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: t('common.delete'),
            handler: () => {
              if (productToDelete) {
                handleDelete(productToDelete);
              }
            }
          }
        ]}
      />
    </>
  );
};

export default ProductList;
