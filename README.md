Funny Rolls

Descripción del Proyecto
Funny Rolls es una aplicación web moderna y responsive para una panadería especializada en rollos de canela. La plataforma incluye tanto un sitio web de presentación para clientes como una calculadora de costos avanzada para la gestión de recetas.

Características Principales
- Sitio Web Corporativo: Presentación de productos, información de la empresa y contacto
- Calculadora de Costos: Herramienta avanzada para calcular costos de producción y rentabilidad
- Carrito de Compras: Sistema de pedidos en línea
- Diseño Responsive: Optimizado para dispositivos móviles y desktop
- Interfaz Bilingüe: Español como idioma principal

Tecnologías Utilizadas
- Frontend: Next.js 14, React, TypeScript
- Styling: Tailwind CSS
- UI Components: Componentes personalizados con shadcn/ui
- Fuentes: Google Fonts (Pacifico, Inter)
- Iconos: Lucide React
- Almacenamiento: LocalStorage para persistencia de datos

Estructura del Proyecto
funny-rolls/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── recipe-calculator/
│   │   └── page.tsx
│   └── globals.css
├── components/
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Navbar.tsx
│   │   ├── MenuSection.tsx
│   │   ├── About.tsx
│   │   ├── Contact.tsx
│   │   ├── Footer.tsx
│   │   ├── CartModal.tsx
│   │   └── RecipeCalculator.tsx
│   ├── RecipeCalculator/
│   │   ├── RecipeCalculator.tsx
│   │   ├── IngredientsPanel.tsx
│   │   ├── RecipeCalculatorPanel.tsx
│   │   ├── MobileViewSwitcher.tsx
│   │   ├── EditableIngredientRow.tsx
│   │   ├── FlipCard.tsx
│   │   └── PrintableRecipe.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── badge.tsx
├── lib/
│   ├── types.ts
│   ├── utils.ts
│   └── data.ts
└── public/
    ├── img/
    └── favicon/

Instalación y Configuración
Prerrequisitos:
- Node.js 18+
- npm o yarn

Pasos:
1. Clonar el repositorio
   git clone <repository-url>
   cd funny-rolls

2. Instalar dependencias
   npm install
   # o
   yarn install

3. Ejecutar en modo desarrollo
   npm run dev
   # o
   yarn dev

4. Abrir en el navegador
   http://localhost:3000

Funcionalidades Detalladas
Sitio Web Principal:
- Hero: Presentación principal con llamada a la acción
- Menú: Galería de productos con precios
- Acerca de: Historia y misión
- Contacto: Formulario integrado con WhatsApp
- Navegación sticky con carrito

Calculadora de Costos:
- Agregar, editar, eliminar ingredientes
- Cálculo automático de costos, ganancias y márgenes
- Persistencia con localStorage
- Exportar e importar datos JSON
- Diseño responsive y vista flip card móvil

Diseño y UX
Paleta de Colores:
- Principal: #8B4513
- Secundario: #C48A6A
- Fondo: #FFF5E6
- Acentos: #FFC1C1

Tipografía:
- Títulos: Pacifico
- Texto: Inter

Responsive Design:
- Mobile, Tablet y Desktop

Configuración y Personalización
Archivo .env.local:
NEXT_PUBLIC_APP_URL=http://localhost:3000

Personalización:
- Productos y precios en lib/data.ts
- Estilos en app/globals.css y tailwind.config.js

Scripts Disponibles
npm run dev      # Desarrollo
npm run build    # Producción
npm run start    # Servidor
npm run lint     # Linter

Deployment
Recomendado: Vercel
Alternativas: Netlify, Railway, Digital Ocean

Contribución
1. Fork del proyecto
2. Crear feature branch
3. Commit de cambios
4. Push y Pull Request

Licencia
Proyecto privado de Funny Rolls.

Equipo
- Martha Isela Gardea: Fundadora y propietaria
- Equipo de desarrollo Funny Rolls

Soporte
WhatsApp: (614) 486-87-71
Email: [pendiente]
Dirección: Calle 9na #111, Col Campesina, CP 33985

Funny Rolls - Ríe y Disfruta Cada Remolino!
