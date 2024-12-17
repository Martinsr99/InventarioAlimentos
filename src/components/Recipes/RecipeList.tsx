import React, { useEffect } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonImg,
  IonButton,
  IonIcon,
  IonSkeletonText,
  IonText,
  IonAlert
} from '@ionic/react';
import { heart, alertCircleOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { Product } from '../../services/types';
import { useRecipes } from '../../hooks/useRecipes';
import './RecipeList.css';

interface RecipeListProps {
  products: Product[];
}

export const RecipeList: React.FC<RecipeListProps> = ({ products }) => {
  const { t } = useTranslation();
  const {
    loading,
    error,
    recipes,
    searchRecipesByProducts,
    clearError
  } = useRecipes();

  useEffect(() => {
    if (products.length > 0) {
      searchRecipesByProducts(products);
    }
  }, [products, searchRecipesByProducts]);

  if (loading) {
    return (
      <IonList>
        {[...Array(3)].map((_, index) => (
          <IonItem key={index}>
            <IonThumbnail slot="start">
              <IonSkeletonText animated style={{ width: '100%', height: '100%' }} />
            </IonThumbnail>
            <IonLabel>
              <IonSkeletonText animated style={{ width: '80%' }} />
              <IonSkeletonText animated style={{ width: '60%' }} />
            </IonLabel>
          </IonItem>
        ))}
      </IonList>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <IonIcon icon={alertCircleOutline} color="danger" />
        <IonText color="danger">{error}</IonText>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="no-recipes">
        {products.length === 0 
          ? t('recipes.noExpiringProducts')
          : t('recipes.noRecipesFound')}
      </div>
    );
  }

  return (
    <>
      <IonList>
        {recipes.map((recipe) => (
          <IonItem key={recipe.id} className="recipe-item" detail={true}>
            <IonThumbnail slot="start">
              <IonImg src={recipe.image} alt={recipe.title} />
            </IonThumbnail>
            <IonLabel>
              <h2>{recipe.title}</h2>
              <p className="ingredients-used">
                {t('recipes.ingredientsUsed', { count: recipe.usedIngredients.length })}
              </p>
            </IonLabel>
            <IonButton fill="clear" slot="end">
              <IonIcon icon={heart} />
              {recipe.likes}
            </IonButton>
          </IonItem>
        ))}
      </IonList>

      <IonAlert
        isOpen={!!error}
        onDidDismiss={clearError}
        header={t('common.error')}
        message={error || ''}
        buttons={[t('common.ok')]}
      />
    </>
  );
};
