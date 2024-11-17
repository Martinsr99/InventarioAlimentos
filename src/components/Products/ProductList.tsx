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
  IonCardTitle,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonToolbar
} from '@ionic/react';
import { 
  trash, 
  create, 
  calendar,
  arrowUp,
  arrowDown,
  text,
  time
} from 'ionicons/icons';
import { deleteProduct, getProducts, Product } from '../../services/InventoryService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHistory } from 'react-router-dom';
import './ProductList.css';

interface ProductListProps {
  onRefreshNeeded?: () => void;
}

type SortOption = 'name' | 'expiryDate';
type SortDirection = 'asc' | 'desc';

const ProductList: React.FC<ProductListProps> = ({ onRefreshNeeded }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('expiryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { t } = useLanguage();
  const history = useHistory();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchText, sortBy, sortDirection]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    } catch (error) {
      setError(t('errors.productLoad'));
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let result = [...products];

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase().trim();
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const dateA = new Date(a.expiryDate).getTime();
        const dateB = new Date(b.expiryDate).getTime();
        return sortDirection === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }
    });

    setFilteredProducts(result);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await loadProducts();
    } finally {
      event.detail.complete();
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      setError(t('errors.productDelete'));
    }
    setProductToDelete(null);
  };

  const handleEdit = (productId: string) => {
    history.push(`/edit-product/${productId}`);
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
      <div className="loading-spinner">
        <IonSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <IonText color="danger">{error}</IonText>
      </div>
    );
  }

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>
      
      <IonCard className="product-list-card">
        <IonCardHeader>
          <IonCardTitle>{t('products.title')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="filters-container">
            <IonSearchbar
              value={searchText}
              onIonInput={e => setSearchText(e.detail.value || '')}
              placeholder={t('products.searchPlaceholder')}
              className="product-searchbar"
              debounce={0}
              animated={false}
            />
            <div className="sort-controls">
              <IonSegment 
                value={sortBy} 
                onIonChange={e => setSortBy(e.detail.value as SortOption)}
                className="sort-segment"
              >
                <IonSegmentButton value="name" className="sort-segment-button">
                  <IonIcon icon={text} />
                  <IonLabel>{t('products.sortByName')}</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="expiryDate" className="sort-segment-button">
                  <IonIcon icon={time} />
                  <IonLabel>{t('products.sortByExpiry')}</IonLabel>
                </IonSegmentButton>
              </IonSegment>
              <IonButton
                fill="clear"
                className="sort-direction-button"
                onClick={toggleSortDirection}
              >
                <IonIcon icon={sortDirection === 'asc' ? arrowUp : arrowDown} />
              </IonButton>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <IonText color="medium">
                <p>{searchText ? t('products.noSearchResults') : t('products.noProducts')}</p>
                {!searchText && <p>{t('products.addFirst')}</p>}
              </IonText>
            </div>
          ) : (
            <IonList>
              {filteredProducts.map(product => {
                const daysUntilExpiry = calculateDaysUntilExpiry(product.expiryDate);
                const expiryText = getExpiryText(daysUntilExpiry);
                const isExpired = daysUntilExpiry < 0;
                const isNearExpiry = daysUntilExpiry <= 3 && daysUntilExpiry >= 0;

                return (
                  <IonItem key={product.id}>
                    <IonLabel>
                      <h2>{product.name}</h2>
                      {product.category && (
                        <div className="category-tag">
                          {t(`categories.${product.category.toLowerCase()}`)}
                        </div>
                      )}
                      <div className="expiry-text">
                        <IonIcon icon={calendar} color={isExpired ? 'danger' : isNearExpiry ? 'warning' : 'medium'} />
                        <IonText color={isExpired ? 'danger' : isNearExpiry ? 'warning' : 'medium'}>
                          {expiryText}
                        </IonText>
                      </div>
                      {product.notes && product.notes.trim() !== '' && (
                        <p className="notes-text">{product.notes}</p>
                      )}
                    </IonLabel>
                    <IonButton 
                      fill="clear" 
                      slot="end"
                      onClick={() => handleEdit(product.id)}
                      color="primary"
                    >
                      <IonIcon icon={create} slot="icon-only" />
                    </IonButton>
                    <IonButton 
                      fill="clear" 
                      slot="end"
                      onClick={() => setProductToDelete(product.id)}
                      color="danger"
                    >
                      <IonIcon icon={trash} slot="icon-only" />
                    </IonButton>
                  </IonItem>
                );
              })}
            </IonList>
          )}
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
