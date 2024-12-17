import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

const ProductList: React.FC<ProductListProps> = React.memo(({ onRefreshNeeded, onOpenSettingsToShare }) => {
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

  useEffect(() => {
    setSelectionMode(false);
    setSelectedProducts([]);
  }, [viewMode]);

  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    setViewMode(newMode);
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSortByChange = useCallback((option: SortOption) => {
    setSortBy(option);
  }, []);

  const handleSortDirectionChange = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      if (viewMode === 'personal') {
        await loadProducts();
      } else {
        await loadSharedProducts();
        await checkFriends();
      }
    } finally {
      event.detail.complete();
    }
  }, [viewMode, loadProducts, loadSharedProducts, checkFriends]);

  const handleDeleteConfirm = useCallback(async (productId: string) => {
    try {
      await handleDelete(productId);
    } catch (error) {
      setShowToast(true);
      setErrorMessage(t('errors.productDelete'));
    }
    setProductToDelete(null);
  }, [handleDelete, t]);

  const handleBatchDeleteConfirm = useCallback(async () => {
    try {
      await deleteProducts(selectedProducts);
      setSelectedProducts([]);
      setSelectionMode(false);
    } catch (error) {
      setShowToast(true);
      setErrorMessage(t('errors.productDelete'));
    }
    setShowBatchDeleteConfirm(false);
  }, [deleteProducts, selectedProducts, t]);

  const handleDeleteExpiredClick = useCallback(() => {
    const count = getExpiredProductIds().length;
    if (count > 0) {
      setExpiredCount(count);
      setShowDeleteExpiredConfirm(true);
    } else {
      setShowToast(true);
      setErrorMessage(t('products.noExpiredProducts'));
    }
  }, [getExpiredProductIds, t]);

  const handleDeleteExpiredConfirm = useCallback(async () => {
    try {
      await deleteExpiredProducts();
    } catch (error) {
      setShowToast(true);
      setErrorMessage(t('errors.productDelete'));
    }
    setShowDeleteExpiredConfirm(false);
  }, [deleteExpiredProducts, t]);

  const handleEdit = useCallback((productId: string) => {
    history.push(`/edit-product/${productId}`);
  }, [history]);

  const handleSelectProduct = useCallback((productId: string, selected: boolean) => {
    setSelectedProducts(prev => {
      if (selected) {
        return [...prev, productId];
      } else {
        return prev.filter(id => id !== productId);
      }
    });
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      setSelectedProducts([]);
    }
  }, [selectionMode]);

  // Memoizar las opciones de filtro para evitar actualizaciones innecesarias
  const filterOptions = useMemo(() => ({
    viewMode,
    searchText,
    sortBy,
    sortDirection
  }), [viewMode, searchText, sortBy, sortDirection]);

  // Aplicar filtros solo cuando las opciones cambien
  useEffect(() => {
    filterAndSortProducts(filterOptions);
  }, [filterOptions]);

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
            onViewModeChange={handleViewModeChange}
            sharedProductsCount={sharedProducts.length}
          />

          <ProductListFilters
            searchText={searchText}
            onSearchChange={handleSearchChange}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            sortDirection={sortDirection}
            onSortDirectionChange={handleSortDirectionChange}
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
            navigateToFriends={onOpenSettingsToShare || (() => {})}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            selectionMode={selectionMode}
            onEnterSelectionMode={toggleSelectionMode}
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
});

ProductList.displayName = 'ProductList';

export default ProductList;
