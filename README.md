# App de Cuidado Preventivo para Mascotas 🐾

Aplicación web **mobile-first** para el registro diario de hábitos, detección temprana de anomalías clínicas, prevención de riesgos en el hogar y evaluación de dolor facial (enfocado en gatos y perros).

---

## 🛠️ Stack Tecnológico

- **Frontend**: [Angular](https://angular.dev/) (Standalone Components, Signals, Zoneless/Vite)
- **Estilos**: SCSS (Uso estricto de Flexbox, CSS Grid y unidades `rem`)
- **Backend**: API RESTful con Node.js, Express y TypeScript protegida con JWT
- **Base de Datos**: Relacional con esquema SQL PostgreSQL / MySQL (`database/schema.sql` y `database/seeds.sql`) y almacenamiento persistente local en JSON.

---

## 🎨 Guía de Estilos UI/UX (Estilo: Amigable y Natural)

- **Enfoque Visual**: Mobile-First con contenedor principal centrado (`max-width: 25rem`), simulando pantalla de celular en escritorio.
- **Paleta de Colores Hexadecimales**:
  - `Fondo principal`: `#C3D8C4` (Verde salvia)
  - `Tarjetas / Contenedores`: `#F9F8F3` (Blanco cálido)
  - `Botones activos / Selecciones`: `#7A9E7E` (Verde oscuro)
  - `Botón principal de guardado / Alertas`: `#E07A5F` (Naranja terracota)
  - `Textos y tipografía`: `#2D3A2F` (Gris oscuro)
- **Geometría y Espaciado**:
  - Radio de bordes de contenedores principales: `2rem`
  - Radio de bordes de botones/píldoras: `1.25rem`
  - Padding y márgenes en múltiplos de `0.5rem` o `1rem`.

---

## 📱 Vistas Principales del Frontend

1. **Dashboard (Tablero)** (`/dashboard`):
   - Resumen diario y métricas clave de salud.
   - Selector activo de mascotas (Luna 🐱 / Chester 🐶) con foto y ficha técnica.
   - Alertas preventivas tempranas y consejos veterinarios diarios.
   - Próximos eventos clínicos e historial de vacunas y desparasitaciones.
2. **Check-in Diario (Bitácora)** (`/check-in`):
   - Formulario rápido de 1 toque con píldoras interactivas:
     - Ingesta de agua (`Baja`, `Normal`, `Alta`).
     - Alimentación (`Nada`, `Poco`, `Normal`, `Abundante`).
     - Orina / Arenero (`Normal`, `Reducida`, `Excesiva`, `Dificultad ⚠️`).
     - Estado de ánimo (`Juguetón`, `Activo`, `Tranquilo`, `Letárgico`, `Inquieto`).
     - Observaciones adicionales.
   - Botón principal de guardado en naranja terracota (`#E07A5F`).
3. **Buscador de Toxicidad (Prevención)** (`/toxicity`):
   - Buscador rápido en tiempo real para plantas, alimentos, medicamentos, objetos y químicos.
   - Filtros por categorías (Plantas, Alimentos, Medicamentos, Objetos, Químicos).
   - Alertas visuales con código de color (`Peligro Mortal`, `Peligro Severo`, `Moderado`, `Leve`).
   - Acciones de urgencia recomendadas y botón de discado directo a emergencias veterinarias.
4. **Evaluador de Dolor Facial (Escala de Muecas)** (`/pain-assessment`):
   - Cuestionario visual interactivo basado en la **Feline Grimace Scale (FGS)**.
   - Comparación visual paso a paso de:
     1. Posición de las Orejas (Erguidas / Rotadas / Aplanadas).
     2. Tensión Orbital / Ojos (Abiertos / Entrecerrados / Cerrados).
     3. Hocico y Bigotes (Relajado / Tenso / Proyectado).
   - Cálculo automático del puntaje (0 a 6) con semáforo de riesgo y recomendaciones clínicas.
5. **Insights (Tendencias)** (`/insights`):
   - Gráfico de barras de evolución de 7 días (Agua, Comida y Vitalidad).
   - Distribución de estados de ánimo y anomalías registradas.
   - Generador y exportador de **Reporte Veterinario** en modal formateado para consulta médica.
6. **Navegación**:
   - `BottomNav` fijo en la parte inferior de la pantalla simulada.

---

## 🚀 Puesta en Marcha

### 1. Requisitos Previos
- Node.js (v18+)
- npm (v9+)

### 2. Estructura del Proyecto
```
mascotas-app/
├── database/
│   ├── schema.sql           # Esquema relacional SQL
│   └── seeds.sql            # Datos de prueba para PostgreSQL / MySQL
├── backend/
│   ├── src/
│   │   ├── db/              # Repositorio y almacenamiento
│   │   ├── middleware/      # Middleware JWT
│   │   ├── routes/          # Rutas (/auth, /pets, /toxicity-directory)
│   │   ├── types/           # Interfaces TypeScript
│   │   └── index.ts         # Servidor Express
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Header, BottomNav
│   │   │   ├── views/       # Dashboard, Check-in, Toxicity, Pain, Insights
│   │   │   ├── services/    # PetService con Signals y HttpClient
│   │   │   └── models/      # Modelos TypeScript
│   │   └── styles.scss      # Sistema de diseño SCSS
│   ├── package.json
│   └── angular.json
├── start.sh                 # Script unificado de inicio
└── README.md
```

### 3. Iniciar Backend y Frontend
Desde el directorio del proyecto:
```bash
./start.sh
```

O manualmente:
- **Backend API**:
  ```bash
  cd backend
  npm run dev
  # Escucha en http://localhost:3000 (API: http://localhost:3000/api/v1)
  ```
- **Frontend Angular**:
  ```bash
  cd frontend
  npm start
  # Abre en tu navegador http://localhost:4200
  ```

---

## 📡 Endpoints del Backend (`/api/v1`)

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Autenticación con email y contraseña (devuelve JWT) |
| `POST` | `/api/v1/auth/register` | Registro de nuevos usuarios |
| `GET` | `/api/v1/pets` | Listado de mascotas del usuario |
| `POST` | `/api/v1/pets/:petId/logs` | Crea o actualiza registro diario (Upsert único por fecha) |
| `GET` | `/api/v1/pets/:petId/logs/summary` | Métricas agregadas y alertas para gráficos |
| `GET` | `/api/v1/pets/:petId/logs` | Historial completo de bitácora diaria |
| `GET` | `/api/v1/toxicity-directory` | Buscador de toxicidad con filtros `?q=` y `?category=` |
| `POST` | `/api/v1/pets/:petId/pain-assessments` | Guardar evaluación de expresión facial (FGS) |
| `GET` | `/api/v1/pets/:petId/pain-assessments` | Historial de evaluaciones de dolor |
| `GET` | `/api/v1/pets/:petId/clinical-events` | Vacunas, desparasitaciones y controles |
