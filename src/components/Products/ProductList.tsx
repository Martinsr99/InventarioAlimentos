import React, { useEffect, useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useProductList, SortOption, SortDirection, ViewMode } from '../../hooks/useProductList';
import ProductListHeader from './ProductListHeader';
import ProductListFilters from './ProductListFilters';
import ProductListContent from './ProductListContent';
import { auth } from '../../firebaseConfig';
import './ProductList.css';

interface ProductListProps {
  onRefreshNeeded?: () => void;
  onOpenSettingsToShare?: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ onRefreshNeeded, onOpenSettingsToShare }) => {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('expiryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  const { t } = useLanguage();
  const history = useHistory();

  const {
    filteredProducts,
    loading,
    loadingShared,
    error,
    hasFriends,
    loadProducts,
    loadSharedProducts,
    handleDelete,
    filterAndSortProducts,
    checkFriends,
    sharedProducts
  } = useProductList(onRefreshNeeded);

  // Initial load - now depends on auth.currentUser
  useEffect(() => {
    if (auth.currentUser) {
      loadProducts();
      checkFriends();
      // Initialize filters
      filterAndSortProducts({ viewMode, searchText, sortBy, sortDirection });
    }
  }, [auth.currentUser]); // Add auth.currentUser as dependency

  // Handle view mode changes
  useEffect(() => {
    if (viewMode === 'shared') {
      loadSharedProducts();
    }
    filterAndSortProducts({ viewMode, searchText, sortBy, sortDirection });
  }, [viewMode]);

  // Handle filter changes
  useEffect(() => {
    filterAndSortProducts({ viewMode, searchText, sortBy, sortDirection });
  }, [searchText, sortBy, sortDirection]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      if (viewMode === 'personal') {
        await loadProducts();
      } else {
        await loadSharedProducts();
        await checkFriends();
      }
      // Re-apply filters after refresh
      filterAndSortProducts({ viewMode, searchText, sortBy, sortDirection });
    } finally {
      event.detail.complete();
    }
  };

  const handleDeleteConfirm = async (productId: string) => {
    try {
      await handleDelete(productId);
      // Re-apply filters after deletion
      filterAndSortProducts({ viewMode, searchText, sortBy, sortDirection });
    } catch (error) {
      setShowToast(true);
    }
    setProductToDelete(null);
  };

  const handleEdit = (productId: string) => {
    history.push(`/edit-product/${productId}`);
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

          <ProductListContent
            loading={loading}
            loadingShared={loadingShared}
            viewMode={viewMode}
            filteredProducts={filteredProducts}
            searchText={searchText}
            hasFriends={hasFriends}
            onEdit={handleEdit}
            onDelete={setProductToDelete}
            navigateToFriends={() => onOpenSettingsToShare?.()}
          />
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
                handleDeleteConfirm(productToDelete);
              }
            }
          }
        ]}
      />

      <IonToast
        isOpen={showToast}
        message={error || ''}
        duration={3000}
        color="danger"
        onDidDismiss={() => setShowToast(false)}
      />
    </>
  );
};

export default ProductList;
