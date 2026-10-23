import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
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
import { getDefaultVaccines } from './postgres.js';

interface DatabaseData {
  users: User[];
  pets: Pet[];
  daily_logs: DailyLog[];
  clinical_events: ClinicalEvent[];
  toxicity_directory: ToxicityItem[];
  pain_assessments: PainAssessment[];
  pet_vaccines?: PetVaccine[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'store.json');

const INITIAL_DATA: DatabaseData = {
  users: [
    {
      id: 'usr-001',
      email: 'demo@mascotas.care',
      password_hash: bcrypt.hashSync('demo123', 10),
      name: 'Amparo Rodríguez',
      created_at: new Date().toISOString(),
      is_verified: true
    }
  ],
  pets: [
    {
      id: 'pet-cat-01',
      user_id: 'usr-001',
      name: 'Luna',
      species: 'CAT',
      sex: 'FEMALE',
      is_neutered: true,
      neutered_date: '2022-10-10',
      birth_date: '2022-04-15',
      weight_kg: 3.85,
      avatar_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 'pet-dog-02',
      user_id: 'usr-001',
      name: 'Chester',
      species: 'DOG',
      sex: 'MALE',
      is_neutered: true,
      neutered_date: '2022-03-15',
      birth_date: '2021-08-10',
      weight_kg: 26.50,
      avatar_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80'
    }
  ],
  daily_logs: [
    {
      id: 'log-01',
      pet_id: 'pet-cat-01',
      log_date: '2026-10-09',
      water_intake: 'NORMAL',
      food_intake: 'NORMAL',
      litter_urine: 'NORMAL',
      energy_mood: 'PLAYFUL',
      notes: 'Jugó animadamente y comió su ración completa.',
      created_at: '2026-10-09T18:00:00.000Z'
    },
    {
      id: 'log-02',
      pet_id: 'pet-cat-01',
      log_date: '2026-10-10',
      water_intake: 'NORMAL',
      food_intake: 'NORMAL',
      litter_urine: 'NORMAL',
      energy_mood: 'ACTIVE',
      notes: 'Día tranquilo con buen apetito.',
      created_at: '2026-10-10T19:00:00.000Z'
    },
    {
      id: 'log-03',
      pet_id: 'pet-cat-01',
      log_date: '2026-10-11',
      water_intake: 'HIGH',
      food_intake: 'NORMAL',
      litter_urine: 'EXCESSIVE',
      energy_mood: 'CALM',
      notes: 'Bebió más agua de lo habitual por día templado.',
      created_at: '2026-10-11T20:00:00.000Z'
    },
    {
      id: 'log-04',
      pet_id: 'pet-cat-01',
      log_date: '2026-10-12',
      water_intake: 'NORMAL',
      food_intake: 'LOW',
      litter_urine: 'NORMAL',
      energy_mood: 'LETHARGIC',
      notes: 'Comió la mitad del plato. Se observa algo decaída.',
      created_at: '2026-10-12T20:30:00.000Z'
    },
    {
      id: 'log-05',
      pet_id: 'pet-cat-01',
      log_date: '2026-10-13',
      water_intake: 'NORMAL',
      food_intake: 'NORMAL',
      litter_urine: 'NORMAL',
      energy_mood: 'ACTIVE',
      notes: 'Recuperó energía habitual tras cepillado matutino.',
      created_at: '2026-10-13T19:00:00.000Z'
    },
    {
      id: 'log-06',
      pet_id: 'pet-cat-01',
      log_date: '2026-10-14',
      water_intake: 'NORMAL',
      food_intake: 'NORMAL',
      litter_urine: 'NORMAL',
      energy_mood: 'PLAYFUL',
      notes: 'Excelente estado de ánimo, pide caricias.',
      created_at: '2026-10-14T18:00:00.000Z'
    }
  ],
  clinical_events: [
    {
      id: 'ev-01',
      pet_id: 'pet-cat-01',
      event_type: 'VACCINE',
      event_date: '2026-03-10',
      title: 'Vacuna Triple Felina (Refuerzo)',
      notes: 'Vacuna anual administrada sin reacciones adversas.'
    },
    {
      id: 'ev-02',
      pet_id: 'pet-cat-01',
      event_type: 'DEWORMING',
      event_date: '2026-05-15',
      title: 'Desparasitación Interna (Praziquantel)',
      notes: 'Comprimido palatable tolerado favorablemente.'
    },
    {
      id: 'ev-03',
      pet_id: 'pet-dog-02',
      event_type: 'VACCINE',
      event_date: '2026-02-20',
      title: 'Vacuna Séxtuple Canina y Antirrábica',
      notes: 'Control de peso ok (26.5kg).'
    }
  ],
  toxicity_directory: [
    {
      id: 'tox-01',
      name: 'Lirio (Lilium / Hemerocallis)',
      category: 'PLANT',
      danger_level: 'FATAL',
      symptoms: 'Vómitos, sialorrea, letargo extremo, anuria y fallo renal agudo irreversible en 24-72h.',
      action_required: 'Acudir a urgencias veterinarias de inmediato. Muy tóxico para gatos incluso en pequeñas cantidades de polen o agua del jarrón.',
      target_species: 'CAT'
    },
    {
      id: 'tox-02',
      name: 'Chocolate (Teobromina)',
      category: 'FOOD',
      danger_level: 'SEVERE',
      symptoms: 'Vómitos, diarrea, sed excesiva, jadeo continuo, hiperactividad, arritmia cardíaca y convulsiones.',
      action_required: 'Urgencia veterinaria. No inducir el vómito si pasaron más de 2h o si el animal está desorientado.',
      target_species: 'ALL'
    },
    {
      id: 'tox-03',
      name: 'Ibuprofeno / Medicamentos AINEs',
      category: 'MEDICATION',
      danger_level: 'FATAL',
      symptoms: 'Úlceras gástricas, vómito con sangre, heces oscuras, dolor abdominal, insuficiencia renal aguda y shock.',
      action_required: 'Acudir a urgencias de inmediato. Llevar la caja del medicamento para calcular la dosis tóxica por kilo.',
      target_species: 'ALL'
    },
    {
      id: 'tox-04',
      name: 'Uvas y Pasas',
      category: 'FOOD',
      danger_level: 'SEVERE',
      symptoms: 'Vómito dentro de las primeras horas, diarrea, letargo severo, deshidratación y daño renal repentino.',
      action_required: 'Contactar a clínica de inmediato para lavado gástrico y fluidoterapia intravenosa preventiva.',
      target_species: 'DOG'
    },
    {
      id: 'tox-05',
      name: 'Paracetamol (Acetaminofén)',
      category: 'MEDICATION',
      danger_level: 'FATAL',
      symptoms: 'Methemoglobinemia, mucosas cianóticas (azuladas/grisáceas), hipotermia, hinchazón facial y necrosis hepática.',
      action_required: 'Urgencia veterinaria máxima. Los gatos carecen de la enzima hepática para metabolizarlo. Antídoto: N-acetilcisteína.',
      target_species: 'ALL'
    },
    {
      id: 'tox-06',
      name: 'Cuerpo Extraño Lineal (Hilo, Lana, Hilo dental)',
      category: 'OBJECT',
      danger_level: 'SEVERE',
      symptoms: 'Vómitos repetitivos, dolor abdominal palpable, decaimiento progresivo, postura encorvada.',
      action_required: 'NUNCA tirar del hilo visible en la boca o el recto; puede seccionar la pared intestinal. Acudir a urgencias quirúrgicas.',
      target_species: 'CAT'
    },
    {
      id: 'tox-07',
      name: 'Lavandina / Cloro domésico',
      category: 'CHEMICAL',
      danger_level: 'SEVERE',
      symptoms: 'Quemaduras químicas en mucosa oral y esófago, salivación profusa, tos espasmódica y náuseas.',
      action_required: 'NO provocar el vómito para no quemar el esófago nuevamente. Ofrecer agua fresca y llevar a clínica de inmediato.',
      target_species: 'ALL'
    },
    {
      id: 'tox-08',
      name: 'Cebolla, Ajo y Puerro',
      category: 'FOOD',
      danger_level: 'MODERATE',
      symptoms: 'Anemia hemolítica (cuerpos de Heinz), debilidad, encías pálidas, letargo y orina rojiza.',
      action_required: 'Consultar al veterinario para control de glóbulos rojos y soporte vitamínico.',
      target_species: 'ALL'
    },
    {
      id: 'tox-09',
      name: 'Monstera / Costilla de Adán',
      category: 'PLANT',
      danger_level: 'MODERATE',
      symptoms: 'Irritación oral intensa por oxalatos de calcio insolubles, salivación, dificultad para deglutir.',
      action_required: 'Limpiar la cavidad oral con agua fría o leche para precipitar cristales de oxalato. Si persiste inflamación, acudir a clínica.',
      target_species: 'ALL'
    },
    {
      id: 'tox-10',
      name: 'Poinsettia / Flor de Pascua',
      category: 'PLANT',
      danger_level: 'MILD',
      symptoms: 'Salivación moderada, irritación de piel y encías, náusea transitoria autolimitada.',
      action_required: 'Lavar boca y pelaje con agua tibia. Monitorear síntomas en el hogar y ofrecer agua fresca.',
      target_species: 'ALL'
    }
  ],
  pain_assessments: [
    {
      id: 'pain-01',
      pet_id: 'pet-cat-01',
      assessment_date: '2026-10-12T18:30:00.000Z',
      score: 1,
      ears_score: 1,
      eyes_score: 0,
      muzzle_score: 0,
      notes: 'Orejas ligeramente rotadas; ojos y hocico relajados.'
    }
  ]
};

class Repository {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading db file, falling back to initial data', e);
    }
    this.saveData(INITIAL_DATA);
    return INITIAL_DATA;
  }

  private saveData(data: DatabaseData) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving data to db file', e);
    }
  }

  // --- Users ---
  findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  findUserByToken(token: string): User | undefined {
    return this.data.users.find(u => u.verification_token === token);
  }

  findUserByResetToken(token: string): User | undefined {
    return this.data.users.find(u => u.reset_password_token === token);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.saveData(this.data);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    const updated: User = {
      ...this.data.users[idx],
      ...updates
    };
    this.data.users[idx] = updated;
    this.saveData(this.data);
    return updated;
  }

  verifyUser(userId: string): User | undefined {
    return this.updateUser(userId, {
      is_verified: true,
      verification_code: null,
      verification_token: null,
      verification_expires_at: null
    });
  }

  deleteUser(userId: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== userId);
    const userPets = this.data.pets.filter(p => p.user_id === userId);
    userPets.forEach(p => this.deletePet(p.id));
    this.saveData(this.data);
    return this.data.users.length < initialLen;
  }

  // --- Pets ---
  getPetsByUser(userId: string): Pet[] {
    return this.data.pets.filter(p => p.user_id === userId);
  }

  getPetById(petId: string): Pet | undefined {
    return this.data.pets.find(p => p.id === petId);
  }

  createPet(pet: Pet): Pet {
    this.data.pets.push(pet);
    this.saveData(this.data);
    return pet;
  }

  updatePet(petId: string, updates: Partial<Pet>): Pet | undefined {
    const index = this.data.pets.findIndex(p => p.id === petId);
    if (index === -1) return undefined;
    const existing = this.data.pets[index];
    const updated: Pet = {
      ...existing,
      ...updates,
      id: existing.id,
      user_id: existing.user_id
    };
    this.data.pets[index] = updated;
    this.saveData(this.data);
    return updated;
  }

  deletePet(petId: string): boolean {
    const initialLen = this.data.pets.length;
    this.data.pets = this.data.pets.filter(p => p.id !== petId);
    this.data.daily_logs = this.data.daily_logs.filter(l => l.pet_id !== petId);
    this.data.clinical_events = this.data.clinical_events.filter(e => e.pet_id !== petId);
    this.data.pain_assessments = this.data.pain_assessments.filter(a => a.pet_id !== petId);
    if (this.data.pet_vaccines) {
      this.data.pet_vaccines = this.data.pet_vaccines.filter(v => v.pet_id !== petId);
    }
    this.saveData(this.data);
    return this.data.pets.length < initialLen;
  }

  // --- Vaccines ---
  getVaccinesByPet(petId: string): PetVaccine[] {
    if (!this.data.pet_vaccines) {
      this.data.pet_vaccines = [];
    }
    const pet = this.getPetById(petId);
    let vaxes = this.data.pet_vaccines.filter(v => v.pet_id === petId);
    if (vaxes.length === 0 && pet) {
      const defaults = getDefaultVaccines(petId, pet.species);
      this.data.pet_vaccines.push(...defaults);
      this.saveData(this.data);
      vaxes = defaults;
    }
    return vaxes;
  }

  updateVaccine(petId: string, vaccineCode: string, updates: Partial<PetVaccine>): PetVaccine | undefined {
    if (!this.data.pet_vaccines) {
      this.data.pet_vaccines = [];
    }
    const index = this.data.pet_vaccines.findIndex(v => v.pet_id === petId && v.vaccine_code === vaccineCode);
    if (index === -1) return undefined;
    const existing = this.data.pet_vaccines[index];
    const updated: PetVaccine = {
      ...existing,
      ...updates
    };
    this.data.pet_vaccines[index] = updated;

    // Sincronizar evento clínico si se aplicó
    if (updated.applied && updated.applied_date) {
      const existingEv = this.data.clinical_events.find(
        e => e.pet_id === petId && e.title.includes(existing.name)
      );
      if (!existingEv) {
        this.data.clinical_events.push({
          id: `ev-vax-${Date.now()}`,
          pet_id: petId,
          event_type: 'VACCINE',
          event_date: updated.applied_date,
          title: `Vacunación: ${existing.name}`,
          notes: updated.notes || 'Registro actualizado desde cartilla'
        });
      }
    }

    this.saveData(this.data);
    return updated;
  }

  // --- Daily Logs ---
  getLogsByPet(petId: string): DailyLog[] {
    return this.data.daily_logs
      .filter(l => l.pet_id === petId)
      .sort((a, b) => b.log_date.localeCompare(a.log_date));
  }

  // Upsert daily log (Restricción de unicidad: pet_id, log_date)
  upsertDailyLog(log: DailyLog): { log: DailyLog; isNew: boolean } {
    const existingIndex = this.data.daily_logs.findIndex(
      l => l.pet_id === log.pet_id && l.log_date === log.log_date
    );

    if (existingIndex >= 0) {
      const updated: DailyLog = {
        ...this.data.daily_logs[existingIndex],
        ...log,
        id: this.data.daily_logs[existingIndex].id
      };
      this.data.daily_logs[existingIndex] = updated;
      this.saveData(this.data);
      return { log: updated, isNew: false };
    } else {
      this.data.daily_logs.push(log);
      this.saveData(this.data);
      return { log, isNew: true };
    }
  }

  getLogsSummary(petId: string): DailyLogSummary {
    const logs = this.getLogsByPet(petId);
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

      // Anomalía checks
      if (l.energy_mood === 'LETHARGIC') {
        anomaly_alerts.push(`Letargo registrado el ${l.log_date}`);
      }
      if (l.food_intake === 'NONE' || l.food_intake === 'LOW') {
        anomaly_alerts.push(`Ingesta de alimento reducida el ${l.log_date}`);
      }
      if (l.litter_urine === 'DIFFICULTY' || l.litter_urine === 'EXCESSIVE') {
        anomaly_alerts.push(`Anomalía urinaria (${l.litter_urine}) el ${l.log_date}`);
      }
    });

    return {
      pet_id: petId,
      total_logs: logs.length,
      logs_history: logs.slice(0, 14), // Last 14 records for charts
      mood_distribution,
      water_distribution,
      food_distribution,
      urine_distribution,
      anomaly_alerts: Array.from(new Set(anomaly_alerts))
    };
  }

  // --- Toxicity Directory ---
  searchToxicity(query?: string, category?: string): ToxicityItem[] {
    let results = this.data.toxicity_directory;
    if (category && category !== 'ALL') {
      results = results.filter(t => t.category.toUpperCase() === category.toUpperCase());
    }
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      results = results.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.symptoms.toLowerCase().includes(q) ||
        t.action_required.toLowerCase().includes(q)
      );
    }
    return results;
  }

  // --- Pain Assessments ---
  getPainAssessments(petId: string): PainAssessment[] {
    return this.data.pain_assessments
      .filter(p => p.pet_id === petId)
      .sort((a, b) => b.assessment_date.localeCompare(a.assessment_date));
  }

  createPainAssessment(assessment: PainAssessment): PainAssessment {
    this.data.pain_assessments.push(assessment);
    this.saveData(this.data);
    return assessment;
  }

  // --- Clinical Events ---
  getClinicalEvents(petId: string): ClinicalEvent[] {
    return this.data.clinical_events
      .filter(e => e.pet_id === petId)
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
  }

  createClinicalEvent(event: ClinicalEvent): ClinicalEvent {
    this.data.clinical_events.push(event);
    this.saveData(this.data);
    return event;
  }
}

export const db = new Repository();
