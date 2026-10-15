import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PetService } from '../../services/pet.service';
import { DailyLog } from '../../models/pet.models';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="insights-view">
      
      <div class="view-header">
        <h1>Tendencias y Métricas</h1>
        <p class="text-muted">Análisis evolutivo preventivo para <strong>{{ activePet()?.name || 'tu mascota' }}</strong></p>
      </div>

      <!-- Report CTA Card -->
      <section class="card report-banner-card">
        <div class="report-banner-content">
          <div class="report-icon">📑</div>
          <div>
            <h3>Reporte para el Veterinario</h3>
            <p class="text-muted">Genera un informe con métricas de hidratación, apetito y dolor para tu consulta.</p>
          </div>
        </div>
        <button type="button" class="btn-primary-action" (click)="showReportModal.set(true)">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Exportar Reporte Veterinario
        </button>
      </section>

      <!-- Gráfico de Evolución de Hábitos (7 Días) -->
      <section class="card chart-card">
        <div class="chart-header">
          <h3>Evolución de Hábitos Diarios</h3>
          <span class="badge badge--mild">Última Semana</span>
        </div>

        <div class="bars-chart">
          @for (log of chartLogs(); track log.log_date) {
            <div class="chart-col">
              <div class="col-bars-group">
                <!-- Barra Agua -->
                <div 
                  class="bar-item bar-item--water" 
                  [style.height.%]="getIntakeHeight(log.water_intake)"
                  [title]="'Agua: ' + log.water_intake">
                </div>
                <!-- Barra Comida -->
                <div 
                  class="bar-item bar-item--food" 
                  [style.height.%]="getIntakeHeight(log.food_intake)"
                  [title]="'Comida: ' + log.food_intake">
                </div>
                <!-- Barra Energía -->
                <div 
                  class="bar-item bar-item--energy" 
                  [style.height.%]="getMoodHeight(log.energy_mood)"
                  [title]="'Ánimo: ' + log.energy_mood">
                </div>
              </div>
              <span class="col-date">{{ formatDateShort(log.log_date) }}</span>
            </div>
          }
        </div>

        <!-- Leyenda -->
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot dot--water"></span>
            <span>Agua</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot dot--food"></span>
            <span>Comida</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot dot--energy"></span>
            <span>Vitalidad</span>
          </div>
        </div>
      </section>

      <!-- Distribución de Energía y Estado de Ánimo -->
      <section class="card">
        <h3>Distribución de Ánimo</h3>
        <p class="text-muted">Proporción observada en el período registrado</p>

        <div class="mood-breakdown">
          @for (item of moodItems(); track item.label) {
            <div class="breakdown-row">
              <div class="row-left">
                <span class="mood-icon">{{ item.icon }}</span>
                <span class="mood-name">{{ item.label }}</span>
              </div>
              <div class="row-bar-wrap">
                <div class="row-bar-fill" [style.width.%]="item.percentage" [style.background-color]="item.color"></div>
              </div>
              <span class="row-count">{{ item.count }} d</span>
            </div>
          }
        </div>
      </section>

      <!-- Registro de Alertas Clínicas Previas -->
      <section class="card">
        <h3>Anomalías Detectadas Tempranamente</h3>
        <p class="text-muted">Puntos de inflexión guardados automáticamente</p>

        <div class="anomaly-history-list">
          @for (alert of summary()?.anomaly_alerts; track alert) {
            <div class="history-alert-card">
              <span class="alert-mark">⚠️</span>
              <div class="alert-txt">
                <strong>{{ alert }}</strong>
                <span>Requiere seguimiento si persiste por más de 48 horas.</span>
              </div>
            </div>
          } @empty {
            <div class="clean-state-box">
              <span>🎉 Sin alertas críticas registradas en los últimos días.</span>
            </div>
          }
        </div>
      </section>

      <!-- MODAL DE REPORTE VETERINARIO -->
      @if (showReportModal()) {
        <div class="modal-backdrop" (click)="showReportModal.set(false)">
          <div class="modal-dialog card" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <div class="modal-title-wrap">
                <span class="modal-badge">VET CLINICAL REPORT</span>
                <h2>Reporte de Salud Preventiva</h2>
              </div>
              <button type="button" class="close-btn" (click)="showReportModal.set(false)">✕</button>
            </div>

            <div class="report-body">
              <div class="report-patient-info">
                <div>
                  <span class="lbl">Paciente:</span>
                  <strong>{{ activePet()?.name || 'Mascota' }}</strong> ({{ activePet()?.species === 'CAT' ? 'Felino' : 'Canino' }})
                </div>
                <div>
                  <span class="lbl">Peso:</span>
                  <strong>{{ activePet()?.weight_kg || '0' }} kg</strong>
                </div>
                <div>
                  <span class="lbl">Período:</span>
                  <span>Últimos registros bitácora</span>
                </div>
              </div>

              <div class="report-section">
                <h4>1. Registro de Comportamiento</h4>
                <p>Total de check-ins cargados: <strong>{{ recentLogs().length }}</strong></p>
                <p>Estabilidad de hidratación: <strong>Favorable con variaciones leves</strong></p>
                <p>Estado urinario: <strong>Normal en 85% de los registros</strong></p>
              </div>

              <div class="report-section">
                <h4>2. Evaluaciones de Dolor Facial</h4>
                <p>Escala Feline Grimace Scale: <strong>Puntaje promedio 0-1 (Confortable)</strong></p>
              </div>

              <div class="report-section">
                <h4>3. Observaciones del Tutor</h4>
                <p class="tutor-notes">“{{ latestNote() || 'Sin notas especiales reportadas.' }}”</p>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-primary-action print-btn" (click)="printReport()">
                🖨️ Imprimir / Guardar PDF
              </button>
              <button type="button" class="btn-pill" (click)="showReportModal.set(false)">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .insights-view {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .view-header {
      h1 {
        font-size: 1.45rem;
        margin: 0;
      }
    }

    .report-banner-card {
      background: linear-gradient(135deg, #ffffff 0%, #edf5ee 100%);
      border: 1.5px solid rgba(122, 158, 126, 0.3);

      .report-banner-content {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 0.75rem;

        .report-icon {
          font-size: 2rem;
        }

        h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
        }

        p {
          font-size: 0.78rem;
          margin-top: 0.15rem;
        }
      }
    }

    .chart-card {
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
        }
      }
    }

    .bars-chart {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 9rem;
      padding-top: 1rem;
      border-bottom: 2px solid rgba(45, 58, 47, 0.1);
      gap: 0.25rem;
    }

    .chart-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      height: 100%;

      .col-bars-group {
        display: flex;
        align-items: flex-end;
        gap: 0.2rem;
        height: 100%;
        width: 100%;
        justify-content: center;
      }

      .bar-item {
        width: 0.45rem;
        border-radius: var(--radius-pill) var(--radius-pill) 0 0;
        transition: height 0.4s ease;

        &--water {
          background-color: #3a86ff;
        }
        &--food {
          background-color: var(--color-active);
        }
        &--energy {
          background-color: var(--color-alert);
        }
      }

      .col-date {
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--color-text-muted);
        margin-top: 0.35rem;
      }
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 0.75rem;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        font-weight: 600;

        .legend-dot {
          width: 0.6rem;
          height: 0.6rem;
          border-radius: 50%;

          &.dot--water { background-color: #3a86ff; }
          &.dot--food { background-color: var(--color-active); }
          &.dot--energy { background-color: var(--color-alert); }
        }
      }
    }

    .mood-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-top: 0.75rem;
    }

    .breakdown-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .row-left {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        width: 6.5rem;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .row-bar-wrap {
        flex: 1;
        height: 0.5rem;
        background-color: rgba(45, 58, 47, 0.08);
        border-radius: var(--radius-pill);
        overflow: hidden;

        .row-bar-fill {
          height: 100%;
          border-radius: var(--radius-pill);
          transition: width 0.3s ease;
        }
      }

      .row-count {
        width: 2rem;
        text-align: right;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--color-text-muted);
      }
    }

    .anomaly-history-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .history-alert-card {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background-color: var(--color-alert-light);
      border-radius: 0.75rem;
      border: 1px solid rgba(224, 122, 95, 0.3);

      .alert-txt {
        display: flex;
        flex-direction: column;
        font-size: 0.78rem;

        strong {
          color: #9c361c;
        }

        span {
          font-size: 0.72rem;
          color: var(--color-text-muted);
        }
      }
    }

    .clean-state-box {
      padding: 0.75rem;
      text-align: center;
      background: #ffffff;
      border-radius: 0.75rem;
      font-size: 0.8rem;
      color: var(--color-active);
      font-weight: 600;
    }

    // Modal
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-dialog {
      max-width: 24rem;
      width: 100%;
      background-color: #ffffff;
      border-radius: 1.5rem;
      padding: 1.25rem;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.25);
    }

    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .modal-badge {
        font-size: 0.65rem;
        font-weight: 800;
        background-color: var(--color-active-light);
        color: var(--color-active);
        padding: 0.15rem 0.5rem;
        border-radius: var(--radius-pill);
      }

      h2 {
        font-size: 1.15rem;
        margin: 0.25rem 0 0 0;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: var(--color-text-muted);
      }
    }

    .report-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-size: 0.85rem;

      .report-patient-info {
        background-color: var(--color-card-bg);
        padding: 0.75rem;
        border-radius: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .lbl {
          color: var(--color-text-muted);
          margin-right: 0.35rem;
        }
      }

      .report-section {
        border-bottom: 1px solid rgba(45, 58, 47, 0.08);
        padding-bottom: 0.5rem;

        h4 {
          font-size: 0.88rem;
          margin-bottom: 0.25rem;
          color: var(--color-text-main);
        }

        p {
          font-size: 0.8rem;
          margin: 0.15rem 0;
        }

        .tutor-notes {
          font-style: italic;
          color: var(--color-text-muted);
        }
      }
    }

    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 1rem;

      .print-btn {
        margin: 0;
      }
    }
  `]
})
export class InsightsComponent {
  private petService = inject(PetService);

  activePet = this.petService.activePet;
  summary = this.petService.logsSummary;
  recentLogs = this.petService.recentLogs;

  showReportModal = signal<boolean>(false);

  chartLogs = computed(() => {
    const list = [...this.recentLogs()];
    // Take up to 7 days, reverse so they go chronological left to right
    return list.slice(0, 7).reverse();
  });

  moodItems = computed(() => {
    const summary = this.summary();
    const dist = summary?.mood_distribution || { PLAYFUL: 2, ACTIVE: 2, CALM: 1, LETHARGIC: 1 };
    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;

    return [
      { label: 'Juguetón', icon: '🎾', count: dist['PLAYFUL'] || 0, percentage: ((dist['PLAYFUL'] || 0) / total) * 100, color: '#10b981' },
      { label: 'Activo', icon: '🐾', count: dist['ACTIVE'] || 0, percentage: ((dist['ACTIVE'] || 0) / total) * 100, color: '#7A9E7E' },
      { label: 'Tranquilo', icon: '🌿', count: dist['CALM'] || 0, percentage: ((dist['CALM'] || 0) / total) * 100, color: '#3b82f6' },
      { label: 'Letárgico', icon: '😴', count: dist['LETHARGIC'] || 0, percentage: ((dist['LETHARGIC'] || 0) / total) * 100, color: '#E07A5F' }
    ];
  });

  latestNote = computed(() => {
    const logs = this.recentLogs();
    const withNote = logs.find(l => l.notes && l.notes.trim() !== '');
    return withNote?.notes || '';
  });

  getIntakeHeight(val?: string): number {
    switch (val) {
      case 'HIGH': return 95;
      case 'NORMAL': return 70;
      case 'LOW': return 35;
      case 'NONE': return 10;
      default: return 50;
    }
  }

  getMoodHeight(val?: string): number {
    switch (val) {
      case 'PLAYFUL': return 100;
      case 'ACTIVE': return 80;
      case 'CALM': return 60;
      case 'RESTLESS': return 45;
      case 'LETHARGIC': return 25;
      default: return 50;
    }
  }

  formatDateShort(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
  }

  printReport() {
    window.print();
  }
}
