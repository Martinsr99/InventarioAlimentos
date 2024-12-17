import { Product } from './types';
import env from '../config/env';

export interface Recipe {
  id: number;
  title: string;
  image: string;
  usedIngredients: {
    id: number;
    amount: number;
    unit: string;
    name: string;
  }[];
  missedIngredients: {
    id: number;
    amount: number;
    unit: string;
    name: string;
  }[];
  likes: number;
}

export interface DetailedRecipe extends Recipe {
  instructions: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
}

export interface Menu {
  id: string;
  name: string;
  recipes: Recipe[];
  createdAt: Date;
  updatedAt: Date;
}

class RecipeService {
  private readonly API_KEY = env.SPOONACULAR_API_KEY;
  private readonly BASE_URL = env.API_URL;

  async searchRecipesByProducts(products: Product[]): Promise<Recipe[]> {
    try {
      const ingredients = products
        .map(product => product.name)
        .join(',');

      const response = await fetch(
        `${this.BASE_URL}/findByIngredients?apiKey=${this.API_KEY}&ingredients=${encodeURIComponent(ingredients)}&number=10&ranking=2&ignorePantry=true`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al buscar recetas');
      }

      return response.json();
    } catch (error) {
      console.error('Error buscando recetas:', error);
      throw error;
    }
  }

  async getRecipeDetails(recipeId: number): Promise<DetailedRecipe> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${recipeId}/information?apiKey=${this.API_KEY}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener detalles de la receta');
      }

      return response.json();
    } catch (error) {
      console.error('Error obteniendo detalles de la receta:', error);
      throw error;
    }
  }

  async searchRecipesByCuisine(cuisine: string, maxResults: number = 10): Promise<Recipe[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/complexSearch?apiKey=${this.API_KEY}&cuisine=${encodeURIComponent(cuisine)}&number=${maxResults}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al buscar recetas por cocina');
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error buscando recetas por cocina:', error);
      throw error;
    }
  }
}

export const recipeService = new RecipeService();
