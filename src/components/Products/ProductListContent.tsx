import React, { useCallback } from 'react';
import {
  IonSpinner,
  IonText,
  IonButton,
} from '@ionic/react';
import { ExtendedProduct, ViewMode } from '../../hooks/useProductList';
import ProductListItem from './ProductListItem';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProductListContentProps {
  loading: boolean;
  loadingShared: boolean;
  viewMode: ViewMode;
  filteredProducts: ExtendedProduct[];
  searchText: string;
  hasFriends: boolean;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  navigateToFriends: () => void;
  selectedProducts?: string[];
  onSelectProduct?: (productId: string, selected: boolean) => void;
  selectionMode?: boolean;
  onEnterSelectionMode?: () => void;
}

const ProductListContent: React.FC<ProductListContentProps> = React.memo(({
  loading,
  loadingShared,
  viewMode,
  filteredProducts,
  searchText,
  hasFriends,
  onEdit,
  onDelete,
  navigateToFriends,
  selectedProducts = [],
  onSelectProduct,
  selectionMode = false,
  onEnterSelectionMode
}) => {
  const { t } = useLanguage();

  const renderEmptyState = useCallback(() => {
    if (searchText) {
      return <p>{t('products.noSearchResults')}</p>;
    }

    if (viewMode === 'shared') {
      if (!hasFriends) {
        return (
          <>
            <p>{t('sharing.noFriendsYet')}</p>
            <p>{t('sharing.inviteFriends')}</p>
            <IonButton onClick={navigateToFriends} fill="outline" size="small">
              {t('sharing.friendsSection')}
            </IonButton>
          </>
        );
      }
      return <p>{t('sharing.noSharedProducts')}</p>;
    }

    return (
      <>
        <p>{t('products.noProducts')}</p>
        <p>{t('products.addFirst')}</p>
      </>
    );
  }, [searchText, viewMode, hasFriends, navigateToFriends, t]);

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
          {renderEmptyState()}
        </IonText>
      </div>
    );
  }

  return (
    <div className="product-list-content">
      {filteredProducts.map((product) => (
        <ProductListItem
          key={product.id}
          product={product}
          viewMode={viewMode}
          onEdit={onEdit}
          onDelete={onDelete}
          isSelected={selectedProducts.includes(product.id)}
          onSelect={onSelectProduct}
          selectionMode={selectionMode}
          onEnterSelectionMode={onEnterSelectionMode}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renderizados innecesarios
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.loadingShared === nextProps.loadingShared &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.searchText === nextProps.searchText &&
    prevProps.hasFriends === nextProps.hasFriends &&
    prevProps.selectionMode === nextProps.selectionMode &&
    prevProps.filteredProducts === nextProps.filteredProducts &&
    prevProps.selectedProducts === nextProps.selectedProducts
  );
});

ProductListContent.displayName = 'ProductListContent';

export default ProductListContent;
