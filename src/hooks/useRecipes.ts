import { useState, useCallback } from 'react';
import { Recipe, DetailedRecipe, recipeService } from '../services/RecipeService';
import { Product } from '../services/types';
import { useTranslation } from 'react-i18next';

export const useRecipes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<DetailedRecipe | null>(null);
  const { t } = useTranslation();

  const searchRecipesByProducts = useCallback(async (products: Product[]) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRecipes = await recipeService.searchRecipesByProducts(products);
      setRecipes(fetchedRecipes);
    } catch (err) {
      console.error('Error searching recipes:', err);
      setError(t('recipes.error.fetchingRecipes'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const getRecipeDetails = useCallback(async (recipeId: number) => {
    try {
      setLoading(true);
      setError(null);
      const details = await recipeService.getRecipeDetails(recipeId);
      setSelectedRecipe(details);
      return details;
    } catch (err) {
      console.error('Error getting recipe details:', err);
      setError(t('recipes.error.fetchingRecipes'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [t]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearRecipes = useCallback(() => {
    setRecipes([]);
    setSelectedRecipe(null);
  }, []);

  return {
    loading,
    error,
    recipes,
    selectedRecipe,
    searchRecipesByProducts,
    getRecipeDetails,
    clearError,
    clearRecipes
  };
};
