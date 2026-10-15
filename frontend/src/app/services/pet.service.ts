import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';
import {
  Pet,
  DailyLog,
  ClinicalEvent,
  ToxicityItem,
  PainAssessment,
  DailyLogSummary
} from '../models/pet.models';

@Injectable({
  providedIn: 'root'
})
export class PetService {
  private readonly baseUrl = 'http://localhost:3000/api/v1';

  // Signals for state management - starts empty for real users
  public pets = signal<Pet[]>([]);
  public selectedPetId = signal<string>('');

  public activePet = computed<Pet | null>(() => {
    const list = this.pets();
    if (list.length === 0) return null;
    return list.find(p => p.id === this.selectedPetId()) || list[0];
  });

  public logsSummary = signal<DailyLogSummary | null>(null);
  public recentLogs = signal<DailyLog[]>([]);
  public toxicityItems = signal<ToxicityItem[]>([]);
  public clinicalEvents = signal<ClinicalEvent[]>([]);
  public isLoadingPets = signal<boolean>(false);

  // App-wide modal state
  public isEditModalOpen = signal<boolean>(false);
  public isAddModalOpen = signal<boolean>(false);

  public openEditModal() {
    this.isEditModalOpen.set(true);
  }

  public closeEditModal() {
    this.isEditModalOpen.set(false);
  }

  public openAddPetModal() {
    this.isAddModalOpen.set(true);
  }

  public closeAddPetModal() {
    this.isAddModalOpen.set(false);
  }

  constructor(private http: HttpClient) {
    this.refreshAll();
  }

  public selectPet(petId: string) {
    this.selectedPetId.set(petId);
    this.loadLogsSummary(petId);
    this.loadClinicalEvents(petId);
  }

  public refreshAll() {
    this.loadPets();
    this.loadToxicityDirectory();
  }

  // --- Pets ---
  public loadPets() {
    this.isLoadingPets.set(true);
    this.http.get<Pet[]>(`${this.baseUrl}/pets`).pipe(
      tap(pets => {
        this.isLoadingPets.set(false);
        const petList = pets || [];
        this.pets.set(petList);

        if (petList.length > 0) {
          const currentSelected = this.selectedPetId();
          const exists = petList.some(p => p.id === currentSelected);
          const activeId = exists ? currentSelected : petList[0].id;
          this.selectedPetId.set(activeId);
          this.loadLogsSummary(activeId);
          this.loadClinicalEvents(activeId);
        } else {
          this.selectedPetId.set('');
          this.logsSummary.set(null);
          this.recentLogs.set([]);
          this.clinicalEvents.set([]);
        }
      }),
      catchError(err => {
        this.isLoadingPets.set(false);
        console.warn('Error fetching pets from API', err);
        return of([]);
      })
    ).subscribe();
  }

  public addPet(petData: { name: string; species: 'CAT' | 'DOG'; weight_kg?: number; birth_date?: string; avatar_url?: string }): Observable<Pet> {
    return this.http.post<Pet>(`${this.baseUrl}/pets`, petData).pipe(
      tap(newPet => {
        this.pets.update(current => [...current, newPet]);
        this.selectedPetId.set(newPet.id);
        this.loadLogsSummary(newPet.id);
        this.loadClinicalEvents(newPet.id);
      })
    );
  }

  public updatePet(petId: string, updates: Partial<Pet>): Observable<Pet> {
    return this.http.put<Pet>(`${this.baseUrl}/pets/${petId}`, updates).pipe(
      tap(updatedPet => {
        this.pets.update(current => current.map(p => p.id === petId ? updatedPet : p));
      })
    );
  }

  // --- Logs & Summary ---
  public loadLogsSummary(petId: string) {
    if (!petId) {
      this.logsSummary.set(null);
      this.recentLogs.set([]);
      return;
    }

    this.http.get<DailyLogSummary>(`${this.baseUrl}/pets/${petId}/logs/summary`).pipe(
      tap(summary => {
        this.logsSummary.set(summary);
        if (summary.logs_history) {
          this.recentLogs.set(summary.logs_history);
        }
      }),
      catchError(err => {
        console.warn('Error fetching logs summary', err);
        const emptySummary: DailyLogSummary = {
          pet_id: petId,
          total_logs: 0,
          logs_history: [],
          mood_distribution: {},
          water_distribution: {},
          food_distribution: {},
          urine_distribution: {},
          anomaly_alerts: []
        };
        this.logsSummary.set(emptySummary);
        this.recentLogs.set([]);
        return of(emptySummary);
      })
    ).subscribe();
  }

  public saveDailyLog(log: DailyLog): Observable<any> {
    return this.http.post(`${this.baseUrl}/pets/${log.pet_id}/logs`, log).pipe(
      tap(() => {
        this.loadLogsSummary(log.pet_id);
      }),
      catchError(err => {
        console.warn('API error saving log, updating locally', err);
        const currentLogs = this.recentLogs();
        const filtered = currentLogs.filter(l => l.log_date !== log.log_date);
        this.recentLogs.set([log, ...filtered]);
        return of({ success: true, log });
      })
    );
  }

  // --- Toxicity Directory ---
  public loadToxicityDirectory(query?: string, category?: string) {
    let url = `${this.baseUrl}/toxicity-directory`;
    const params: string[] = [];
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (category && category !== 'ALL') params.push(`category=${encodeURIComponent(category)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    this.http.get<{ total: number; items: ToxicityItem[] }>(url).pipe(
      tap(res => {
        if (res && res.items) {
          this.toxicityItems.set(res.items);
        }
      }),
      catchError(err => {
        console.warn('Using default toxicity directory items', err);
        return of(null);
      })
    ).subscribe();
  }

  // --- Pain Assessments ---
  public savePainAssessment(assessment: PainAssessment): Observable<any> {
    return this.http.post(`${this.baseUrl}/pets/${assessment.pet_id}/pain-assessments`, assessment).pipe(
      tap(() => {
        this.loadLogsSummary(assessment.pet_id);
      }),
      catchError(err => {
        console.warn('API error saving pain assessment', err);
        return of({ success: true, assessment });
      })
    );
  }

  // --- Clinical Events ---
  public loadClinicalEvents(petId: string) {
    if (!petId) {
      this.clinicalEvents.set([]);
      return;
    }

    this.http.get<ClinicalEvent[]>(`${this.baseUrl}/pets/${petId}/clinical-events`).pipe(
      tap(events => {
        this.clinicalEvents.set(events || []);
      }),
      catchError(err => {
        console.warn('Error loading clinical events', err);
        this.clinicalEvents.set([]);
        return of([]);
      })
    ).subscribe();
  }
}
