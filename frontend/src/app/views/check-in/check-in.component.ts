import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PetService } from '../../services/pet.service';
import {
  DailyLog,
  WaterIntake,
  FoodIntake,
  LitterUrine,
  EnergyMood
} from '../../models/pet.models';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="check-in-view">
      
      <div class="view-header">
        <h1>Check-in Diario</h1>
        <p class="text-muted">Registro de 1 toque para <strong>{{ activePet()?.name || 'tu mascota' }}</strong></p>
      </div>

      <!-- Selector y Filtros de Fecha de Evaluación -->
      <section class="card date-filter-card">
        <div class="date-header-row">
          <label for="logDate" class="date-label">📅 Fecha de Evaluación:</label>
          <div class="quick-date-pills">
            <button 
              type="button" 
              class="quick-date-btn"
              [class.quick-date-btn--active]="selectedDate() === today"
              (click)="setDate(today)">
              Hoy
            </button>
            <button 
              type="button" 
              class="quick-date-btn"
              [class.quick-date-btn--active]="selectedDate() === yesterday"
              (click)="setDate(yesterday)">
              Ayer
            </button>
            <button 
              type="button" 
              class="quick-date-btn"
              [class.quick-date-btn--active]="selectedDate() === twoDaysAgo"
              (click)="setDate(twoDaysAgo)">
              Hace 2 días
            </button>
            <button 
              type="button" 
              class="quick-date-btn"
              [class.quick-date-btn--active]="selectedDate() === threeDaysAgo"
              (click)="setDate(threeDaysAgo)">
              Hace 3 días
            </button>
          </div>
        </div>

        <input 
          id="logDate" 
          type="date" 
          [max]="today"
          class="form-input date-input" 
          [ngModel]="selectedDate()"
          (ngModelChange)="onDateSelect($event)" />

        @if (isFutureDate()) {
          <div class="date-warning">
            <div class="date-warning-text">
              <span>⚠️ La fecha de evaluación no puede ser futura. Selecciona hoy o un día anterior.</span>
            </div>
            <button type="button" class="btn-reset-today" (click)="setDate(today)">
              📅 Establecer Fecha de Hoy
            </button>
          </div>
        }

        @if (existingLogForDate()) {
          <div class="existing-log-notice">
            <span>✏️ Registro existente para esta fecha. Modifica los valores y guarda para actualizarlo.</span>
          </div>
        }
      </section>

      <!-- 1. Ingesta de Agua -->
      <section class="card form-section">
        <div class="section-title-row">
          <span class="section-icon">💧</span>
          <div>
            <h3>Consumo de Agua</h3>
            <span class="text-muted">¿Cuánto bebió respecto a su ritmo habitual?</span>
          </div>
        </div>

        <div class="pills-group">
          @for (option of waterOptions; track option.value) {
            <button 
              type="button" 
              class="btn-pill"
              [class.btn-pill--active]="waterIntake() === option.value"
              (click)="waterIntake.set(option.value)">
              {{ option.label }}
            </button>
          }
        </div>
      </section>

      <!-- 2. Ingesta de Comida -->
      <section class="card form-section">
        <div class="section-title-row">
          <span class="section-icon">🍲</span>
          <div>
            <h3>Alimentación</h3>
            <span class="text-muted">Proporción de ración consumida</span>
          </div>
        </div>

        <div class="pills-group">
          @for (option of foodOptions; track option.value) {
            <button 
              type="button" 
              class="btn-pill"
              [class.btn-pill--active]="foodIntake() === option.value"
              (click)="foodIntake.set(option.value)">
              {{ option.label }}
            </button>
          }
        </div>
      </section>

      <!-- 3. Arenero / Orina -->
      <section class="card form-section">
        <div class="section-title-row">
          <span class="section-icon">🐾</span>
          <div>
            <h3>Orina / Deposiciones</h3>
            <span class="text-muted">Monitoreo de micción y esfuerzo</span>
          </div>
        </div>

        <div class="pills-grid">
          @for (option of urineOptions; track option.value) {
            <button 
              type="button" 
              class="btn-pill"
              [class.btn-pill--active]="litterUrine() === option.value"
              [class.btn-pill--warning]="option.warning && litterUrine() === option.value"
              (click)="litterUrine.set(option.value)">
              {{ option.label }}
            </button>
          }
        </div>
      </section>

      <!-- 4. Ánimo y Energía -->
      <section class="card form-section">
        <div class="section-title-row">
          <span class="section-icon">⚡</span>
          <div>
            <h3>Estado de Ánimo</h3>
            <span class="text-muted">Nivel de interacción y vitalidad</span>
          </div>
        </div>

        <div class="pills-grid">
          @for (option of moodOptions; track option.value) {
            <button 
              type="button" 
              class="btn-pill"
              [class.btn-pill--active]="energyMood() === option.value"
              (click)="energyMood.set(option.value)">
              {{ option.icon }} {{ option.label }}
            </button>
          }
        </div>
      </section>

      <!-- 5. Notas u Observaciones -->
      <section class="card form-section">
        <div class="section-title-row">
          <span class="section-icon">📝</span>
          <div>
            <h3>Observaciones Clave</h3>
            <span class="text-muted">Detalles específicos del día (máx 500 carac.)</span>
          </div>
        </div>

        <textarea 
          rows="3" 
          maxlength="500"
          class="form-input note-textarea" 
          placeholder="Ej: Jugó 20 min con su juguete preferido, comió todo con apetito..."
          [ngModel]="notes()"
          (ngModelChange)="notes.set($event)">
        </textarea>
        <span class="char-counter">{{ notes().length }} / 500</span>
      </section>

      <!-- Success Banner -->
      @if (saveSuccess()) {
        <div class="success-banner">
          <span>✅ ¡Check-in registrado con éxito!</span>
        </div>
      }

      <!-- Error Banner -->
      @if (saveError()) {
        <div class="error-banner">
          <span>⚠️ {{ saveError() }}</span>
        </div>
      }

      <!-- Botón Principal de Guardado (#E07A5F Naranja Terracota) -->
      <button 
        type="button" 
        class="btn-primary-action save-btn"
        [disabled]="isSaving() || isFutureDate()"
        (click)="submitLog()">
        @if (isSaving()) {
          Guardando...
        } @else {
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {{ existingLogForDate() ? 'Actualizar Registro del Día' : 'Guardar Registro Diario' }}
        }
      </button>

      <!-- Historial Reciente con Filtros y Espaciado Amplio -->
      <section class="card recent-logs-card">
        <div class="history-head-row">
          <div>
            <h3>Historial de Bitácora</h3>
            <span class="text-muted">Registros guardados en base de datos</span>
          </div>
          <span class="history-count-badge">{{ filteredRecentLogs().length }} registros</span>
        </div>

        <!-- Filtros del historial -->
        <div class="history-filter-pills">
          <button 
            type="button" 
            class="h-filter-btn" 
            [class.h-filter-btn--active]="historyFilter() === 'ALL'"
            (click)="historyFilter.set('ALL')">
            Todos
          </button>
          <button 
            type="button" 
            class="h-filter-btn" 
            [class.h-filter-btn--active]="historyFilter() === 'WEEK'"
            (click)="historyFilter.set('WEEK')">
            Últimos 7 días
          </button>
          <button 
            type="button" 
            class="h-filter-btn" 
            [class.h-filter-btn--active]="historyFilter() === 'MONTH'"
            (click)="historyFilter.set('MONTH')">
            Últimos 30 días
          </button>
          <button 
            type="button" 
            class="h-filter-btn" 
            [class.h-filter-btn--active]="historyFilter() === 'NOTES'"
            (click)="historyFilter.set('NOTES')">
            Con notas
          </button>
        </div>

        <div class="history-list">
          @for (log of filteredRecentLogs(); track log.id || log.log_date) {
            <article class="history-item" (click)="setDate(log.log_date)">
              <div class="history-item-top">
                <span class="history-date-badge">{{ formatLogDate(log.log_date) }}</span>
                <span class="history-mood-tag">{{ getMoodEmoji(log.energy_mood) }} {{ translateMood(log.energy_mood) }}</span>
              </div>

              <div class="history-metrics-row">
                <span class="metric-mini-tag">💧 Agua: {{ translateIntake(log.water_intake) }}</span>
                <span class="metric-mini-tag">🍲 Comida: {{ translateIntake(log.food_intake) }}</span>
                <span class="metric-mini-tag" [class.metric-mini-tag--warn]="log.litter_urine === 'DIFFICULTY' || log.litter_urine === 'NONE'">
                  🐾 Orina: {{ translateUrine(log.litter_urine) }}
                </span>
              </div>

              @if (log.notes) {
                <div class="history-note-preview">
                  “{{ log.notes }}”
                </div>
              }
            </article>
          } @empty {
            <div class="history-empty">
              <span>Aún no hay registros en este período. Completa el formulario arriba para empezar.</span>
            </div>
          }
        </div>
      </section>

      <!-- Espaciador Inferior Extra: Evita que el BottomNav tape el contenido final -->
      <div class="bottom-clearance-spacer"></div>

    </div>
  `,
  styles: [`
    .check-in-view {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding-bottom: 2rem;
    }

    .view-header {
      h1 {
        font-size: 1.45rem;
        margin: 0;
      }
    }

    .date-filter-card {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;

      .date-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.4rem;

        .date-label {
          font-size: 0.85rem;
          font-weight: 700;
        }

        .quick-date-pills {
          display: flex;
          gap: 0.35rem;

          .quick-date-btn {
            background-color: rgba(45, 58, 47, 0.08);
            border: none;
            padding: 0.25rem 0.55rem;
            border-radius: var(--radius-pill);
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--color-text-main);
            cursor: pointer;
            transition: all 0.2s ease;

            &--active {
              background-color: var(--color-active);
              color: #ffffff;
            }
          }
        }
      }

      .date-input {
        padding: 0.45rem 0.85rem;
        font-size: 0.95rem;
        font-weight: 600;
      }

      .date-warning {
        background-color: var(--color-alert-light);
        color: #9c361c;
        border: 1px solid var(--color-alert);
        padding: 0.6rem 0.85rem;
        border-radius: 1rem;
        font-size: 0.78rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        .date-warning-text {
          font-weight: 700;
          line-height: 1.35;
        }

        .btn-reset-today {
          align-self: flex-start;
          background-color: var(--color-alert);
          color: #ffffff;
          border: none;
          padding: 0.3rem 0.7rem;
          border-radius: var(--radius-pill);
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s ease;

          &:hover {
            opacity: 0.9;
          }
        }
      }

      .existing-log-notice {
        background-color: #ecfdf5;
        color: #065f46;
        border: 1px solid #6ee7b7;
        padding: 0.45rem 0.75rem;
        border-radius: var(--radius-pill);
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .section-title-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;

      .section-icon {
        font-size: 1.4rem;
      }

      h3 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
      }
    }

    .pills-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;

      .btn-pill {
        flex: 1;
        min-width: 4.5rem;
        text-align: center;
      }
    }

    .pills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;

      .btn-pill {
        width: 100%;
        text-align: center;
      }
    }

    .btn-pill--warning {
      background-color: var(--color-alert) !important;
      color: #ffffff !important;
      border-color: var(--color-alert) !important;
    }

    .note-textarea {
      border-radius: 1rem;
      resize: vertical;
      font-size: 0.85rem;
    }

    .char-counter {
      align-self: flex-end;
      font-size: 0.7rem;
      color: var(--color-text-muted);
      margin-top: -0.4rem;
    }

    .success-banner {
      background-color: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: var(--radius-pill);
      padding: 0.75rem 1rem;
      text-align: center;
      font-weight: 700;
      font-size: 0.9rem;
      animation: fadeIn 0.3s ease;
    }

    .error-banner {
      background-color: var(--color-alert-light);
      color: #9c361c;
      border: 1px solid var(--color-alert);
      border-radius: var(--radius-pill);
      padding: 0.75rem 1rem;
      text-align: center;
      font-weight: 700;
      font-size: 0.9rem;
      animation: fadeIn 0.3s ease;
    }

    .save-btn {
      margin: 0.5rem 0;
    }

    .recent-logs-card {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .history-head-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;

        h3 {
          margin: 0;
          font-size: 1.05rem;
        }

        .history-count-badge {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-active);
          background-color: var(--color-active-light);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-pill);
        }
      }

      .history-filter-pills {
        display: flex;
        gap: 0.35rem;

        .h-filter-btn {
          border: 1px solid rgba(45, 58, 47, 0.12);
          background: #ffffff;
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-pill);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted);
          cursor: pointer;

          &--active {
            background-color: var(--color-active);
            color: #ffffff;
            border-color: var(--color-active);
          }
        }
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }

      .history-item {
        background: #ffffff;
        border: 1px solid rgba(45, 58, 47, 0.08);
        border-radius: 1rem;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        cursor: pointer;
        transition: transform 0.15s ease, border-color 0.15s ease;

        &:hover {
          border-color: var(--color-active);
          transform: translateY(-1px);
        }

        .history-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .history-date-badge {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--color-text-main);
          }

          .history-mood-tag {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--color-text-muted);
          }
        }

        .history-metrics-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;

          .metric-mini-tag {
            font-size: 0.72rem;
            font-weight: 600;
            background-color: #f5f8f5;
            color: var(--color-text-main);
            padding: 0.2rem 0.45rem;
            border-radius: var(--radius-pill);
            border: 1px solid rgba(45, 58, 47, 0.06);

            &--warn {
              background-color: var(--color-alert-light);
              color: #9c361c;
              border-color: rgba(224, 122, 95, 0.3);
            }
          }
        }

        .history-note-preview {
          font-size: 0.75rem;
          font-style: italic;
          color: var(--color-text-muted);
          border-left: 2px solid var(--color-active);
          padding-left: 0.45rem;
          margin-top: 0.2rem;
        }
      }

      .history-empty {
        text-align: center;
        padding: 1.5rem 1rem;
        color: var(--color-text-muted);
        font-size: 0.8rem;
      }
    }

    // Clearance at the bottom so user can scroll completely past fixed BottomNav
    .bottom-clearance-spacer {
      height: 4.5rem;
      width: 100%;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CheckInComponent {
  private petService = inject(PetService);
  private router = inject(Router);

  activePet = this.petService.activePet;
  recentLogs = this.petService.recentLogs;

  today = new Date().toISOString().split('T')[0];
  yesterday = this.getPastDate(1);
  twoDaysAgo = this.getPastDate(2);
  threeDaysAgo = this.getPastDate(3);

  selectedDate = signal<string>(this.today);
  waterIntake = signal<WaterIntake>('NORMAL');
  foodIntake = signal<FoodIntake>('NORMAL');
  litterUrine = signal<LitterUrine>('NORMAL');
  energyMood = signal<EnergyMood>('PLAYFUL');
  notes = signal<string>('');

  historyFilter = signal<'ALL' | 'WEEK' | 'MONTH' | 'NOTES'>('ALL');

  isSaving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);
  saveError = signal<string>('');

  isFutureDate = computed(() => {
    return this.selectedDate() > this.today;
  });

  existingLogForDate = computed(() => {
    const d = this.selectedDate();
    const logs = this.recentLogs();
    return logs.find(l => l.log_date === d) || null;
  });

  filteredRecentLogs = computed(() => {
    const logs = this.recentLogs();
    const filter = this.historyFilter();

    if (filter === 'NOTES') {
      return logs.filter(l => l.notes && l.notes.trim() !== '');
    }

    if (filter === 'WEEK') {
      const sevenDaysAgo = this.getPastDate(7);
      return logs.filter(l => l.log_date >= sevenDaysAgo);
    }

    if (filter === 'MONTH') {
      const thirtyDaysAgo = this.getPastDate(30);
      return logs.filter(l => l.log_date >= thirtyDaysAgo);
    }

    return logs;
  });

  waterOptions: { value: WaterIntake; label: string }[] = [
    { value: 'LOW', label: 'Baja' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'Alta' }
  ];

  foodOptions: { value: FoodIntake; label: string }[] = [
    { value: 'NONE', label: 'Nada' },
    { value: 'LOW', label: 'Poco' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'Abundante' }
  ];

  urineOptions: { value: LitterUrine; label: string; warning?: boolean }[] = [
    { value: 'NORMAL', label: 'Normal' },
    { value: 'REDUCED', label: 'Reducida' },
    { value: 'EXCESSIVE', label: 'Excesiva' },
    { value: 'DIFFICULTY', label: 'Con Dificultad ⚠️', warning: true },
    { value: 'NONE', label: 'Ninguna ⚠️', warning: true }
  ];

  moodOptions: { value: EnergyMood; label: string; icon: string }[] = [
    { value: 'PLAYFUL', label: 'Juguetón', icon: '🎾' },
    { value: 'ACTIVE', label: 'Activo', icon: '🐾' },
    { value: 'CALM', label: 'Tranquilo', icon: '🌿' },
    { value: 'LETHARGIC', label: 'Letárgico', icon: '😴' },
    { value: 'RESTLESS', label: 'Inquieto', icon: '👀' }
  ];

  constructor() {
    // When selected date changes or logs load, auto-populate if existing log
    effect(() => {
      const existing = this.existingLogForDate();
      if (existing) {
        this.waterIntake.set(existing.water_intake);
        this.foodIntake.set(existing.food_intake);
        this.litterUrine.set(existing.litter_urine);
        this.energyMood.set(existing.energy_mood);
        this.notes.set(existing.notes || '');
      }
    });
  }

  setDate(dateStr: string) {
    if (dateStr <= this.today) {
      this.selectedDate.set(dateStr);
    }
  }

  onDateSelect(val: string) {
    this.selectedDate.set(val);
  }

  submitLog() {
    const pet = this.activePet();
    if (!pet) {
      this.saveError.set('Debes seleccionar o registrar una mascota primero.');
      return;
    }

    if (this.isFutureDate()) {
      this.saveError.set('No puedes registrar evaluaciones con fecha futura.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');

    const newLog: DailyLog = {
      pet_id: pet.id,
      log_date: this.selectedDate(),
      water_intake: this.waterIntake(),
      food_intake: this.foodIntake(),
      litter_urine: this.litterUrine(),
      energy_mood: this.energyMood(),
      notes: this.notes() ? this.notes().trim() : ''
    };

    this.petService.saveDailyLog(newLog).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => {
          this.saveSuccess.set(false);
          this.router.navigate(['/dashboard']);
        }, 1200);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err.error?.error || 'Error al guardar el registro.');
      }
    });
  }

  getPastDate(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  }

  formatLogDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  translateIntake(val?: string): string {
    switch (val) {
      case 'NORMAL': return 'Normal';
      case 'LOW': return 'Baja';
      case 'HIGH': return 'Alta';
      case 'NONE': return 'Ninguna';
      default: return '-';
    }
  }

  translateUrine(val?: string): string {
    switch (val) {
      case 'NORMAL': return 'Normal';
      case 'REDUCED': return 'Reducida';
      case 'EXCESSIVE': return 'Excesiva';
      case 'DIFFICULTY': return 'Dificultad';
      case 'NONE': return 'Ninguna';
      default: return '-';
    }
  }

  translateMood(val?: string): string {
    switch (val) {
      case 'PLAYFUL': return 'Juguetón';
      case 'ACTIVE': return 'Activo';
      case 'CALM': return 'Tranquilo';
      case 'LETHARGIC': return 'Letárgico';
      case 'RESTLESS': return 'Inquieto';
      default: return '-';
    }
  }

  getMoodEmoji(mood: string): string {
    switch (mood) {
      case 'PLAYFUL': return '🎾';
      case 'ACTIVE': return '🐾';
      case 'CALM': return '🌿';
      case 'LETHARGIC': return '😴';
      case 'RESTLESS': return '👀';
      default: return '✨';
    }
  }
}
