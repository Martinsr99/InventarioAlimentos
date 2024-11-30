import React from 'react';
import {
  IonList,
  IonSpinner,
  IonText,
  IonButton,
  IonItem,
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
}

const ProductListContent: React.FC<ProductListContentProps> = ({
  loading,
  loadingShared,
  viewMode,
  filteredProducts,
  searchText,
  hasFriends,
  onEdit,
  onDelete,
  navigateToFriends
}) => {
  const { t } = useLanguage();

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
                ? hasFriends 
                  ? t('sharing.noSharedProducts')
                  : t('sharing.noFriendsYet')
                : t('products.noProducts')
            }
          </p>
          {!searchText && viewMode === 'personal' && <p>{t('products.addFirst')}</p>}
          {!searchText && viewMode === 'shared' && !hasFriends && (
            <>
              <p>{t('sharing.inviteFriends')}</p>
              <IonButton onClick={navigateToFriends} fill="outline" size="small">
                {t('sharing.friendsSection')}
              </IonButton>
            </>
          )}
        </IonText>
      </div>
    );
  }

  return (
    <div className="product-list-content">
      {filteredProducts.map((product, index) => (
        <ProductListItem
          key={product.id}
          product={product}
          viewMode={viewMode}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ProductListContent;
