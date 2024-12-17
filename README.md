# Inventario de Alimentos

Una aplicación para gestionar el inventario de alimentos y generar recetas basadas en los productos disponibles.

## Configuración del Entorno

### Variables de Entorno

La aplicación utiliza variables de entorno para manejar configuraciones sensibles. Para configurar el entorno:

1. Copia el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` y añade tus valores:
```env
VITE_SPOONACULAR_API_KEY=tu_api_key_aqui
VITE_API_URL=https://api.spoonacular.com/recipes
```

### API de Spoonacular

La aplicación utiliza la API de Spoonacular para las recetas. Para obtener una API key:

1. Ve a [Spoonacular API](https://spoonacular.com/food-api)
2. Regístrate para obtener una cuenta
3. En tu dashboard, copia tu API key
4. Añade la API key en tu archivo `.env`

### Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

### Notas de Seguridad

- Nunca comitas el archivo `.env` al repositorio
- Mantén tu API key segura y no la compartas
- Si sospechas que tu API key ha sido comprometida, regenera una nueva en el dashboard de Spoonacular

## Características

- Gestión de inventario de alimentos
- Seguimiento de fechas de caducidad
- Generación de recetas basadas en ingredientes disponibles
- Interfaz multilingüe (Español/Inglés)
- Modo oscuro/claro
- Notificaciones de productos próximos a caducar
