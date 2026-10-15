import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import petsRoutes from './routes/pets.routes.js';
import toxicityRoutes from './routes/toxicity.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Base Route
app.get('/', (req, res) => {
  res.json({
    name: 'App de Cuidado Preventivo para Mascotas - API REST',
    version: '1.0.0',
    documentation: '/api/v1',
    status: 'online'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1 Endpoints according to architecture document
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pets', petsRoutes);
app.use('/api/v1/toxicity-directory', toxicityRoutes);

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Error interno del servidor', details: err?.message });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🐾 API REST Mascotas escuchando en http://localhost:${PORT}`);
  console.log(`🛡️  Prefijo API: http://localhost:${PORT}/api/v1`);
  console.log(`📖 Endpoints disponibles:`);
  console.log(`   - POST /api/v1/auth/login`);
  console.log(`   - GET  /api/v1/pets`);
  console.log(`   - POST /api/v1/pets/:petId/logs`);
  console.log(`   - GET  /api/v1/pets/:petId/logs/summary`);
  console.log(`   - GET  /api/v1/toxicity-directory`);
  console.log(`   - POST /api/v1/pets/:petId/pain-assessments`);
  console.log(`=======================================================`);
});
