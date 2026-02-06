# Funny Rolls

![Funny Rolls Banner](https://via.placeholder.com/1200x400/8B4513/FFFFFF?text=Funny+Rolls+-+Ríe+y+Disfruta+Cada+Remolino!)

**Una experiencia dulce y moderna para amantes de los rollos de canela.**  
Calculadora de costos integrada + E-commerce elegante.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[Características](#-características-principales) · [Demo](#-demo-live) · [Instalación](#-instalación) · [Tecnologías](#-stack-tecnológico) · [Estructura](#-estructura-del-proyecto) · [Configuración](#-configuración) · [Contribución](#-contribución)

---

## Descripción

**Funny Rolls** es una aplicación web para una panadería especializada en rollos de canela. Resuelve la necesidad de tener en un solo lugar:

- **Sitio corporativo** para clientes (productos, contacto, pedidos).
- **Calculadora de costos** para dueños y cocina (ingredientes, herramientas, márgenes, rentabilidad).
- **Flujo POS in-store** (carrito, pago en efectivo mock, notas de pedido, resumen del día).

El objetivo es que cualquier desarrollador pueda clonar el repo, configurar variables de entorno, instalar dependencias y ejecutar el proyecto en desarrollo o producción sin documentación adicional.

---

## Demo Live

**Producción:** [https://funny-rolls.vercel.app](https://funny-rolls.vercel.app)

---

## Capturas de pantalla

| Página principal | Calculadora de costos | Carrito / checkout |
|------------------|------------------------|---------------------|
| ![Home](https://via.placeholder.com/320x200/8B4513/FFFFFF?text=Home) | ![Calculator](https://via.placeholder.com/320x200/C48A6A/FFFFFF?text=Calculator) | ![Cart](https://via.placeholder.com/320x200/FFC1C1/000000?text=Cart) |

*(Sustituir por capturas reales del proyecto.)*

---

## Características principales

### Sitio web corporativo

- Hero con llamada a la acción.
- Menú con galería de productos y precios.
- Secciones Acerca de y Contacto (incl. enlace WhatsApp).
- Navbar fija con carrito.
- Diseño responsive (móvil, tablet, desktop).
- Metadatos y estructura pensada para SEO.

### Calculadora de costos

- Gestión de ingredientes (CRUD) con validación en tiempo real.
- Gestión de herramientas y costos amortizados.
- Cálculo automático de costos por receta, ganancia y margen.
- Persistencia en `localStorage` (ingredientes, recetas, inventario).
- Exportación e importación de datos en JSON.
- Vista móvil adaptativa (flip-card).
- Panel de producción (registro mock) y resumen.

### E-commerce y POS (mock)

- Carrito con actualización de cantidades y totales (subtotal, impuesto, total).
- Notas e instrucciones especiales por pedido.
- Flujo de pago: efectivo (monto recibido, cambio) o “completar venta” mock.
- Órdenes persistidas en `localStorage` (OrderStore).
- Resumen del día (número de pedidos, ventas totales, ticket promedio).
- Sin pasarelas de pago reales; preparado para una fase posterior.

### Roles de usuario

No hay autenticación ni roles. La misma interfaz sirve para:

- **Cliente:** navegar menú, carrito y checkout mock.
- **Operador/panadería:** usar calculadora de costos y resumen de ventas.

---

## Stack tecnológico

| Área | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript 5 |
| Estilos | Tailwind CSS 4, PostCSS |
| Componentes | shadcn/ui (button, card, badge), Radix, Headless UI |
| Fuentes | Google Fonts (Pacifico, Inter) |
| Iconos | Lucide React |
| Datos (mock/local) | LocalStorage, capa de servicios en `lib/services` |
| Backend (opcional) | Supabase (recetas, ingredientes), API Route upload (S3) |

---

## Requisitos previos

- **Node.js** 18.x o superior (recomendado 20.x LTS).
- **npm** 9+ o **yarn** / **pnpm**.
- Para integraciones: cuenta Supabase y/o AWS S3 según uso.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd funny-rolls
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar entorno

Crear `.env.local` en la raíz (ver [Configuración](#-configuración)).

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La app queda en **http://localhost:2000**.

### 5. Build y producción

```bash
npm run build
npm run start
```

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (Turbopack, puerto 2000) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor para build ya generado |
| `npm run lint` | Ejecutar ESLint |

---

## Estructura del proyecto

```
funny-rolls/
├── app/                    # App Router (Next.js 15)
│   ├── layout.tsx          # Layout raíz, fuentes, metadata
│   ├── page.tsx            # Página principal (marketing + carrito)
│   ├── globals.css         # Estilos globales y Tailwind
│   ├── recipe-calculator/
│   │   └── page.tsx        # Ruta de la calculadora de costos
│   └── api/
│       └── upload/         # API Route subida (S3)
│           └── route.ts
├── components/
│   ├── sections/           # Secciones del sitio principal
│   │   ├── Hero.tsx
│   │   ├── Navbar.tsx
│   │   ├── MenuSection.tsx
│   │   ├── About.tsx
│   │   ├── Contact.tsx
│   │   ├── Footer.tsx
│   │   ├── CartModal.tsx           # Carrito + flujo de pago
│   │   ├── DailySalesSummaryModal.tsx
│   │   └── RecipeCalculator.tsx    # Wrapper calculadora en home
│   ├── RecipeCalculator/    # Módulo calculadora (paneles, formularios)
│   │   ├── RecipeCalculator.tsx
│   │   ├── IngredientsPanel.tsx
│   │   ├── RecipeCalculatorPanel.tsx
│   │   ├── ToolsPanel.tsx
│   │   ├── ProductionTrackerPanel.tsx
│   │   ├── MobileViewSwitcher.tsx
│   │   ├── FlipCard.tsx
│   │   ├── EditableIngredientRow.tsx
│   │   ├── EditableToolRow.tsx
│   │   └── ...
│   └── ui/                 # Componentes base (shadcn)
│       ├── button.tsx
│       ├── card.tsx
│       └── badge.tsx
├── lib/                    # Lógica de negocio y datos
│   ├── types.ts            # Tipos (Product, Order, Recipe, etc.)
│   ├── calculations.ts     # Cálculos (costos, impuestos, márgenes)
│   ├── data.ts             # Datos mock (productos, ingredientes, herramientas)
│   ├── order-store.ts      # Persistencia de órdenes (localStorage)
│   ├── recipe-scaling.ts
│   ├── unit-conversion.ts
│   ├── supabase.ts         # Cliente Supabase
│   ├── aws-s3.ts           # Utilidad S3
│   └── services/           # Capa de servicios (lectura/datos)
│       ├── index.ts
│       ├── products.ts
│       ├── ingredients.ts
│       ├── tools.ts
│       ├── orders.ts       # Órdenes, totales carrito, resumen día
│       ├── production.ts
│       └── sales.ts
├── pages/                  # Pages Router (solo _document, _app para build)
│   ├── _document.tsx
│   └── _app.tsx
├── public/
│   ├── img/                # Imágenes de productos y marketing
│   └── favicon/            # Favicons y manifest
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── components.json         # Configuración shadcn
```

La UI consume datos **solo a través de `lib/services`**; no importa directamente `lib/data` ni el store.

---

## Configuración

### Variables de entorno

Crear `.env.local` en la raíz:

```env
# Opcional: URL base de la app (ej. para links en emails o meta)
NEXT_PUBLIC_APP_URL=http://localhost:2000

# Supabase (si usas recetas/ingredientes en BD)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# S3 / upload (si usas la API de subida)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET=
```

No subir `.env.local` al repositorio; usar `.env.example` solo con claves de ejemplo vacías o placeholders.

### Personalización de contenido

- **Productos, ingredientes, herramientas:** `lib/data.ts`.
- **Estilos globales y variables:** `app/globals.css`.
- **Tailwind:** configuración vía PostCSS y clases en componentes; no hay `tailwind.config.js` en la raíz en la configuración actual.

---

## Assets: imágenes, fuentes e iconos

- **Imágenes:** en `public/img/` (productos, banners). Referencias con `/img/nombre.jpg`.
- **Favicons:** `public/favicon/` (ico, PNG, apple-touch-icon, `site.webmanifest`). Configurados en `app/layout.tsx` (metadata).
- **Fuentes:** Pacifico e Inter desde `next/font/google` en `app/layout.tsx`; variables CSS `--font-pacifico`, `--font-inter`.
- **Iconos:** Lucide React; importar por nombre desde `lucide-react`.

---

## Estilos y UI/UX

- **Colores:** fondo `#FFF5E6`, principal `#8B4513`, secundario `#C48A6A`, acentos `#FFC1C1`; tonos amber en botones y estados.
- **Tipografía:** títulos con Pacifico, cuerpo con Inter.
- **Responsive:** breakpoints de Tailwind; navbar y calculadora adaptados a móvil (incl. vista flip-card).
- **Accesibilidad:** componentes semánticos y uso de Radix/shadcn donde aplica.

---

## Limitaciones actuales

- Pagos son **mock** (efectivo simulado y “completar venta”); no hay Stripe, Mercado Pago ni otras pasarelas.
- Órdenes e inventario de la calculadora se persisten en **localStorage** (sin backend obligatorio).
- Resumen del día se calcula en cliente a partir de órdenes en localStorage.
- No hay autenticación ni control de acceso por roles.
- Integración Supabase/S3 es opcional; la app funciona solo con datos mock y servicios locales.

---

## Buenas prácticas aplicadas

- **Capa de servicios:** lectura de datos centralizada en `lib/services`; la UI no accede a `lib/data` ni a `order-store` directamente.
- **Cálculos centralizados:** impuestos, totales y márgenes en `lib/calculations.ts`.
- **Tipado estricto** con TypeScript en todo el proyecto.
- **Componentes funcionales** y actualizaciones de estado con funciones (evitar mutaciones directas).
- **App Router** como fuente principal de rutas; `pages/` solo para compatibilidad de build (`_document`, `_app`).

---

## Roadmap / próximos pasos

- [ ] Integración de pasarela de pago real.
- [ ] Backend para órdenes e inventario (API o Supabase).
- [ ] Autenticación y roles (admin vs operador).
- [ ] Impresión o envío de comprobantes/recibos.
- [ ] Internacionalización (i18n) si se requiere otro idioma.

---

## Contribución

1. Hacer fork del repositorio.
2. Crear una rama: `git checkout -b feature/nombre-breve`.
3. Commit de cambios con mensajes claros: `git commit -m "feat: descripción"`.
4. Push a tu fork y abrir un Pull Request contra la rama principal.

Se valoran issues y PRs alineados con el roadmap y las buenas prácticas descritas.

---

## Licencia

Proyecto privado de Funny Rolls. Uso y redistribución según los términos acordados con el equipo.

---

## Autor y contacto

- **Martha Isela Gardea** — Fundadora y propietaria  
- **Equipo de desarrollo** — Funny Rolls  

**Soporte:**  
- WhatsApp: (614) 486-87-71  
- Email: *[pendiente]*  
- Dirección: Calle 9na #111, Col. Campesina, CP 33985  

---

*Funny Rolls — Ríe y disfruta cada remolino.*
