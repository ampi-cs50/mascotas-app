import { Router } from 'express';
import { postgresDb } from '../db/postgres.js';
import { db } from '../db/repository.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  const query = typeof req.query['q'] === 'string' ? req.query['q'] : undefined;
  const category = typeof req.query['category'] === 'string' ? req.query['category'] : undefined;

  try {
    const items = await postgresDb.searchToxicity(query, category);
    res.json({
      total: items.length,
      items
    });
  } catch (e) {
    console.warn('Fallback to memory for toxicity search', e);
    const items = db.searchToxicity(query, category);
    res.json({
      total: items.length,
      items
    });
  }
});

export default router;
