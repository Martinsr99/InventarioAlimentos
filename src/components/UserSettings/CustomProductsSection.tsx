import React, { useEffect, useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonList,
  IonButton,
  IonIcon,
  IonSpinner,
  IonSearchbar,
  IonToolbar,
  IonButtons,
  IonAlert,
} from '@ionic/react';
import { trash, chevronDown, chevronUp, arrowUp, arrowDown } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUserProducts, deleteUserProduct } from '../../services/UserProductsService';
import './CustomProductsSection.css';

interface CustomProduct {
  name: string;
  category: string;
}

type SortDirection = 'asc' | 'desc';

const CustomProductsSection: React.FC = () => {
  const [products, setProducts] = useState<CustomProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
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

  const confirmDelete = (productName: string) => {
    setProductToDelete(productName);
  };

  const handleDelete = async () => {
    if (productToDelete) {
      try {
        await deleteUserProduct(productToDelete);
        await loadProducts(); // Recargar la lista después de eliminar
      } catch (error) {
        console.error('Error deleting custom product:', error);
      }
      setProductToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <IonSpinner />
      </div>
    );
  }

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const filteredAndSortedProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="custom-products-section">
      <div className="section-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => setIsExpanded(!isExpanded)}>
              <IonIcon icon={isExpanded ? chevronUp : chevronDown} />
            </IonButton>
          </IonButtons>
          <h2>{t('settings.customProducts')}</h2>
          {isExpanded && (
            <IonButtons slot="end">
              <IonButton onClick={toggleSort} className="sort-button">
                <span className="sort-label">{t(`settings.${sortDirection === 'asc' ? 'sortAscending' : 'sortDescending'}`)}</span>
                <IonIcon icon={sortDirection === 'asc' ? arrowUp : arrowDown} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </div>

      {isExpanded && (
        <>
          <IonSearchbar
            value={searchText}
            onIonInput={e => setSearchText(e.detail.value || '')}
            placeholder={t('settings.searchProducts')}
            className="custom-products-searchbar"
          />

          {filteredAndSortedProducts.length === 0 ? (
            <p>{searchText ? t('common.noResults') : t('settings.noCustomProducts')}</p>
          ) : (
            <IonList>
              {filteredAndSortedProducts.map((product, index) => (
                <IonItem key={index}>
                  <IonLabel>
                    <h2>{product.name}</h2>
                    <p>{t(`categories.${product.category}`)}</p>
                  </IonLabel>
                  <IonButton 
                    slot="end" 
                    fill="clear" 
                    color="danger"
                    onClick={() => confirmDelete(product.name)}
                  >
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          )}
        </>
      )}

      <IonAlert
        isOpen={!!productToDelete}
        onDidDismiss={() => setProductToDelete(null)}
        header={t('settings.deleteCustomProduct')}
        message={t('settings.deleteCustomProductConfirm')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
            handler: () => setProductToDelete(null)
          },
          {
            text: t('common.delete'),
            role: 'destructive',
            handler: handleDelete
          }
        ]}
      />
    </div>
  );
};

export default CustomProductsSection;
