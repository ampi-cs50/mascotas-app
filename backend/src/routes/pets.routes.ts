import { Router } from 'express';
import { postgresDb } from '../db/postgres.js';
import { db } from '../db/repository.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { DailyLog, PainAssessment, ClinicalEvent, Pet } from '../types/index.js';

const router = Router();

router.use(authMiddleware);

// GET /pets - List pets of current user
router.get('/', async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  try {
    const pets = await postgresDb.getPetsByUser(userId);
    res.json(pets);
  } catch (e) {
    console.warn('Fallback to memory for getPetsByUser', e);
    res.json(db.getPetsByUser(userId));
  }
});

// POST /pets - Create pet with validation
router.post('/', async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { name, species, birth_date, weight_kg, avatar_url } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la mascota es obligatorio' });
  }

  if (name.trim().length > 50) {
    return res.status(400).json({ error: 'El nombre no puede superar los 50 caracteres' });
  }

  const normalizedSpecies = species && species.toUpperCase() === 'DOG' ? 'DOG' : 'CAT';
  const weight = Number(weight_kg);

  if (isNaN(weight) || weight <= 0 || weight > 150) {
    return res.status(400).json({ error: 'El peso debe ser un número válido entre 0.1 y 150 kg' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const birthDateStr = birth_date || todayStr;
  if (birthDateStr > todayStr) {
    return res.status(400).json({ error: 'La fecha de nacimiento no puede ser en el futuro' });
  }

  const newPet: Pet = {
    id: `pet-${Date.now()}`,
    user_id: userId,
    name: name.trim(),
    species: normalizedSpecies,
    birth_date: birthDateStr,
    weight_kg: Math.round(weight * 100) / 100,
    avatar_url: avatar_url || (normalizedSpecies === 'DOG'
      ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80')
  };

  try {
    const created = await postgresDb.createPet(newPet);
    res.status(201).json(created);
  } catch (e) {
    console.warn('Fallback to memory for createPet', e);
    res.status(201).json(db.createPet(newPet));
  }
});

// PUT /pets/:petId - Update pet (weight, birth_date, name, avatar, species)
router.put('/:petId', async (req: AuthRequest, res) => {
  const { petId } = req.params;
  const userId = req.userId;

  let pet = await postgresDb.getPetById(petId).catch(() => null);
  if (!pet) {
    pet = db.getPetById(petId) || null;
  }

  if (!pet) {
    return res.status(404).json({ error: 'Mascota no encontrada' });
  }

  if (userId && pet.user_id !== userId) {
    return res.status(403).json({ error: 'No tienes permisos para modificar esta mascota' });
  }

  const { name, species, birth_date, weight_kg, avatar_url } = req.body;
  const updates: Partial<Pet> = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }
    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'El nombre no puede exceder 50 caracteres' });
    }
    updates.name = name.trim();
  }

  if (species !== undefined) {
    updates.species = species.toUpperCase() === 'DOG' ? 'DOG' : 'CAT';
  }

  if (weight_kg !== undefined) {
    const weight = Number(weight_kg);
    if (isNaN(weight) || weight <= 0 || weight > 150) {
      return res.status(400).json({ error: 'El peso debe ser mayor a 0 y menor a 150 kg' });
    }
    updates.weight_kg = Math.round(weight * 100) / 100;
  }

  if (birth_date !== undefined) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (birth_date > todayStr) {
      return res.status(400).json({ error: 'La fecha de nacimiento no puede ser una fecha futura' });
    }
    updates.birth_date = birth_date;
  }

  if (avatar_url !== undefined) {
    updates.avatar_url = avatar_url;
  }

  try {
    const updated = await postgresDb.updatePet(petId, updates);
    res.json(updated);
  } catch (e) {
    console.warn('Fallback to memory for updatePet', e);
    const updated = db.updatePet(petId, updates);
    res.json(updated);
  }
});

// GET /pets/:petId - Details
router.get('/:petId', async (req, res) => {
  try {
    const pet = await postgresDb.getPetById(req.params.petId);
    if (!pet) {
      const fallbackPet = db.getPetById(req.params.petId);
      if (!fallbackPet) return res.status(404).json({ error: 'Mascota no encontrada' });
      return res.json(fallbackPet);
    }
    res.json(pet);
  } catch {
    const fallbackPet = db.getPetById(req.params.petId);
    if (!fallbackPet) return res.status(404).json({ error: 'Mascota no encontrada' });
    res.json(fallbackPet);
  }
});

// POST /pets/:petId/logs - Create / Update log with strict date and enum validation
router.post('/:petId/logs', async (req, res) => {
  const { petId } = req.params;
  const { log_date, water_intake, food_intake, litter_urine, energy_mood, notes } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];
  const targetDate = log_date || todayStr;

  // Validación: No permitir fechas futuras
  if (targetDate > todayStr) {
    return res.status(400).json({ error: 'No es posible registrar evaluaciones con fecha futura' });
  }

  // Validación de ENUMs
  const validWater = ['LOW', 'NORMAL', 'HIGH'];
  const validFood = ['NONE', 'LOW', 'NORMAL', 'HIGH'];
  const validUrine = ['NONE', 'REDUCED', 'NORMAL', 'EXCESSIVE', 'DIFFICULTY'];
  const validMood = ['LETHARGIC', 'CALM', 'ACTIVE', 'PLAYFUL', 'RESTLESS'];

  if (water_intake && !validWater.includes(water_intake)) {
    return res.status(400).json({ error: 'Valor de consumo de agua no válido' });
  }
  if (food_intake && !validFood.includes(food_intake)) {
    return res.status(400).json({ error: 'Valor de alimentación no válido' });
  }
  if (litter_urine && !validUrine.includes(litter_urine)) {
    return res.status(400).json({ error: 'Valor de orina / deposición no válido' });
  }
  if (energy_mood && !validMood.includes(energy_mood)) {
    return res.status(400).json({ error: 'Valor de estado de ánimo no válido' });
  }

  const logPayload: DailyLog = {
    id: `log-${Date.now()}`,
    pet_id: petId,
    log_date: targetDate,
    water_intake: water_intake || 'NORMAL',
    food_intake: food_intake || 'NORMAL',
    litter_urine: litter_urine || 'NORMAL',
    energy_mood: energy_mood || 'ACTIVE',
    notes: typeof notes === 'string' ? notes.slice(0, 1000) : '',
    created_at: new Date().toISOString()
  };

  try {
    const result = await postgresDb.upsertDailyLog(logPayload);
    res.status(result.isNew ? 201 : 200).json({
      message: result.isNew ? 'Registro diario creado en PostgreSQL' : 'Registro diario actualizado en PostgreSQL',
      log: result.log
    });
  } catch (e) {
    console.warn('Fallback to memory for upsertDailyLog', e);
    const result = db.upsertDailyLog(logPayload);
    res.status(result.isNew ? 201 : 200).json({
      message: result.isNew ? 'Registro diario creado con éxito' : 'Registro diario actualizado con éxito',
      log: result.log
    });
  }
});

// GET /pets/:petId/logs
router.get('/:petId/logs', async (req, res) => {
  const { petId } = req.params;
  try {
    const logs = await postgresDb.getLogsByPet(petId);
    res.json(logs);
  } catch {
    res.json(db.getLogsByPet(petId));
  }
});

// GET /pets/:petId/logs/summary
router.get('/:petId/logs/summary', async (req, res) => {
  const { petId } = req.params;
  try {
    const summary = await postgresDb.getLogsSummary(petId);
    res.json(summary);
  } catch {
    res.json(db.getLogsSummary(petId));
  }
});

// POST /pets/:petId/pain-assessments
router.post('/:petId/pain-assessments', async (req, res) => {
  const { petId } = req.params;
  const { score, ears_score, eyes_score, muzzle_score, notes } = req.body;

  const ears = Math.min(Math.max(Number(ears_score || 0), 0), 2);
  const eyes = Math.min(Math.max(Number(eyes_score || 0), 0), 2);
  const muzzle = Math.min(Math.max(Number(muzzle_score || 0), 0), 2);

  const calculatedScore = score !== undefined 
    ? Math.min(Math.max(Number(score), 0), 6)
    : (ears + eyes + muzzle);

  const assessment: PainAssessment = {
    id: `pain-${Date.now()}`,
    pet_id: petId,
    assessment_date: new Date().toISOString(),
    score: calculatedScore,
    ears_score: ears,
    eyes_score: eyes,
    muzzle_score: muzzle,
    notes: typeof notes === 'string' ? notes.slice(0, 1000) : ''
  };

  try {
    const created = await postgresDb.createPainAssessment(assessment);
    res.status(201).json({
      message: 'Evaluación de dolor guardada en PostgreSQL',
      assessment: created
    });
  } catch (e) {
    console.warn('Fallback to memory for pain assessment', e);
    const created = db.createPainAssessment(assessment);
    res.status(201).json({
      message: 'Evaluación de dolor guardada correctamente',
      assessment: created
    });
  }
});

// GET /pets/:petId/pain-assessments
router.get('/:petId/pain-assessments', async (req, res) => {
  const { petId } = req.params;
  try {
    const assessments = await postgresDb.getPainAssessments(petId);
    res.json(assessments);
  } catch {
    res.json(db.getPainAssessments(petId));
  }
});

// GET /pets/:petId/clinical-events
router.get('/:petId/clinical-events', async (req, res) => {
  const { petId } = req.params;
  try {
    const events = await postgresDb.getClinicalEvents(petId);
    res.json(events);
  } catch {
    res.json(db.getClinicalEvents(petId));
  }
});

// POST /pets/:petId/clinical-events
router.post('/:petId/clinical-events', async (req, res) => {
  const { petId } = req.params;
  const { event_type, event_date, title, notes } = req.body;

  if (!event_type || !title) {
    return res.status(400).json({ error: 'event_type y title son requeridos' });
  }

  const newEvent: ClinicalEvent = {
    id: `ev-${Date.now()}`,
    pet_id: petId,
    event_type,
    event_date: event_date || new Date().toISOString().split('T')[0],
    title: typeof title === 'string' ? title.slice(0, 200) : 'Evento Clínico',
    notes: typeof notes === 'string' ? notes.slice(0, 1000) : ''
  };

  try {
    const created = await postgresDb.createClinicalEvent(newEvent);
    res.status(201).json(created);
  } catch {
    res.status(201).json(db.createClinicalEvent(newEvent));
  }
});

export default router;
