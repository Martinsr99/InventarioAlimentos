import React, { useEffect, useState } from 'react';
import {
  IonList,
  IonSpinner,
  IonText,
  IonAlert,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import { deleteProduct, getProducts, Product } from '../../services/InventoryService';
import { getSharedProducts } from '../../services/SharedProductsService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useHistory } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import ProductListItem from './ProductListItem';
import ProductListFilters from './ProductListFilters';
import ProductListHeader from './ProductListHeader';
import './ProductList.css';

interface ProductListProps {
  onRefreshNeeded?: () => void;
}

type SortOption = 'name' | 'expiryDate';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'personal' | 'shared';

interface ExtendedProduct extends Product {
  sharedBy?: string;
  isOwner?: boolean;
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

    if (searchText) {
      const searchLower = searchText.toLowerCase().trim();
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchLower)
      );
    }

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
        {filteredProducts.map(product => (
          <ProductListItem
            key={product.id}
            product={product}
            viewMode={viewMode}
            onEdit={handleEdit}
            onDelete={setProductToDelete}
          />
        ))}
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
          <ProductListHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sharedProductsCount={sharedProducts.length}
          />

          <ProductListFilters
            searchText={searchText}
            onSearchChange={setSearchText}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortDirection={sortDirection}
            onSortDirectionChange={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          />

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
