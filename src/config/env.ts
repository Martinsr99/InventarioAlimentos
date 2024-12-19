interface EnvConfig {
}

const env: EnvConfig = {
};

// Validación de variables de entorno requeridas
const requiredEnvVars: string[] = [];
const missingEnvVars = requiredEnvVars.filter(varName => !env[varName as keyof EnvConfig]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
    'Please check your .env file and make sure all required variables are set.'
  );
}

export default env;
