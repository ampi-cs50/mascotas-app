import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../services/pet.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="dashboard-view">
      
      @if (activePet(); as pet) {
        <!-- Pet Highlight Card -->
        <section class="card pet-hero-card">
          <div class="pet-hero-content">
            <div class="pet-image-wrap" (click)="openEditModal()" title="Toca para cambiar foto o datos" style="cursor: pointer;">
              <img [src]="pet.avatar_url" [alt]="pet.name" class="pet-hero-img" />
              <span class="pet-badge-tag">{{ pet.species === 'CAT' ? 'Gato Doméstico' : 'Canino Familiar' }}</span>
              <span class="photo-edit-badge" title="Cambiar foto">📷</span>
            </div>
            <div class="pet-hero-info">
              <div class="status-pill-row">
                <span class="status-dot"></span>
                <span class="status-text">Seguimiento Activo Hoy</span>
              </div>
              <h1 class="pet-name-lg">{{ pet.name }}</h1>
              <p class="pet-subtext">Peso: <strong>{{ pet.weight_kg }} kg</strong> • Registro continuo</p>
            </div>
          </div>

          <div class="hero-actions">
            <a routerLink="/check-in" class="btn-primary-action">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Registrar Check-in de Hoy
            </a>

            <button type="button" class="btn-edit-pet-action" (click)="openEditModal()" title="Modificar peso, edad o foto de perfil">
              ✏️ Modificar datos (peso, edad, foto)
            </button>
          </div>
        </section>
      } @else {
        <!-- Empty Pet Onboarding Card -->
        <section class="card empty-pet-welcome">
          <div class="welcome-icon">🐾</div>
          <h2>¡Bienvenido/a a tu App de Cuidado Preventivo!</h2>
          <p>Para comenzar a registrar hábitos diarios y monitorear la salud de tu compañero/a, registra los datos de tu mascota.</p>
          <button type="button" class="btn-primary-action" (click)="openAddPetModal()">
            + Registrar mi Mascota Ahora
          </button>
        </section>
      }

      <!-- Resumen Diario (Daily Summary Card) -->
      <section class="card">
        <div class="section-header">
          <h2>Resumen Diario</h2>
          <span class="section-date">{{ todayFormatted }}</span>
        </div>

        @if (latestLog()) {
          <div class="metrics-grid">
            <div class="metric-pill">
              <div class="metric-icon">💧</div>
              <div class="metric-details">
                <span class="metric-name">Agua</span>
                <span class="metric-value">{{ translateIntake(latestLog()?.water_intake) }}</span>
              </div>
            </div>

            <div class="metric-pill">
              <div class="metric-icon">🍲</div>
              <div class="metric-details">
                <span class="metric-name">Comida</span>
                <span class="metric-value">{{ translateIntake(latestLog()?.food_intake) }}</span>
              </div>
            </div>

            <div class="metric-pill">
              <div class="metric-icon">🐾</div>
              <div class="metric-details">
                <span class="metric-name">Orina / Bandeja</span>
                <span class="metric-value">{{ translateUrine(latestLog()?.litter_urine) }}</span>
              </div>
            </div>

            <div class="metric-pill">
              <div class="metric-icon">⚡</div>
              <div class="metric-details">
                <span class="metric-name">Ánimo</span>
                <span class="metric-value">{{ translateMood(latestLog()?.energy_mood) }}</span>
              </div>
            </div>
          </div>

          @if (latestLog()?.notes) {
            <div class="latest-note-box">
              <span class="note-quote">“{{ latestLog()?.notes }}”</span>
            </div>
          }
        } @else {
          <div class="empty-log-box">
            <p>Aún no has registrado los hábitos de hoy para {{ activePet()?.name || 'tu mascota' }}.</p>
            <a routerLink="/check-in" class="btn-pill btn-pill--active">Realizar Check-in</a>
          </div>
        }
      </section>

      <!-- Alertas Preventivas (Anomalías) -->
      @if (summary()?.anomaly_alerts?.length) {
        <section class="card card--alert">
          <div class="alert-header">
            <span class="alert-icon">⚠️</span>
            <h3>Atención Preventiva</h3>
          </div>
          <ul class="alert-list">
            @for (alert of summary()?.anomaly_alerts; track alert) {
              <li class="alert-item">
                <span class="alert-bullet"></span>
                <span>{{ alert }}</span>
              </li>
            }
          </ul>
        </section>
      }

      <!-- Acceso Rápido al Evaluador de Dolor Facial (Grimace Scale) -->
      <section class="card grimace-promo-card">
        <div class="promo-header">
          <div class="promo-badge">NUEVO</div>
          <h3>Evaluador de Dolor Facial</h3>
        </div>
        <p class="promo-desc">
          Detecta dolor oculto mediante la escala de muecas (Feline Grimace Scale). Compara orejas, ojos y hocico en 3 pasos.
        </p>
        <a routerLink="/pain-assessment" class="btn-pill btn-pill--active promo-btn">
          Evaluar Expresión Facial →
        </a>
      </section>

      <!-- Consejos Preventivos Diarios -->
      <section class="card tip-card">
        <div class="tip-header">
          <span class="tip-sparkle">💡</span>
          <h3>Consejo Preventivo</h3>
        </div>
        <p class="tip-content">
          {{ activePet()?.species === 'DOG' 
            ? 'En perros, cambios en el ritmo de deglución o desgano al pasear pueden reflejar molestias dentales o articulares antes de que haya quejidos.'
            : 'Los gatos tienden a ocultar el malestar. Un cambio sutil como rotación de orejas, menor aseo o disminución en el uso del arenero son los primeros signos de alerta.' }}
        </p>
      </section>

      <!-- Próximos Eventos Clínicos -->
      <section class="card">
        <div class="section-header">
          <h2>Historial Preventivo</h2>
          <span class="text-muted">Eventos</span>
        </div>

        <div class="events-timeline">
          @for (event of clinicalEvents(); track event.id) {
            <div class="event-item">
              <div class="event-type-badge">{{ getEventIcon(event.event_type) }}</div>
              <div class="event-info">
                <div class="event-top">
                  <h4 class="event-title">{{ event.title }}</h4>
                  <span class="event-date">{{ event.event_date }}</span>
                </div>
                @if (event.notes) {
                  <p class="event-notes">{{ event.notes }}</p>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Modal para Registrar Mascota desde el Dashboard -->
      @if (showAddPetModal()) {
        <div class="modal-backdrop" (click)="showAddPetModal.set(false)">
          <div class="modal-card card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Registrar a tu Mascota</h3>
              <button type="button" class="close-x" (click)="showAddPetModal.set(false)">✕</button>
            </div>

            <form (ngSubmit)="handleAddPet()">
              <div class="form-group">
                <label>Nombre de la Mascota</label>
                <input 
                  type="text" 
                  class="form-input" 
                  placeholder="ej: Rocky, Misi, Oliver..." 
                  [(ngModel)]="newPetName" 
                  name="newPetName" 
                  required />
              </div>

              <div class="form-group">
                <label>Especie</label>
                <div class="species-toggle-row">
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="newPetSpecies === 'CAT'"
                    (click)="newPetSpecies = 'CAT'">
                    🐱 Felino (Gato)
                  </button>
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="newPetSpecies === 'DOG'"
                    (click)="newPetSpecies = 'DOG'">
                    🐶 Canino (Perro)
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Peso aproximado (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  class="form-input" 
                  [(ngModel)]="newPetWeight" 
                  name="newPetWeight" />
              </div>

              <button 
                type="submit" 
                class="btn-primary-action"
                [disabled]="isSavingPet() || !newPetName">
                {{ isSavingPet() ? 'Guardando Mascota...' : 'Guardar y Comenzar' }}
              </button>
            </form>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .dashboard-view {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .empty-pet-welcome {
      text-align: center;
      padding: 2rem 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      background: linear-gradient(135deg, #ffffff 0%, #edf5ee 100%);
      border: 2px dashed var(--color-active);

      .welcome-icon {
        font-size: 3rem;
      }

      h2 {
        font-size: 1.25rem;
        margin: 0;
      }

      p {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        line-height: 1.4;
      }
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 1.5rem;
      padding: 1.25rem;
      width: 100%;
      max-width: 22rem;
      box-shadow: 0 1rem 3rem rgba(0,0,0,0.25);

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        h3 {
          margin: 0;
          font-size: 1.15rem;
        }

        .close-x {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: var(--color-text-muted);
        }
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        label {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
      }

      .species-toggle-row {
        display: flex;
        gap: 0.5rem;

        .btn-pill {
          flex: 1;
          font-size: 0.8rem;
          padding: 0.4rem;
        }
      }
    }

    .pet-hero-card {
      background: linear-gradient(135deg, #F9F8F3 0%, #edf5ee 100%);
      border: 1px solid rgba(122, 158, 126, 0.25);
    }

    .pet-hero-content {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .pet-image-wrap {
      position: relative;
      width: 5rem;
      height: 5rem;
      flex-shrink: 0;

      .pet-hero-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 0.5rem 1rem rgba(45, 58, 47, 0.15);
        border: 3px solid #ffffff;
      }

      .pet-badge-tag {
        position: absolute;
        bottom: -0.3rem;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        background-color: var(--color-active);
        color: #ffffff;
        font-size: 0.6rem;
        font-weight: 700;
        padding: 0.15rem 0.4rem;
        border-radius: var(--radius-pill);
      }

      .photo-edit-badge {
        position: absolute;
        top: 0;
        right: 0;
        width: 1.5rem;
        height: 1.5rem;
        background: #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        box-shadow: 0 0.15rem 0.5rem rgba(0, 0, 0, 0.15);
        border: 1.5px solid var(--color-active);
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.1);
        }
      }
    }

    .pet-hero-info {
      display: flex;
      flex-direction: column;

      .status-pill-row {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin-bottom: 0.2rem;

        .status-dot {
          width: 0.5rem;
          height: 0.5rem;
          background-color: #2ec4b6;
          border-radius: 50%;
        }

        .status-text {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }
      }

      .pet-name-lg {
        font-size: 1.6rem;
        font-weight: 800;
        margin: 0;
      }

      .pet-subtext {
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }
    }

    .hero-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .btn-edit-pet-action {
        background-color: #ffffff;
        border: 1.5px solid var(--color-active);
        color: var(--color-active);
        border-radius: var(--radius-pill);
        padding: 0.55rem 1rem;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        transition: all 0.2s ease;

        &:hover {
          background-color: var(--color-active-light);
        }
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;

      .section-date {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-text-muted);
        background: rgba(45, 58, 47, 0.05);
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-pill);
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .metric-pill {
      background-color: #ffffff;
      border: 1px solid rgba(45, 58, 47, 0.08);
      border-radius: 1rem;
      padding: 0.65rem 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .metric-icon {
        font-size: 1.3rem;
      }

      .metric-details {
        display: flex;
        flex-direction: column;

        .metric-name {
          font-size: 0.68rem;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--color-text-muted);
        }

        .metric-value {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-text-main);
        }
      }
    }

    .latest-note-box {
      margin-top: 0.75rem;
      padding: 0.65rem 0.85rem;
      background-color: rgba(122, 158, 126, 0.1);
      border-left: 3px solid var(--color-active);
      border-radius: 0.5rem;

      .note-quote {
        font-size: 0.8rem;
        font-style: italic;
        color: var(--color-text-main);
      }
    }

    .empty-log-box {
      text-align: center;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .card--alert {
      border: 1.5px solid var(--color-alert);
      background-color: var(--color-alert-light);

      .alert-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;

        h3 {
          color: #9c361c;
          font-size: 0.95rem;
          font-weight: 700;
        }
      }

      .alert-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .alert-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.825rem;
        font-weight: 600;
        color: #7f230f;

        .alert-bullet {
          width: 0.35rem;
          height: 0.35rem;
          background-color: var(--color-alert);
          border-radius: 50%;
        }
      }
    }

    .grimace-promo-card {
      background: linear-gradient(135deg, #f3f7f3 0%, #e8f0e8 100%);
      border: 1px solid rgba(122, 158, 126, 0.3);

      .promo-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.35rem;

        .promo-badge {
          background-color: var(--color-alert);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-pill);
        }

        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
        }
      }

      .promo-desc {
        font-size: 0.825rem;
        color: var(--color-text-muted);
        margin-bottom: 0.75rem;
      }

      .promo-btn {
        width: 100%;
        text-decoration: none;
        box-sizing: border-box;
      }
    }

    .tip-card {
      .tip-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.35rem;

        .tip-sparkle {
          font-size: 1.1rem;
        }

        h3 {
          font-size: 0.95rem;
          font-weight: 700;
        }
      }

      .tip-content {
        font-size: 0.825rem;
        color: var(--color-text-main);
        line-height: 1.4;
      }
    }

    .events-timeline {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .event-item {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(45, 58, 47, 0.06);

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .event-type-badge {
        font-size: 1.25rem;
        background: #ffffff;
        border-radius: 50%;
        width: 2.2rem;
        height: 2.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(45, 58, 47, 0.08);
        flex-shrink: 0;
      }

      .event-info {
        flex: 1;

        .event-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;

          .event-title {
            font-size: 0.85rem;
            font-weight: 700;
          }

          .event-date {
            font-size: 0.72rem;
            color: var(--color-text-muted);
          }
        }

        .event-notes {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: 0.15rem;
        }
      }
    }
  `]
})
export class DashboardComponent {
  private petService = inject(PetService);

  activePet = this.petService.activePet;
  summary = this.petService.logsSummary;
  recentLogs = this.petService.recentLogs;
  clinicalEvents = this.petService.clinicalEvents;

  get latestLog() {
    return () => {
      const logs = this.recentLogs();
      return logs.length > 0 ? logs[0] : null;
    };
  }

  get todayFormatted(): string {
    const d = new Date();
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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

  showAddPetModal = signal<boolean>(false);
  isSavingPet = signal<boolean>(false);
  newPetName = '';
  newPetSpecies: 'CAT' | 'DOG' = 'CAT';
  newPetWeight = 4.0;

  openEditModal() {
    this.petService.openEditModal();
  }

  openAddPetModal() {
    this.petService.openAddPetModal();
  }

  handleAddPet() {
    if (!this.newPetName.trim()) return;
    this.isSavingPet.set(true);

    this.petService.addPet({
      name: this.newPetName.trim(),
      species: this.newPetSpecies,
      weight_kg: Number(this.newPetWeight) || 4.0
    }).subscribe({
      next: () => {
        this.isSavingPet.set(false);
        this.showAddPetModal.set(false);
        this.newPetName = '';
      },
      error: (err) => {
        this.isSavingPet.set(false);
        console.error('Error adding pet from dashboard', err);
      }
    });
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'VACCINE': return '💉';
      case 'DEWORMING': return '💊';
      case 'CHECKUP': return '🩺';
      case 'MEDICATION': return '🧪';
      case 'SURGERY': return '🩹';
      default: return '📋';
    }
  }
}
