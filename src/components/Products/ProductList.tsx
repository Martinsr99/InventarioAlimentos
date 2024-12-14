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
  IonButton,
  IonIcon,
  RefresherEventDetail,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { checkboxOutline, trashBin, alertCircleOutline } from 'ionicons/icons';
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showDeleteExpiredConfirm, setShowDeleteExpiredConfirm] = useState(false);
  const [expiredCount, setExpiredCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
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
    deleteProducts,
    deleteExpiredProducts,
    getExpiredProductIds,
    filterAndSortProducts,
    checkFriends,
    sharedProducts
  } = useProductList(onRefreshNeeded);

  // Reset selection mode when changing view mode
  useEffect(() => {
    setSelectionMode(false);
    setSelectedProducts([]);
  }, [viewMode]);

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
      setErrorMessage(t('errors.productDelete'));
    }
    setProductToDelete(null);
  };

  const handleBatchDeleteConfirm = async () => {
    try {
      await deleteProducts(selectedProducts);
      setSelectedProducts([]);
      setSelectionMode(false);
      // Re-apply filters after deletion
      filterAndSortProducts({ viewMode, searchText, sortBy, sortDirection });
    } catch (error) {
      setShowToast(true);
      setErrorMessage(t('errors.productDelete'));
    }
    setShowBatchDeleteConfirm(false);
  };

  const handleDeleteExpiredClick = () => {
    const count = getExpiredProductIds().length;
    if (count > 0) {
      setExpiredCount(count);
      setShowDeleteExpiredConfirm(true);
    } else {
      setShowToast(true);
      setErrorMessage(t('products.noExpiredProducts'));
    }
  };

  const handleDeleteExpiredConfirm = async () => {
    try {
      await deleteExpiredProducts();
      // Re-apply filters after deletion
      filterAndSortProducts({ viewMode, searchText, sortBy, sortDirection });
    } catch (error) {
      setShowToast(true);
      setErrorMessage(t('errors.productDelete'));
    }
    setShowDeleteExpiredConfirm(false);
  };

  const handleEdit = (productId: string) => {
    history.push(`/edit-product/${productId}`);
  };

  const handleSelectProduct = (productId: string, selected: boolean) => {
    setSelectedProducts(prev => {
      if (selected) {
        return [...prev, productId];
      } else {
        return prev.filter(id => id !== productId);
      }
    });
  };

  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      setSelectedProducts([]);
    }
  };

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>
      
      <IonCard className="product-list-card">
        <IonCardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IonCardTitle>{t('products.title')}</IonCardTitle>
            <div>
              {viewMode === 'personal' && (
                <>
                  <IonButton
                    fill="clear"
                    onClick={handleDeleteExpiredClick}
                    color="danger"
                  >
                    <IonIcon slot="icon-only" icon={alertCircleOutline} />
                  </IonButton>
                  <IonButton
                    fill="clear"
                    onClick={toggleSelectionMode}
                  >
                    <IonIcon slot="icon-only" icon={checkboxOutline} />
                  </IonButton>
                  {selectionMode && selectedProducts.length > 0 && (
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => setShowBatchDeleteConfirm(true)}
                    >
                      <IonIcon slot="icon-only" icon={trashBin} />
                    </IonButton>
                  )}
                </>
              )}
            </div>
          </div>
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
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            selectionMode={selectionMode}
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

      <IonAlert
        isOpen={showBatchDeleteConfirm}
        onDidDismiss={() => setShowBatchDeleteConfirm(false)}
        header={t('products.confirmBatchDelete')}
        message={t('products.confirmBatchDeleteMessage', { count: selectedProducts.length })}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: t('common.delete'),
            handler: handleBatchDeleteConfirm
          }
        ]}
      />

      <IonAlert
        isOpen={showDeleteExpiredConfirm}
        onDidDismiss={() => setShowDeleteExpiredConfirm(false)}
        header={t('products.confirmDeleteExpired')}
        message={t('products.confirmDeleteExpiredMessage', { count: expiredCount })}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: t('common.delete'),
            handler: handleDeleteExpiredConfirm
          }
        ]}
      />

      <IonToast
        isOpen={showToast}
        message={errorMessage || error || ''}
        duration={3000}
        color="danger"
        onDidDismiss={() => {
          setShowToast(false);
          setErrorMessage('');
        }}
      />
    </>
  );
};

export default ProductList;
