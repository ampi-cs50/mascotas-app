import pg from 'pg';
import dotenv from 'dotenv';
import {
  User,
  Pet,
  DailyLog,
  ClinicalEvent,
  ToxicityItem,
  PainAssessment,
  DailyLogSummary
} from '../types/index.js';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ampi@localhost:5432/mascotas_db'
});

pool.on('connect', () => {
  console.log('🐘 Conectado exitosamente a PostgreSQL (mascotas_db)');
});

pool.on('error', (err) => {
  console.error('⚠️ Error inesperado en pool de PostgreSQL:', err);
});

// Helper de consulta
export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

// ====================================================================
// Repositorio Asíncrono en PostgreSQL
// ====================================================================

export const postgresDb = {
  // --- Users ---
  async findUserByEmail(email: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  },

  async findUserById(id: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async createUser(user: User): Promise<User> {
    await query(
      'INSERT INTO users (id, email, password_hash, name, created_at) VALUES ($1, $2, $3, $4, $5)',
      [user.id, user.email, user.password_hash, user.name, user.created_at || new Date()]
    );
    return user;
  },

  // --- Pets ---
  async getPetsByUser(userId: string): Promise<Pet[]> {
    const res = await query('SELECT * FROM pets WHERE user_id = $1 ORDER BY name ASC', [userId]);
    return res.rows;
  },

  async getPetById(petId: string): Promise<Pet | null> {
    const res = await query('SELECT * FROM pets WHERE id = $1', [petId]);
    return res.rows[0] || null;
  },

  async createPet(pet: Pet): Promise<Pet> {
    await query(
      'INSERT INTO pets (id, user_id, name, species, birth_date, weight_kg, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [pet.id, pet.user_id, pet.name, pet.species, pet.birth_date, pet.weight_kg, pet.avatar_url || '']
    );
    return pet;
  },

  async updatePet(petId: string, updates: Partial<Pet>): Promise<Pet | null> {
    const existing = await this.getPetById(petId);
    if (!existing) return null;

    const name = updates.name !== undefined ? updates.name : existing.name;
    const species = updates.species !== undefined ? updates.species : existing.species;
    const birth_date = updates.birth_date !== undefined ? updates.birth_date : existing.birth_date;
    const weight_kg = updates.weight_kg !== undefined ? Number(updates.weight_kg) : existing.weight_kg;
    const avatar_url = updates.avatar_url !== undefined ? updates.avatar_url : existing.avatar_url;

    await query(
      `UPDATE pets 
       SET name = $1, species = $2, birth_date = $3, weight_kg = $4, avatar_url = $5
       WHERE id = $6`,
      [name, species, birth_date, weight_kg, avatar_url, petId]
    );

    return this.getPetById(petId);
  },

  // --- Daily Logs ---
  async getLogsByPet(petId: string): Promise<DailyLog[]> {
    const res = await query(
      'SELECT * FROM daily_logs WHERE pet_id = $1 ORDER BY log_date DESC',
      [petId]
    );
    return res.rows;
  },

  async upsertDailyLog(log: DailyLog): Promise<{ log: DailyLog; isNew: boolean }> {
    const existing = await query(
      'SELECT id FROM daily_logs WHERE pet_id = $1 AND log_date = $2',
      [log.pet_id, log.log_date]
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE daily_logs 
         SET water_intake = $1, food_intake = $2, litter_urine = $3, energy_mood = $4, notes = $5 
         WHERE pet_id = $6 AND log_date = $7`,
        [log.water_intake, log.food_intake, log.litter_urine, log.energy_mood, log.notes || '', log.pet_id, log.log_date]
      );
      return { log: { ...log, id: existing.rows[0].id }, isNew: false };
    } else {
      const id = log.id || `log-${Date.now()}`;
      await query(
        `INSERT INTO daily_logs (id, pet_id, log_date, water_intake, food_intake, litter_urine, energy_mood, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, log.pet_id, log.log_date, log.water_intake, log.food_intake, log.litter_urine, log.energy_mood, log.notes || '', new Date()]
      );
      return { log: { ...log, id }, isNew: true };
    }
  },

  async getLogsSummary(petId: string): Promise<DailyLogSummary> {
    const logs = await this.getLogsByPet(petId);
    const mood_distribution: Record<string, number> = {};
    const water_distribution: Record<string, number> = {};
    const food_distribution: Record<string, number> = {};
    const urine_distribution: Record<string, number> = {};
    const anomaly_alerts: string[] = [];

    logs.forEach(l => {
      mood_distribution[l.energy_mood] = (mood_distribution[l.energy_mood] || 0) + 1;
      water_distribution[l.water_intake] = (water_distribution[l.water_intake] || 0) + 1;
      food_distribution[l.food_intake] = (food_distribution[l.food_intake] || 0) + 1;
      urine_distribution[l.litter_urine] = (urine_distribution[l.litter_urine] || 0) + 1;

      if (l.energy_mood === 'LETHARGIC') {
        anomaly_alerts.push(`Letargo registrado el ${l.log_date}`);
      }
      if (l.food_intake === 'NONE' || l.food_intake === 'LOW') {
        anomaly_alerts.push(`Ingesta de comida reducida el ${l.log_date}`);
      }
      if (l.litter_urine === 'DIFFICULTY' || l.litter_urine === 'EXCESSIVE') {
        anomaly_alerts.push(`Anomalía urinaria (${l.litter_urine}) el ${l.log_date}`);
      }
    });

    return {
      pet_id: petId,
      total_logs: logs.length,
      logs_history: logs.slice(0, 14),
      mood_distribution,
      water_distribution,
      food_distribution,
      urine_distribution,
      anomaly_alerts: Array.from(new Set(anomaly_alerts))
    };
  },

  // --- Toxicity Directory ---
  async searchToxicity(queryStr?: string, category?: string): Promise<ToxicityItem[]> {
    let sql = 'SELECT * FROM toxicity_directory WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'ALL') {
      params.push(category.toUpperCase());
      sql += ` AND UPPER(category) = $${params.length}`;
    }

    if (queryStr && queryStr.trim() !== '') {
      params.push(`%${queryStr.trim()}%`);
      sql += ` AND (name ILIKE $${params.length} OR symptoms ILIKE $${params.length} OR action_required ILIKE $${params.length})`;
    }

    sql += ' ORDER BY danger_level DESC, name ASC';
    const res = await query(sql, params);
    return res.rows;
  },

  // --- Pain Assessments ---
  async getPainAssessments(petId: string): Promise<PainAssessment[]> {
    const res = await query(
      'SELECT * FROM pain_assessments WHERE pet_id = $1 ORDER BY assessment_date DESC',
      [petId]
    );
    return res.rows;
  },

  async createPainAssessment(assessment: PainAssessment): Promise<PainAssessment> {
    const id = assessment.id || `pain-${Date.now()}`;
    await query(
      `INSERT INTO pain_assessments (id, pet_id, assessment_date, score, ears_score, eyes_score, muzzle_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        assessment.pet_id,
        assessment.assessment_date || new Date(),
        assessment.score,
        assessment.ears_score || 0,
        assessment.eyes_score || 0,
        assessment.muzzle_score || 0,
        assessment.notes || ''
      ]
    );
    return { ...assessment, id };
  },

  // --- Clinical Events ---
  async getClinicalEvents(petId: string): Promise<ClinicalEvent[]> {
    const res = await query(
      'SELECT * FROM clinical_events WHERE pet_id = $1 ORDER BY event_date DESC',
      [petId]
    );
    return res.rows;
  },

  async createClinicalEvent(event: ClinicalEvent): Promise<ClinicalEvent> {
    const id = event.id || `ev-${Date.now()}`;
    await query(
      `INSERT INTO clinical_events (id, pet_id, event_type, event_date, title, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, event.pet_id, event.event_type, event.event_date, event.title, event.notes || '']
    );
    return { ...event, id };
  }
};
