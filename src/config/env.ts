interface EnvConfig {
  SPOONACULAR_API_KEY: string;
  API_URL: string;
}

const env: EnvConfig = {
  SPOONACULAR_API_KEY: import.meta.env.VITE_SPOONACULAR_API_KEY || '',
  API_URL: import.meta.env.VITE_API_URL || 'https://api.spoonacular.com/recipes'
};

// Validación de variables de entorno requeridas
const requiredEnvVars = ['SPOONACULAR_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !env[varName as keyof EnvConfig]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
    'Please check your .env file and make sure all required variables are set.'
  );
}

export default env;
