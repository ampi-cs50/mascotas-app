import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PetService } from '../../services/pet.service';
import { PainAssessment } from '../../models/pet.models';

@Component({
  selector: 'app-pain-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pain-assessment-view">
      
      <div class="view-header">
        <div class="tag-row">
          <span class="badge badge--moderate">Herramienta Clínica</span>
          <span class="fgs-title">Feline Grimace Scale</span>
        </div>
        <h1>Evaluador de Dolor Facial</h1>
        <p class="text-muted">
          Compara los 3 rasgos faciales de <strong>{{ activePet()?.name || 'tu mascota' }}</strong> para detectar signos sutiles de dolor o malestar oculto.
        </p>
      </div>

      <!-- Medidor de Puntaje en Vivo -->
      <section class="card score-live-card" [class]="'score-bg--' + scoreStatus().level">
        <div class="score-main">
          <div class="score-circle">
            <span class="score-val">{{ totalScore() }}</span>
            <span class="score-max">/ 6</span>
          </div>
          <div class="score-feedback">
            <span class="score-status-label">{{ scoreStatus().title }}</span>
            <p class="score-recommendation">{{ scoreStatus().desc }}</p>
          </div>
        </div>

        <div class="score-progress-bar">
          <div 
            class="score-progress-fill" 
            [style.width.%]="(totalScore() / 6) * 100"
            [class]="'fill--' + scoreStatus().level">
          </div>
        </div>
      </section>

      <!-- 1. Posición de las Orejas -->
      <section class="card trait-card">
        <div class="trait-header">
          <span class="trait-step">Paso 1</span>
          <h3>Posición de las Orejas</h3>
          <p class="trait-sub">Observa si las orejas están erguidas hacia el frente o aplanadas.</p>
        </div>

        <div class="options-grid">
          @for (opt of earsOptions; track opt.score) {
            <button 
              type="button" 
              class="trait-option-btn"
              [class.trait-option-btn--selected]="earsScore() === opt.score"
              (click)="earsScore.set(opt.score)">
              <div class="illustration-box">
                <!-- SVG Ilustración de Orejas -->
                <svg viewBox="0 0 100 80" class="fgs-svg">
                  <!-- Contorno cabeza -->
                  <path d="M 20 65 Q 50 80 80 65 Q 70 35 50 35 Q 30 35 20 65" fill="#f5ede3" stroke="#2D3A2F" stroke-width="2.5" />
                  @if (opt.score === 0) {
                    <!-- Orejas hacia el frente erguidas -->
                    <path d="M 28 45 L 20 12 L 42 36 Z" fill="#e8dacb" stroke="#2D3A2F" stroke-width="2.5" />
                    <path d="M 72 45 L 80 12 L 58 36 Z" fill="#e8dacb" stroke="#2D3A2F" stroke-width="2.5" />
                  } @else if (opt.score === 1) {
                    <!-- Orejas rotadas ligeramente hacia afuera -->
                    <path d="M 28 48 L 12 25 L 42 38 Z" fill="#e8dacb" stroke="#2D3A2F" stroke-width="2.5" />
                    <path d="M 72 48 L 88 25 L 58 38 Z" fill="#e8dacb" stroke="#2D3A2F" stroke-width="2.5" />
                  } @else {
                    <!-- Orejas aplanadas hacia atrás/costados (dolor marcado) -->
                    <path d="M 28 52 L 6 42 L 38 42 Z" fill="#e8dacb" stroke="#2D3A2F" stroke-width="2.5" />
                    <path d="M 72 52 L 94 42 L 62 42 Z" fill="#e8dacb" stroke="#2D3A2F" stroke-width="2.5" />
                  }
                  <!-- Ojos guía -->
                  <circle cx="38" cy="55" r="2.5" fill="#2D3A2F" />
                  <circle cx="62" cy="55" r="2.5" fill="#2D3A2F" />
                </svg>
              </div>
              <div class="trait-option-label">
                <span class="score-badge">+{{ opt.score }}</span>
                <strong>{{ opt.title }}</strong>
                <span class="opt-desc">{{ opt.desc }}</span>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- 2. Tensión Orbital / Ojos -->
      <section class="card trait-card">
        <div class="trait-header">
          <span class="trait-step">Paso 2</span>
          <h3>Apertura y Tensión de Ojos</h3>
          <p class="trait-sub">Verifica si tiene la mirada relajada o los párpados apretados.</p>
        </div>

        <div class="options-grid">
          @for (opt of eyesOptions; track opt.score) {
            <button 
              type="button" 
              class="trait-option-btn"
              [class.trait-option-btn--selected]="eyesScore() === opt.score"
              (click)="eyesScore.set(opt.score)">
              <div class="illustration-box">
                <!-- SVG Ilustración de Ojos -->
                <svg viewBox="0 0 100 80" class="fgs-svg">
                  <path d="M 20 65 Q 50 80 80 65 Q 70 35 50 35 Q 30 35 20 65" fill="#f5ede3" stroke="#2D3A2F" stroke-width="2.5" />
                  <!-- Orejas base -->
                  <path d="M 28 45 L 22 18 L 40 37 Z" fill="#e8dacb" stroke="#2D3A2F" stroke-width="2" />
                  <path d="M 72 45 L 78 18 L 60 37 Z" fill="#e8dacb" stroke="#2D3A2F" stroke-width="2" />
                  @if (opt.score === 0) {
                    <!-- Ojos abiertos redondos -->
                    <ellipse cx="38" cy="53" rx="6" ry="6" fill="#7A9E7E" stroke="#2D3A2F" stroke-width="2" />
                    <circle cx="38" cy="53" r="2" fill="#2D3A2F" />
                    <ellipse cx="62" cy="53" rx="6" ry="6" fill="#7A9E7E" stroke="#2D3A2F" stroke-width="2" />
                    <circle cx="62" cy="53" r="2" fill="#2D3A2F" />
                  } @else if (opt.score === 1) {
                    <!-- Ojos entrecerrados / almendrados -->
                    <ellipse cx="38" cy="54" rx="6" ry="3" fill="#7A9E7E" stroke="#2D3A2F" stroke-width="2" />
                    <line x1="33" y1="54" x2="43" y2="54" stroke="#2D3A2F" stroke-width="2" />
                    <ellipse cx="62" cy="54" rx="6" ry="3" fill="#7A9E7E" stroke="#2D3A2F" stroke-width="2" />
                    <line x1="57" y1="54" x2="67" y2="54" stroke="#2D3A2F" stroke-width="2" />
                  } @else {
                    <!-- Ojos apretados / líneas curvas cerradas -->
                    <path d="M 32 55 Q 38 51 44 55" fill="none" stroke="#2D3A2F" stroke-width="2.5" stroke-linecap="round" />
                    <path d="M 56 55 Q 62 51 68 55" fill="none" stroke="#2D3A2F" stroke-width="2.5" stroke-linecap="round" />
                  }
                </svg>
              </div>
              <div class="trait-option-label">
                <span class="score-badge">+{{ opt.score }}</span>
                <strong>{{ opt.title }}</strong>
                <span class="opt-desc">{{ opt.desc }}</span>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- 3. Tensión del Hocico y Bigotes -->
      <section class="card trait-card">
        <div class="trait-header">
          <span class="trait-step">Paso 3</span>
          <h3>Hocico y Bigotes</h3>
          <p class="trait-sub">Forma de las almohadillas nasales y orientación de los bigotes.</p>
        </div>

        <div class="options-grid">
          @for (opt of muzzleOptions; track opt.score) {
            <button 
              type="button" 
              class="trait-option-btn"
              [class.trait-option-btn--selected]="muzzleScore() === opt.score"
              (click)="muzzleScore.set(opt.score)">
              <div class="illustration-box">
                <!-- SVG Ilustración de Hocico y Bigotes -->
                <svg viewBox="0 0 100 80" class="fgs-svg">
                  <path d="M 20 65 Q 50 80 80 65 Q 70 35 50 35 Q 30 35 20 65" fill="#f5ede3" stroke="#2D3A2F" stroke-width="2.5" />
                  <circle cx="38" cy="50" r="2.5" fill="#2D3A2F" />
                  <circle cx="62" cy="50" r="2.5" fill="#2D3A2F" />
                  <!-- Nariz -->
                  <polygon points="46,58 54,58 50,62" fill="#E07A5F" />
                  @if (opt.score === 0) {
                    <!-- Hocico relajado redondo, bigotes curvos hacia abajo -->
                    <circle cx="45" cy="64" r="4" fill="#edd9c7" stroke="#2D3A2F" stroke-width="1.5" />
                    <circle cx="55" cy="64" r="4" fill="#edd9c7" stroke="#2D3A2F" stroke-width="1.5" />
                    <line x1="42" y1="64" x2="22" y2="67" stroke="#2D3A2F" stroke-width="1.5" />
                    <line x1="58" y1="64" x2="78" y2="67" stroke="#2D3A2F" stroke-width="1.5" />
                  } @else if (opt.score === 1) {
                    <!-- Hocico elíptico moderado, bigotes rectos -->
                    <ellipse cx="45" cy="64" rx="5" ry="3.5" fill="#edd9c7" stroke="#2D3A2F" stroke-width="1.5" />
                    <ellipse cx="55" cy="64" rx="5" ry="3.5" fill="#edd9c7" stroke="#2D3A2F" stroke-width="1.5" />
                    <line x1="42" y1="64" x2="18" y2="64" stroke="#2D3A2F" stroke-width="1.5" />
                    <line x1="58" y1="64" x2="82" y2="64" stroke="#2D3A2F" stroke-width="1.5" />
                  } @else {
                    <!-- Hocico tenso estirado, bigotes proyectados hacia adelante -->
                    <ellipse cx="44" cy="63" rx="6" ry="3" fill="#e8c7b0" stroke="#E07A5F" stroke-width="2" />
                    <ellipse cx="56" cy="63" rx="6" ry="3" fill="#e8c7b0" stroke="#E07A5F" stroke-width="2" />
                    <line x1="40" y1="63" x2="15" y2="58" stroke="#E07A5F" stroke-width="2" />
                    <line x1="60" y1="63" x2="85" y2="58" stroke="#E07A5F" stroke-width="2" />
                  }
                </svg>
              </div>
              <div class="trait-option-label">
                <span class="score-badge">+{{ opt.score }}</span>
                <strong>{{ opt.title }}</strong>
                <span class="opt-desc">{{ opt.desc }}</span>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- Notas Clínicas de la Evaluación -->
      <section class="card">
        <h3>Notas de la Evaluación (Opcional)</h3>
        <input 
          type="text" 
          class="form-input" 
          placeholder="Ej: Observado luego de la comida o siesta..."
          [ngModel]="assessmentNotes()"
          (ngModelChange)="assessmentNotes.set($event)" />
      </section>

      <!-- Confirmation Toast -->
      @if (saveSuccess()) {
        <div class="success-alert">
          <span>✅ Evaluación de dolor guardada en el historial clínico</span>
        </div>
      }

      <!-- Save Assessment CTA -->
      <button 
        type="button" 
        class="btn-primary-action save-btn"
        [disabled]="isSaving()"
        (click)="saveAssessment()">
        @if (isSaving()) {
          Guardando Evaluación...
        } @else {
          Guardar Evaluación (Puntaje: {{ totalScore() }} / 6)
        }
      </button>

    </div>
  `,
  styles: [`
    .pain-assessment-view {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .view-header {
      .tag-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.35rem;

        .fgs-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-active);
        }
      }

      h1 {
        font-size: 1.45rem;
        margin: 0;
      }
    }

    .score-live-card {
      background: linear-gradient(135deg, #ffffff 0%, #f6faf6 100%);
      border: 2px solid var(--color-active);
      transition: all 0.3s ease;

      &.score-bg--green {
        border-color: #10b981;
      }

      &.score-bg--yellow {
        border-color: #f59e0b;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      }

      &.score-bg--red {
        border-color: var(--color-alert);
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      }
    }

    .score-main {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;

      .score-circle {
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        background-color: #ffffff;
        box-shadow: 0 0.25rem 0.75rem rgba(45, 58, 47, 0.12);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .score-val {
          font-size: 1.6rem;
          font-weight: 800;
          line-height: 1;
          color: var(--color-text-main);
        }

        .score-max {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          font-weight: 600;
        }
      }

      .score-feedback {
        display: flex;
        flex-direction: column;

        .score-status-label {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--color-text-main);
        }

        .score-recommendation {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 0.2rem;
          line-height: 1.35;
        }
      }
    }

    .score-progress-bar {
      height: 0.5rem;
      background-color: rgba(45, 58, 47, 0.08);
      border-radius: var(--radius-pill);
      overflow: hidden;

      .score-progress-fill {
        height: 100%;
        border-radius: var(--radius-pill);
        transition: width 0.3s ease, background-color 0.3s ease;

        &.fill--green {
          background-color: #10b981;
        }

        &.fill--yellow {
          background-color: #f59e0b;
        }

        &.fill--red {
          background-color: var(--color-alert);
        }
      }
    }

    .trait-card {
      .trait-header {
        margin-bottom: 0.75rem;

        .trait-step {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--color-active);
          background-color: var(--color-active-light);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-pill);
        }

        h3 {
          margin: 0.35rem 0 0.15rem 0;
          font-size: 1.05rem;
          font-weight: 700;
        }

        .trait-sub {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }
      }
    }

    .options-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .trait-option-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #ffffff;
      border: 1.5px solid rgba(45, 58, 47, 0.12);
      border-radius: 1rem;
      padding: 0.5rem;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      .illustration-box {
        width: 100%;
        height: 3.5rem;
        display: flex;
        align-items: center;
        justify-content: center;

        .fgs-svg {
          width: 100%;
          height: 100%;
        }
      }

      .trait-option-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 0.35rem;

        .score-badge {
          font-size: 0.65rem;
          font-weight: 700;
          background: rgba(45, 58, 47, 0.08);
          padding: 0.1rem 0.35rem;
          border-radius: var(--radius-pill);
          color: var(--color-text-muted);
        }

        strong {
          font-size: 0.78rem;
          margin-top: 0.2rem;
          line-height: 1.2;
        }

        .opt-desc {
          font-size: 0.68rem;
          color: var(--color-text-muted);
          line-height: 1.15;
          margin-top: 0.15rem;
        }
      }

      &:hover {
        border-color: var(--color-active);
      }

      &--selected {
        border-color: var(--color-active);
        background-color: var(--color-active-light);
        box-shadow: 0 0 0 2px var(--color-active);

        .score-badge {
          background-color: var(--color-active);
          color: #ffffff;
        }
      }
    }

    .success-alert {
      background-color: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: var(--radius-pill);
      padding: 0.65rem 1rem;
      text-align: center;
      font-weight: 700;
      font-size: 0.85rem;
      animation: fadeIn 0.3s ease;
    }

    .save-btn {
      margin-top: 0.25rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PainAssessmentComponent {
  private petService = inject(PetService);
  private router = inject(Router);

  activePet = this.petService.activePet;

  earsScore = signal<number>(0);
  eyesScore = signal<number>(0);
  muzzleScore = signal<number>(0);
  assessmentNotes = signal<string>('');

  isSaving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);

  totalScore = computed(() => {
    return this.earsScore() + this.eyesScore() + this.muzzleScore();
  });

  scoreStatus = computed(() => {
    const score = this.totalScore();
    if (score <= 1) {
      return {
        level: 'green',
        title: 'Sin dolor aparente (0-1)',
        desc: 'Expresión serena y relajada. Tu mascota se encuentra en estado de confort.'
      };
    } else if (score <= 3) {
      return {
        level: 'yellow',
        title: 'Alerta / Molestia leve (2-3)',
        desc: 'Se aprecian cambios en orejas o mirada. Monitorea su evolución durante las próximas horas.'
      };
    } else {
      return {
        level: 'red',
        title: 'Dolor significativo (4-6)',
        desc: 'Mueca evidente de malestar. Se recomienda consultar inmediatamente al médico veterinario.'
      };
    }
  });

  earsOptions = [
    { score: 0, title: 'Erguidas', desc: 'Hacia adelante y atentas' },
    { score: 1, title: 'Rotadas', desc: 'Ligeramente hacia afuera' },
    { score: 2, title: 'Aplanadas', desc: 'Hacia los lados y atrás' }
  ];

  eyesOptions = [
    { score: 0, title: 'Abiertos', desc: 'Mirada relajada' },
    { score: 1, title: 'Entrecerrados', desc: 'Tensión orbital leve' },
    { score: 2, title: 'Cerrados', desc: 'Párpados apretados' }
  ];

  muzzleOptions = [
    { score: 0, title: 'Relajado', desc: 'Hocico redondeado' },
    { score: 1, title: 'Tenso', desc: 'Bigotes rectos' },
    { score: 2, title: 'Proyectado', desc: 'Hocico elíptico tenso' }
  ];

  saveAssessment() {
    const pet = this.activePet();
    if (!pet) return;

    this.isSaving.set(true);

    const assessment: PainAssessment = {
      pet_id: pet.id,
      score: this.totalScore(),
      ears_score: this.earsScore(),
      eyes_score: this.eyesScore(),
      muzzle_score: this.muzzleScore(),
      notes: this.assessmentNotes()
    };

    this.petService.savePainAssessment(assessment).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => {
          this.saveSuccess.set(false);
          this.router.navigate(['/insights']);
        }, 1200);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}
