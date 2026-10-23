import pg from 'pg';
import dotenv from 'dotenv';
import {
  User,
  Pet,
  PetVaccine,
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

export function getDefaultVaccines(petId: string, species: 'CAT' | 'DOG'): PetVaccine[] {
  if (species === 'CAT') {
    return [
      {
        id: `vax-${petId}-01`,
        pet_id: petId,
        vaccine_code: 'fel-core-triple',
        name: 'Triple Felina (FVRCP)',
        category: 'CORE',
        applied: false,
        notes: 'Protege contra Panleucopenia, Rinotraqueítis y Calicivirus. Esencial aún si vive en departamento.'
      },
      {
        id: `vax-${petId}-02`,
        pet_id: petId,
        vaccine_code: 'fel-mandatory-rabies',
        name: 'Antirrábica Felina',
        category: 'MANDATORY',
        applied: false,
        notes: 'Obligatoria por ley y salud pública contra zoonosis mortal.'
      },
      {
        id: `vax-${petId}-03`,
        pet_id: petId,
        vaccine_code: 'fel-lifestyle-felv',
        name: 'Leucemia Felina (FeLV)',
        category: 'LIFESTYLE',
        applied: false,
        notes: 'Recomendada para gatos con acceso al exterior o convivencia con otros gatos. Opcional si vive 100% en interior.'
      },
      {
        id: `vax-${petId}-04`,
        pet_id: petId,
        vaccine_code: 'fel-opt-chlamydia',
        name: 'Clamidiosis Felina',
        category: 'LIFESTYLE',
        applied: false,
        notes: 'Opcional según riesgo de conjuntivitis bacteriana y convivencia en comunidades.'
      }
    ];
  } else {
    return [
      {
        id: `vax-${petId}-01`,
        pet_id: petId,
        vaccine_code: 'can-core-multiple',
        name: 'Polivalente Canina (Séxtuple)',
        category: 'CORE',
        applied: false,
        notes: 'Protege contra Moquillo, Parvovirus, Hepatitis y Parainfluenza canina.'
      },
      {
        id: `vax-${petId}-02`,
        pet_id: petId,
        vaccine_code: 'can-mandatory-rabies',
        name: 'Antirrábica Canina',
        category: 'MANDATORY',
        applied: false,
        notes: 'Obligatoria por ley nacional anualmente por salud pública.'
      },
      {
        id: `vax-${petId}-03`,
        pet_id: petId,
        vaccine_code: 'can-core-lepto',
        name: 'Leptospirosis Canina',
        category: 'CORE',
        applied: false,
        notes: 'Protege contra bacteria Leptospira (orina de roedores y aguas estancadas). Zoonosis.'
      },
      {
        id: `vax-${petId}-04`,
        pet_id: petId,
        vaccine_code: 'can-lifestyle-bordetella',
        name: 'Tos de las Perreras (Bordetella)',
        category: 'LIFESTYLE',
        applied: false,
        notes: 'Opcional según estilo de vida. Recomendada si asiste a guarderías, paseos grupales o peluquerías caninas.'
      },
      {
        id: `vax-${petId}-05`,
        pet_id: petId,
        vaccine_code: 'can-opt-giardia',
        name: 'Giardia Canina',
        category: 'LIFESTYLE',
        applied: false,
        notes: 'Opcional en zonas húmedas o aguas estancadas.'
      }
    ];
  }
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

  async findUserByToken(token: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE verification_token = $1', [token]);
    return res.rows[0] || null;
  },

  async findUserByResetToken(token: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE reset_password_token = $1', [token]);
    return res.rows[0] || null;
  },

  async createUser(user: User): Promise<User> {
    await query(
      `INSERT INTO users (id, email, password_hash, name, created_at, is_verified, verification_code, verification_token, verification_expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user.id,
        user.email,
        user.password_hash,
        user.name,
        user.created_at || new Date(),
        user.is_verified ?? false,
        user.verification_code || null,
        user.verification_token || null,
        user.verification_expires_at || null
      ]
    );
    return user;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const existing = await this.findUserById(id);
    if (!existing) return null;

    const email = updates.email !== undefined ? updates.email : existing.email;
    const password_hash = updates.password_hash !== undefined ? updates.password_hash : existing.password_hash;
    const name = updates.name !== undefined ? updates.name : existing.name;
    const is_verified = updates.is_verified !== undefined ? updates.is_verified : existing.is_verified;
    const verification_code = updates.verification_code !== undefined ? updates.verification_code : existing.verification_code;
    const verification_token = updates.verification_token !== undefined ? updates.verification_token : existing.verification_token;
    const verification_expires_at = updates.verification_expires_at !== undefined ? updates.verification_expires_at : existing.verification_expires_at;
    const reset_password_code = updates.reset_password_code !== undefined ? updates.reset_password_code : existing.reset_password_code;
    const reset_password_token = updates.reset_password_token !== undefined ? updates.reset_password_token : existing.reset_password_token;
    const reset_password_expires_at = updates.reset_password_expires_at !== undefined ? updates.reset_password_expires_at : existing.reset_password_expires_at;

    await query(
      `UPDATE users 
       SET email = $1, password_hash = $2, name = $3, is_verified = $4, 
           verification_code = $5, verification_token = $6, verification_expires_at = $7,
           reset_password_code = $8, reset_password_token = $9, reset_password_expires_at = $10
       WHERE id = $11`,
      [
        email, password_hash, name, is_verified, 
        verification_code, verification_token, verification_expires_at,
        reset_password_code, reset_password_token, reset_password_expires_at,
        id
      ]
    );

    return this.findUserById(id);
  },

  async verifyUser(userId: string): Promise<User | null> {
    await query(
      `UPDATE users 
       SET is_verified = TRUE, verification_code = NULL, verification_token = NULL, verification_expires_at = NULL 
       WHERE id = $1`,
      [userId]
    );
    return this.findUserById(userId);
  },

  async deleteUser(userId: string): Promise<boolean> {
    const res = await query('DELETE FROM users WHERE id = $1', [userId]);
    return (res.rowCount ?? 0) > 0;
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
      'INSERT INTO pets (id, user_id, name, species, sex, is_neutered, neutered_date, birth_date, weight_kg, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        pet.id,
        pet.user_id,
        pet.name,
        pet.species,
        pet.sex || 'FEMALE',
        pet.is_neutered !== undefined ? pet.is_neutered : false,
        pet.neutered_date || null,
        pet.birth_date,
        pet.weight_kg,
        pet.avatar_url || ''
      ]
    );

    // Inicializar vacunas estándar
    const defaults = getDefaultVaccines(pet.id, pet.species);
    for (const v of defaults) {
      await query(
        `INSERT INTO pet_vaccines (id, pet_id, vaccine_code, name, category, applied, applied_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (pet_id, vaccine_code) DO NOTHING`,
        [v.id, v.pet_id, v.vaccine_code, v.name, v.category, v.applied, v.applied_date || null, v.notes || '']
      );
    }

    return pet;
  },

  async updatePet(petId: string, updates: Partial<Pet>): Promise<Pet | null> {
    const existing = await this.getPetById(petId);
    if (!existing) return null;

    const name = updates.name !== undefined ? updates.name : existing.name;
    const species = updates.species !== undefined ? updates.species : existing.species;
    const sex = updates.sex !== undefined ? updates.sex : existing.sex;
    const is_neutered = updates.is_neutered !== undefined ? updates.is_neutered : existing.is_neutered;
    const neutered_date = updates.neutered_date !== undefined ? updates.neutered_date : existing.neutered_date;
    const birth_date = updates.birth_date !== undefined ? updates.birth_date : existing.birth_date;
    const weight_kg = updates.weight_kg !== undefined ? Number(updates.weight_kg) : existing.weight_kg;
    const avatar_url = updates.avatar_url !== undefined ? updates.avatar_url : existing.avatar_url;

    await query(
      `UPDATE pets 
       SET name = $1, species = $2, sex = $3, is_neutered = $4, neutered_date = $5, birth_date = $6, weight_kg = $7, avatar_url = $8
       WHERE id = $9`,
      [name, species, sex || 'FEMALE', is_neutered, neutered_date || null, birth_date, weight_kg, avatar_url, petId]
    );

    return this.getPetById(petId);
  },

  async deletePet(petId: string): Promise<boolean> {
    const res = await query('DELETE FROM pets WHERE id = $1', [petId]);
    return (res.rowCount ?? 0) > 0;
  },

  // --- Vaccines ---
  async getVaccinesByPet(petId: string): Promise<PetVaccine[]> {
    const res = await query(
      'SELECT * FROM pet_vaccines WHERE pet_id = $1 ORDER BY created_at ASC',
      [petId]
    );

    if (res.rows.length === 0) {
      const pet = await this.getPetById(petId);
      if (pet) {
        const defaults = getDefaultVaccines(petId, pet.species);
        for (const v of defaults) {
          await query(
            `INSERT INTO pet_vaccines (id, pet_id, vaccine_code, name, category, applied, applied_date, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (pet_id, vaccine_code) DO NOTHING`,
            [v.id, v.pet_id, v.vaccine_code, v.name, v.category, v.applied, v.applied_date || null, v.notes || '']
          );
        }
        const updated = await query(
          'SELECT * FROM pet_vaccines WHERE pet_id = $1 ORDER BY created_at ASC',
          [petId]
        );
        return updated.rows;
      }
    }

    return res.rows;
  },

  async updateVaccine(petId: string, vaccineCode: string, updates: Partial<PetVaccine>): Promise<PetVaccine | null> {
    const existing = await query(
      'SELECT * FROM pet_vaccines WHERE pet_id = $1 AND vaccine_code = $2',
      [petId, vaccineCode]
    );

    if (existing.rows.length === 0) {
      return null;
    }

    const current = existing.rows[0];
    const applied = updates.applied !== undefined ? updates.applied : current.applied;
    const applied_date = updates.applied_date !== undefined ? updates.applied_date : current.applied_date;
    const notes = updates.notes !== undefined ? updates.notes : current.notes;

    await query(
      `UPDATE pet_vaccines 
       SET applied = $1, applied_date = $2, notes = $3
       WHERE pet_id = $4 AND vaccine_code = $5`,
      [applied, applied_date || null, notes || '', petId, vaccineCode]
    );

    // Si se marcó como aplicada con fecha, sincronizar con clinical_events
    if (applied && applied_date) {
      const existingEvent = await query(
        `SELECT id FROM clinical_events WHERE pet_id = $1 AND title ILIKE $2`,
        [petId, `%${current.name}%`]
      );
      if (existingEvent.rows.length === 0) {
        await query(
          `INSERT INTO clinical_events (id, pet_id, event_type, event_date, title, notes)
           VALUES ($1, $2, 'VACCINE', $3, $4, $5)`,
          [`ev-vax-${Date.now()}`, petId, applied_date, `Vacunación: ${current.name}`, notes || 'Registro actualizado desde cartilla de vacunación']
        );
      }
    }

    const res = await query(
      'SELECT * FROM pet_vaccines WHERE pet_id = $1 AND vaccine_code = $2',
      [petId, vaccineCode]
    );
    return res.rows[0] || null;
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
