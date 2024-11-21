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
  IonToolbar,
  IonBadge,
  IonToast,
  IonChip
} from '@ionic/react';
import { 
  trash, 
  create, 
  calendar,
  arrowUp,
  arrowDown,
  text,
  time,
  peopleOutline,
  personOutline,
  personCircleOutline
} from 'ionicons/icons';
import { deleteProduct, getProducts, Product } from '../../services/InventoryService';
import { getSharedProducts } from '../../services/SharedProductsService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHistory } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import './ProductList.css';

interface ProductListProps {
  onRefreshNeeded?: () => void;
}

type SortOption = 'name' | 'expiryDate';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'personal' | 'shared';

interface ExtendedProduct extends Product {
  sharedBy?: string;
}

const ProductList: React.FC<ProductListProps> = ({ onRefreshNeeded }) => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [sharedProducts, setSharedProducts] = useState<ExtendedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);
  const [error, setError] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('expiryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const [showToast, setShowToast] = useState(false);
  const { t } = useLanguage();
  const history = useHistory();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (viewMode === 'shared') {
      loadSharedProducts();
    }
  }, [viewMode]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, sharedProducts, searchText, sortBy, sortDirection, viewMode]);

  const loadProducts = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const personalProducts = await getProducts();
      setProducts(personalProducts);
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError(t('errors.productLoad'));
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedProducts = async () => {
    if (!auth.currentUser) return;

    setLoadingShared(true);
    try {
      const shared = await getSharedProducts(auth.currentUser);
      setSharedProducts(shared);
    } catch (error) {
      console.error('Error loading shared products:', error);
      setError(t('errors.productLoad'));
      setShowToast(true);
    } finally {
      setLoadingShared(false);
    }
  };

  const filterAndSortProducts = () => {
    let result = viewMode === 'personal' ? [...products] : [...sharedProducts];

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
      if (viewMode === 'personal') {
        await loadProducts();
      } else {
        await loadSharedProducts();
      }
    } finally {
      event.detail.complete();
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(t('errors.productDelete'));
      setShowToast(true);
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

  const renderContent = () => {
    if (loading || (loadingShared && viewMode === 'shared')) {
      return (
        <div className="loading-spinner">
          <IonSpinner />
        </div>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <div className="empty-state">
          <IonText color="medium">
            <p>
              {searchText 
                ? t('products.noSearchResults')
                : viewMode === 'shared'
                  ? t('sharing.noSharedProducts')
                  : t('products.noProducts')
              }
            </p>
            {!searchText && viewMode === 'personal' && <p>{t('products.addFirst')}</p>}
          </IonText>
        </div>
      );
    }

    return (
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
                {viewMode === 'shared' && product.sharedBy && (
                  <IonChip color="primary">
                    <IonIcon icon={personCircleOutline} />
                    <IonLabel>{product.sharedBy}</IonLabel>
                  </IonChip>
                )}
              </IonLabel>
              {viewMode === 'personal' && (
                <>
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
                </>
              )}
            </IonItem>
          );
        })}
      </IonList>
    );
  };

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
          <IonSegment 
            value={viewMode}
            onIonChange={e => setViewMode(e.detail.value as ViewMode)}
            className="view-mode-segment"
          >
            <IonSegmentButton value="personal">
              <IonIcon icon={personOutline} />
              <IonLabel>{t('products.title')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="shared">
              <IonIcon icon={peopleOutline} />
              <IonLabel>{t('sharing.sharedProducts')}</IonLabel>
              {sharedProducts.length > 0 && (
                <IonBadge color="primary">{sharedProducts.length}</IonBadge>
              )}
            </IonSegmentButton>
          </IonSegment>

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

          {renderContent()}
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

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={error}
        duration={3000}
        color="danger"
      />
    </>
  );
};

export default ProductList;
