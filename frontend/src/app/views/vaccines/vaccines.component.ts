import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../services/pet.service';
import { PetVaccine, VaccineCategory } from '../../models/pet.models';

interface VaccineGuideDetail {
  code: string;
  targetSpecies: 'CAT' | 'DOG' | 'ALL';
  commonQuestions: {
    question: string;
    answer: string;
  }[];
  vetTip: string;
}

@Component({
  selector: 'app-vaccines',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="vaccines-view">
      
      <!-- Top Title & Pet Ribbon Summary -->
      @if (activePet(); as pet) {
        <section class="card vax-hero-card">
          <div class="vax-hero-header">
            <div class="vax-hero-pet">
              <img [src]="pet.avatar_url" [alt]="pet.name" class="vax-pet-avatar" />
              <div>
                <span class="vax-badge-pill">Cartilla Preventiva</span>
                <h1 class="vax-hero-title">Vacunas de {{ pet.name }}</h1>
                <p class="vax-hero-sub">
                  {{ pet.species === 'CAT' ? '🐱 Felino' : '🐶 Canino' }} • 
                  {{ pet.sex === 'MALE' ? 'Macho ♂' : 'Hembra ♀' }} • 
                  {{ pet.is_neutered ? '✂️ Castrado/a' : 'Sin castrar' }}
                </p>
              </div>
            </div>
            
            <a routerLink="/dashboard" class="btn-back-link" title="Volver al Inicio">
              ← Volver
            </a>
          </div>

          <!-- Progress Bar & Immunization Level -->
          <div class="vax-progress-wrap">
            <div class="progress-labels">
              <span class="progress-title">Nivel de Cobertura Inmune</span>
              <span class="progress-percent">
                {{ appliedCount() }} de {{ totalCount() }} protegidas ({{ coveragePercent() }}%)
              </span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="coveragePercent()"></div>
            </div>
            <p class="progress-hint">
              {{ coveragePercent() === 100 
                ? '🌟 ¡Excelente! Tu mascota cuenta con todas sus vacunas al día.' 
                : '🛡️ Mantener las vacunas al día previene enfermedades virales graves y evita urgencias costosas.' }}
            </p>
          </div>
        </section>

        <!-- Quick Clarification FAQ Bar (Guía rápida sin abrumar) -->
        <section class="card faq-summary-card">
          <div class="faq-summary-header" (click)="toggleFaqSummary()">
            <div class="faq-icon-title">
              <span class="sparkle-icon">💡</span>
              <div>
                <h3 class="faq-title">Guía Rápida: ¿Cuáles son necesarias y cuáles opcionales?</h3>
                <p class="faq-sub">Toca aquí para resolver dudas comunes sobre gatos de interior, perros de ciudad y leyes.</p>
              </div>
            </div>
            <span class="faq-arrow" [class.faq-arrow--open]="showFaqSummary()">▾</span>
          </div>

          @if (showFaqSummary()) {
            <div class="faq-accordion-body">
              <div class="faq-item-pill">
                <span class="category-indicator core">⭐ Esenciales (Core)</span>
                <p>
                  <strong>Imprescindibles para todos</strong>. Protegen contra virus con alta tasa de mortalidad (como Panleucopenia en gatos o Moquillo/Parvovirus en perros). 
                  <em>¿Incluso si vive dentro de casa?</em> <strong>Sí</strong>, porque los virus son resistentes y las personas podemos transportarlos en las suelas de los zapatos o ropa.
                </p>
              </div>

              <div class="faq-item-pill">
                <span class="category-indicator mandatory">⚖️ Obligatorias por Ley</span>
                <p>
                  <strong>Antirrábica</strong>: En la mayoría de países es una exigencia legal y sanitaria a partir de los 3 meses con refuerzo anual. La rabia es una zoonosis mortal para animales y humanos.
                </p>
              </div>

              <div class="faq-item-pill">
                <span class="category-indicator lifestyle">🏡 Según Estilo de Vida (Opcionales)</span>
                <p>
                  <strong>Dependen de la exposición</strong>. Por ejemplo, en <strong>gatos</strong> la vacuna de Leucemia (FeLV) es opcional si vive 100% en interior sin contacto con gatos ajenos. En <strong>perros</strong>, la de Tos de las Perreras (Bordetella) es clave si va a guardería o peluquería, pero opcional si no convive en grupos cerrados.
                </p>
              </div>
            </div>
          }
        </section>

        <!-- Filter Tabs -->
        <div class="vax-filter-tabs">
          <button 
            type="button" 
            class="tab-btn" 
            [class.tab-btn--active]="activeFilter() === 'ALL'"
            (click)="setFilter('ALL')">
            Todas ({{ totalCount() }})
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.tab-btn--active]="activeFilter() === 'CORE'"
            (click)="setFilter('CORE')">
            ⭐ Esenciales
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.tab-btn--active]="activeFilter() === 'MANDATORY'"
            (click)="setFilter('MANDATORY')">
            ⚖️ Obligatorias
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.tab-btn--active]="activeFilter() === 'LIFESTYLE'"
            (click)="setFilter('LIFESTYLE')">
            🏡 Opcionales
          </button>
        </div>

        <!-- Vaccines List -->
        <div class="vaccines-list">
          @for (vax of filteredVaccines(); track vax.vaccine_code) {
            <article class="card vax-card" [class.vax-card--applied]="vax.applied">
              
              <!-- Card Header Row -->
              <div class="vax-card-top">
                <div class="vax-main-info">
                  <div class="vax-badge-row">
                    <span class="category-tag" [ngClass]="getCategoryClass(vax.category)">
                      {{ getCategoryLabel(vax.category) }}
                    </span>
                    @if (vax.applied) {
                      <span class="status-tag applied">✓ Aplicada</span>
                    } @else {
                      <span class="status-tag pending">Pendiente</span>
                    }
                  </div>

                  <h2 class="vax-name">{{ vax.name }}</h2>
                  <p class="vax-summary-text">{{ vax.notes || 'Vacuna preventiva para ' + pet.name }}</p>
                </div>

                <!-- Big Interactive Toggle Button -->
                <div class="vax-toggle-action">
                  <button 
                    type="button" 
                    class="btn-toggle-apply"
                    [class.btn-toggle-apply--active]="vax.applied"
                    (click)="toggleApplied(vax)"
                    [title]="vax.applied ? 'Marcar como pendiente' : 'Marcar como aplicada'">
                    <span class="toggle-icon">{{ vax.applied ? '✓' : '○' }}</span>
                    <span class="toggle-text">{{ vax.applied ? 'Dada' : '¿Se dio?' }}</span>
                  </button>
                </div>
              </div>

              <!-- Date & Booster Details (visible if applied) -->
              @if (vax.applied) {
                <div class="vax-date-box">
                  <div class="date-input-group">
                    <label [for]="'date-' + vax.vaccine_code">Fecha de aplicación:</label>
                    <div class="date-row">
                      <input 
                        [id]="'date-' + vax.vaccine_code"
                        type="date" 
                        [max]="today"
                        class="form-input form-input-sm" 
                        [ngModel]="vax.applied_date ? vax.applied_date.split('T')[0] : today"
                        (ngModelChange)="onDateChange(vax, $event)" />
                      
                      <button 
                        type="button" 
                        class="btn-today-sm" 
                        (click)="setToday(vax)" 
                        title="Establecer fecha de hoy">
                        Hoy
                      </button>
                    </div>
                  </div>

                  <div class="booster-calc-box">
                    <span class="booster-icon">🔄</span>
                    <div class="booster-text">
                      <span class="booster-label">Próximo Refuerzo Estimado:</span>
                      <strong class="booster-val">{{ calculateBoosterDate(vax.applied_date) }}</strong>
                    </div>
                  </div>
                </div>
              }

              <!-- Collapsible Educational Details ("¿Por qué es importante?") -->
              <div class="vax-details-expander">
                <button 
                  type="button" 
                  class="btn-expand-info" 
                  (click)="toggleDetails(vax.vaccine_code)">
                  <span>ℹ️ ¿Por qué es importante? / ¿La necesita mi mascota?</span>
                  <span class="arrow-indicator" [class.arrow-indicator--open]="isExpanded(vax.vaccine_code)">▾</span>
                </button>

                @if (isExpanded(vax.vaccine_code)) {
                  <div class="educational-content">
                    @if (getGuideDetails(vax.vaccine_code); as details) {
                      <div class="faq-qa-list">
                        @for (qa of details.commonQuestions; track qa.question) {
                          <div class="qa-block">
                            <h4 class="qa-question">❓ {{ qa.question }}</h4>
                            <p class="qa-answer">{{ qa.answer }}</p>
                          </div>
                        }
                      </div>

                      <div class="vet-tip-box">
                        <span class="vet-icon">🩺</span>
                        <div class="vet-text">
                          <strong>Consejo Veterinario:</strong>
                          <p>{{ details.vetTip }}</p>
                        </div>
                      </div>
                    } @else {
                      <p class="standard-desc">
                        Esta vacuna estimula el sistema inmunológico para crear anticuerpos específicos que neutralizan el agente infeccioso antes de que cause daño orgánico o secuelas permanentes.
                      </p>
                    }
                  </div>
                }
              </div>

            </article>
          } @empty {
            <div class="card empty-filter-state">
              <p>No hay vacunas en esta categoría para la especie de tu mascota.</p>
              <button type="button" class="btn-pill btn-pill--active" (click)="setFilter('ALL')">
                Ver todas las vacunas
              </button>
            </div>
          }
        </div>

        <!-- Emergency / Veterinary Consultation Reminder -->
        <section class="card reminder-card">
          <div class="reminder-icon">🩺</div>
          <div class="reminder-content">
            <h4>Acompañamiento Profesional</h4>
            <p>
              Este registro preventivo te ayuda a recordar fechas y entender las recomendaciones clínicas. Recuerda consultar siempre a tu veterinario de confianza para evaluar el plan vacunal individualizado de acuerdo al peso, edad y estado general de tu mascota.
            </p>
          </div>
        </section>

      } @else {
        <!-- State when no active pet -->
        <section class="card empty-pet-welcome">
          <div class="welcome-icon">🐾</div>
          <h2>Selecciona o registra una mascota</h2>
          <p>Para ver y gestionar la cartilla de vacunación, necesitas tener una mascota activa en el sistema.</p>
          <button type="button" class="btn-primary-action" (click)="openAddPetModal()">
            + Registrar Mascota Ahora
          </button>
        </section>
      }

    </div>
  `,
  styles: [`
    .vaccines-view {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-bottom: 2rem;
    }

    .vax-hero-card {
      background: linear-gradient(135deg, #ffffff 0%, #f4f8f4 100%);
      border: 1px solid rgba(122, 158, 126, 0.25);

      .vax-hero-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;

        .vax-hero-pet {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .vax-pet-avatar {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--color-active);
            box-shadow: 0 0.25rem 0.75rem rgba(0,0,0,0.08);
          }

          .vax-badge-pill {
            display: inline-block;
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            background-color: rgba(122, 158, 126, 0.2);
            color: var(--color-active);
            padding: 0.15rem 0.5rem;
            border-radius: var(--radius-pill);
            margin-bottom: 0.2rem;
          }

          .vax-hero-title {
            font-size: 1.25rem;
            font-weight: 800;
            margin: 0;
            color: var(--color-text-main);
          }

          .vax-hero-sub {
            font-size: 0.75rem;
            color: var(--color-text-muted);
            margin: 0.15rem 0 0 0;
          }
        }

        .btn-back-link {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-active);
          text-decoration: none;
          background: #ffffff;
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-pill);
          border: 1px solid rgba(122, 158, 126, 0.3);
          transition: all 0.15s ease;

          &:hover {
            background-color: var(--color-active-light);
          }
        }
      }

      .vax-progress-wrap {
        background-color: #ffffff;
        border-radius: 1rem;
        padding: 0.75rem;
        border: 1px solid rgba(45, 58, 47, 0.08);

        .progress-labels {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.4rem;

          .progress-title {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--color-text-main);
          }

          .progress-percent {
            font-size: 0.72rem;
            font-weight: 800;
            color: var(--color-active);
          }
        }

        .progress-track {
          height: 0.55rem;
          background-color: rgba(45, 58, 47, 0.08);
          border-radius: var(--radius-pill);
          overflow: hidden;

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #7A9E7E 0%, #5b8760 100%);
            border-radius: var(--radius-pill);
            transition: width 0.4s ease;
          }
        }

        .progress-hint {
          font-size: 0.72rem;
          color: var(--color-text-muted);
          margin: 0.45rem 0 0 0;
          line-height: 1.35;
        }
      }
    }

    .faq-summary-card {
      background-color: #ffffff;
      border: 1px solid rgba(122, 158, 126, 0.2);
      cursor: pointer;
      padding: 0.85rem 1rem;

      .faq-summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .faq-icon-title {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;

          .sparkle-icon {
            font-size: 1.25rem;
          }

          .faq-title {
            font-size: 0.88rem;
            font-weight: 700;
            margin: 0;
            color: var(--color-text-main);
          }

          .faq-sub {
            font-size: 0.72rem;
            color: var(--color-text-muted);
            margin: 0.15rem 0 0 0;
          }
        }

        .faq-arrow {
          font-size: 1.1rem;
          color: var(--color-text-muted);
          transition: transform 0.2s ease;

          &--open {
            transform: rotate(180deg);
          }
        }
      }

      .faq-accordion-body {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px dashed rgba(45, 58, 47, 0.12);
        display: flex;
        flex-direction: column;
        gap: 0.6rem;

        .faq-item-pill {
          background-color: rgba(122, 158, 126, 0.06);
          border-radius: 0.85rem;
          padding: 0.65rem 0.75rem;

          .category-indicator {
            display: inline-block;
            font-size: 0.68rem;
            font-weight: 800;
            padding: 0.15rem 0.45rem;
            border-radius: var(--radius-pill);
            margin-bottom: 0.25rem;

            &.core {
              background-color: rgba(122, 158, 126, 0.25);
              color: #2e5732;
            }

            &.mandatory {
              background-color: rgba(224, 122, 95, 0.2);
              color: #a84227;
            }

            &.lifestyle {
              background-color: rgba(80, 120, 160, 0.2);
              color: #2b5580;
            }
          }

          p {
            font-size: 0.75rem;
            color: var(--color-text-main);
            margin: 0;
            line-height: 1.4;
          }
        }
      }
    }

    .vax-filter-tabs {
      display: flex;
      gap: 0.4rem;
      overflow-x: auto;
      padding-bottom: 0.2rem;

      .tab-btn {
        background-color: #ffffff;
        border: 1px solid rgba(45, 58, 47, 0.12);
        border-radius: var(--radius-pill);
        padding: 0.35rem 0.7rem;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--color-text-muted);
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          border-color: var(--color-active);
          color: var(--color-active);
        }

        &--active {
          background-color: var(--color-active);
          color: #ffffff;
          border-color: var(--color-active);
        }
      }
    }

    .vaccines-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .vax-card {
      background-color: #ffffff;
      border: 1px solid rgba(45, 58, 47, 0.08);
      padding: 0.85rem 1rem;
      transition: all 0.2s ease;

      &--applied {
        border-color: rgba(122, 158, 126, 0.4);
        background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%);
      }

      .vax-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;

        .vax-main-info {
          flex: 1;

          .vax-badge-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            margin-bottom: 0.3rem;

            .category-tag {
              font-size: 0.65rem;
              font-weight: 800;
              padding: 0.12rem 0.45rem;
              border-radius: var(--radius-pill);

              &.tag-core {
                background-color: rgba(122, 158, 126, 0.2);
                color: #2b5730;
              }

              &.tag-mandatory {
                background-color: rgba(224, 122, 95, 0.2);
                color: #9e3d24;
              }

              &.tag-lifestyle {
                background-color: rgba(90, 130, 170, 0.18);
                color: #2b5580;
              }
            }

            .status-tag {
              font-size: 0.65rem;
              font-weight: 700;
              padding: 0.1rem 0.4rem;
              border-radius: var(--radius-pill);

              &.applied {
                background-color: #e5f2e6;
                color: #266b2e;
              }

              &.pending {
                background-color: #f7ebe6;
                color: #b34a2e;
              }
            }
          }

          .vax-name {
            font-size: 0.95rem;
            font-weight: 800;
            color: var(--color-text-main);
            margin: 0;
          }

          .vax-summary-text {
            font-size: 0.75rem;
            color: var(--color-text-muted);
            margin: 0.2rem 0 0 0;
            line-height: 1.35;
          }
        }

        .vax-toggle-action {
          .btn-toggle-apply {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.4rem 0.75rem;
            border-radius: var(--radius-pill);
            border: 1.5px solid rgba(45, 58, 47, 0.18);
            background-color: #ffffff;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--color-text-muted);
            transition: all 0.2s ease;

            .toggle-icon {
              font-size: 0.9rem;
            }

            &--active {
              background-color: var(--color-active);
              border-color: var(--color-active);
              color: #ffffff;
              box-shadow: 0 0.2rem 0.5rem rgba(122, 158, 126, 0.3);
            }
          }
        }
      }

      .vax-date-box {
        margin-top: 0.65rem;
        padding: 0.6rem 0.75rem;
        background-color: rgba(122, 158, 126, 0.08);
        border: 1px solid rgba(122, 158, 126, 0.2);
        border-radius: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .date-input-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;

          label {
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--color-text-main);
          }

          .date-row {
            display: flex;
            align-items: center;
            gap: 0.35rem;

            .form-input-sm {
              padding: 0.25rem 0.45rem;
              font-size: 0.72rem;
              border-radius: var(--radius-pill);
              border: 1px solid rgba(45, 58, 47, 0.15);
            }

            .btn-today-sm {
              background-color: #ffffff;
              border: 1px solid rgba(45, 58, 47, 0.15);
              border-radius: var(--radius-pill);
              padding: 0.25rem 0.5rem;
              font-size: 0.68rem;
              font-weight: 700;
              cursor: pointer;
              color: var(--color-active);

              &:hover {
                background-color: var(--color-active-light);
              }
            }
          }
        }

        .booster-calc-box {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          color: var(--color-text-muted);

          .booster-icon {
            font-size: 0.85rem;
          }

          .booster-val {
            color: var(--color-active);
            font-weight: 800;
            margin-left: 0.25rem;
          }
        }
      }

      .vax-details-expander {
        margin-top: 0.5rem;

        .btn-expand-info {
          width: 100%;
          background: none;
          border: none;
          padding: 0.3rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-active);
          cursor: pointer;
          text-align: left;

          .arrow-indicator {
            font-size: 0.95rem;
            transition: transform 0.2s ease;

            &--open {
              transform: rotate(180deg);
            }
          }
        }

        .educational-content {
          margin-top: 0.4rem;
          padding: 0.65rem 0.75rem;
          background-color: #fbfbf9;
          border-radius: 0.85rem;
          border: 1px solid rgba(45, 58, 47, 0.06);

          .faq-qa-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            .qa-block {
              .qa-question {
                font-size: 0.75rem;
                font-weight: 700;
                color: var(--color-text-main);
                margin: 0 0 0.15rem 0;
              }

              .qa-answer {
                font-size: 0.72rem;
                color: var(--color-text-muted);
                margin: 0;
                line-height: 1.4;
              }
            }
          }

          .vet-tip-box {
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px dashed rgba(45, 58, 47, 0.1);
            display: flex;
            align-items: flex-start;
            gap: 0.45rem;
            font-size: 0.72rem;

            .vet-icon {
              font-size: 1rem;
            }

            .vet-text {
              strong {
                color: var(--color-text-main);
              }
              p {
                margin: 0.1rem 0 0 0;
                color: var(--color-text-muted);
                line-height: 1.35;
              }
            }
          }

          .standard-desc {
            font-size: 0.72rem;
            color: var(--color-text-muted);
            margin: 0;
            line-height: 1.4;
          }
        }
      }
    }

    .empty-filter-state {
      text-align: center;
      padding: 1.5rem;
      p {
        font-size: 0.82rem;
        color: var(--color-text-muted);
        margin-bottom: 0.75rem;
      }
    }

    .reminder-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: linear-gradient(135deg, #f9f8f3 0%, #edf4ee 100%);
      border: 1px solid rgba(122, 158, 126, 0.25);

      .reminder-icon {
        font-size: 1.5rem;
      }

      .reminder-content {
        h4 {
          margin: 0 0 0.25rem 0;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-text-main);
        }

        p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }
      }
    }
  `]
})
export class VaccinesComponent {
  private petService = inject(PetService);

  activePet = this.petService.activePet;
  petVaccines = this.petService.petVaccines;

  today = new Date().toISOString().split('T')[0];

  activeFilter = signal<'ALL' | VaccineCategory>('ALL');
  showFaqSummary = signal<boolean>(false);
  expandedCards = signal<Record<string, boolean>>({});

  totalCount = computed(() => this.petVaccines().length);
  appliedCount = computed(() => this.petVaccines().filter(v => v.applied).length);
  coveragePercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.appliedCount() / total) * 100);
  });

  filteredVaccines = computed(() => {
    const filter = this.activeFilter();
    const list = this.petVaccines();
    if (filter === 'ALL') return list;
    return list.filter(v => v.category === filter);
  });

  // Base de datos de conocimiento veterinario para aclarar dudas comunes
  vaccineGuides: Record<string, VaccineGuideDetail> = {
    'fel-core-triple': {
      code: 'fel-core-triple',
      targetSpecies: 'CAT',
      commonQuestions: [
        {
          question: '¿Por qué es indispensable para gatos?',
          answer: 'Protege contra la Panleucopenia (parvovirus felino, altamente mortal) y el complejo respiratorio (Calicivirus y Rinotraqueítis/Herpesvirus).'
        },
        {
          question: '¿Mi gato vive en departamento y no sale, la necesita?',
          answer: 'SÍ, de forma rotunda. El parvovirus y calicivirus son extremadamente estables en el ambiente y pueden transportarse hacia dentro del hogar en la suela del calzado, ropa o paquetes recibidos.'
        }
      ],
      vetTip: 'Se recomienda administrarla desde cachorros con su protocolo inicial y luego aplicar el refuerzo anual o trienal según prescripción veterinaria.'
    },
    'fel-mandatory-rabies': {
      code: 'fel-mandatory-rabies',
      targetSpecies: 'CAT',
      commonQuestions: [
        {
          question: '¿Por qué es obligatoria?',
          answer: 'La rabia es un virus zoonótico (se transmite de animales a humanos) con letalidad del 100%. La ley de salud pública exige su vacunación a partir de los 3 meses y revacunación anual.'
        },
        {
          question: '¿Qué riesgo hay si no sale?',
          answer: 'Murciélagos u otros pequeños mamíferos que porten el virus pueden ingresar accidentalmente por ventanas o balcones. Además, es un requisito legal ante viajes o traslados.'
        }
      ],
      vetTip: 'Asegúrate de solicitar el certificado oficial de vacunación antirrábica tras la aplicación.'
    },
    'fel-lifestyle-felv': {
      code: 'fel-lifestyle-felv',
      targetSpecies: 'CAT',
      commonQuestions: [
        {
          question: '¿Qué es y a quiénes protege?',
          answer: 'Protege contra el Virus de la Leucemia Felina (FeLV), que debilita el sistema inmune y puede causar neoplasias.'
        },
        {
          question: '¿Cuándo es opcional y cuándo obligatoria?',
          answer: 'Si tu gato es 100% de interior, único gato o convive solo con felinos negativos que nunca salen, es OPCIONAL. Si tu gato tiene acceso a terrazas, techos, patios compartidos o va a guarderías, es ALTAMENTE RECOMENDADA.'
        }
      ],
      vetTip: 'Antes de aplicar esta vacuna por primera vez, el veterinario siempre debe realizar un test rápido serológico para verificar que el gato sea FeLV negativo.'
    },
    'fel-opt-chlamydia': {
      code: 'fel-opt-chlamydia',
      targetSpecies: 'CAT',
      commonQuestions: [
        {
          question: '¿Cuándo se recomienda?',
          answer: 'Protege contra Chlamydia felis, bacteria causante de conjuntivitis severa y secreción ocular. Es opcional y suele reservarse para criaderos, refugios o hogares con múltiples gatos rescatados.'
        }
      ],
      vetTip: 'Si tu gato es único en casa y no tiene contacto exterior, rara vez se requiere.'
    },
    'can-core-multiple': {
      code: 'can-core-multiple',
      targetSpecies: 'DOG',
      commonQuestions: [
        {
          question: '¿Qué previene la Polivalente / Séxtuple?',
          answer: 'Protege contra Distémper (Moquillo), Parvovirus, Hepatitis infecciosa (Adenovirus) y Parainfluenza. Son las patologías virales más contagiosas y letales en caninos.'
        },
        {
          question: '¿Es necesaria si mi perro solo da paseos cortos?',
          answer: 'SÍ, totalmente ESENCIAL. El parvovirus canino persiste durante meses en veredas, césped y postes donde orinaron o defecaron otros perros.'
        }
      ],
      vetTip: 'El plan de refuerzo anual garantiza que el sistema inmunitario mantenga niveles protectores de inmunoglobulinas.'
    },
    'can-mandatory-rabies': {
      code: 'can-mandatory-rabies',
      targetSpecies: 'DOG',
      commonQuestions: [
        {
          question: '¿Por qué es obligatoria por ley?',
          answer: 'La rabia es mortal y transmisible a las personas por mordedura o saliva en contacto con heridas. Es el pilar de salud pública preventiva a nivel mundial.'
        }
      ],
      vetTip: 'Debe colocarse anualmente. Conserva la libreta sanitaria firmada por el médico veterinario matriculado.'
    },
    'can-core-lepto': {
      code: 'can-core-lepto',
      targetSpecies: 'DOG',
      commonQuestions: [
        {
          question: '¿Qué es la Leptospirosis?',
          answer: 'Es una enfermedad bacteriana zoonótica que causa fallo hepático y renal agudo. Se transmite por contacto con agua estancada, charcos o barro contaminado con orina de roedores.'
        },
        {
          question: '¿Cuándo es prioritaria?',
          answer: 'En cualquier perro que camine por la calle o parques donde pueda haber roedores o beba agua de charcos. Suele venir combinada en la vacuna polivalente.'
        }
      ],
      vetTip: 'Dado que la inmunidad bacteriana decae más rápido que la viral, en zonas endémicas puede recomendarse refuerzo cada 6 a 12 meses.'
    },
    'can-lifestyle-bordetella': {
      code: 'can-lifestyle-bordetella',
      targetSpecies: 'DOG',
      commonQuestions: [
        {
          question: '¿Qué es la Tos de las Perreras?',
          answer: 'Es una traqueobronquitis infecciosa altamente contagiosa que produce tos seca y carraspeo persistente.'
        },
        {
          question: '¿Es opcional?',
          answer: 'Es según estilo de vida: opcional para perros de vida tranquila y solitaria, pero CASI OBLIGATORIA si asiste a guarderías caninas, parques de perros, exposiciones o peluquerías.'
        }
      ],
      vetTip: 'Muchas guarderías y hoteles caninos exigen la vacuna de Bordetella aplicada en los últimos 6 meses para admitir al animal.'
    },
    'can-opt-giardia': {
      code: 'can-opt-giardia',
      targetSpecies: 'DOG',
      commonQuestions: [
        {
          question: '¿Para qué sirve la vacuna de Giardia?',
          answer: 'Ayuda a reducir la severidad de la diarrea y la eliminación de quistes en perros expuestos a parásitos en aguas o césped contaminado. No previene el contagio al 100%, pero atenúa el cuadro clínico.'
        }
      ],
      vetTip: 'Es opcional y se evalúa individualmente con el veterinario según antecedentes digestivos.'
    }
  };

  setFilter(filter: 'ALL' | VaccineCategory) {
    this.activeFilter.set(filter);
  }

  toggleFaqSummary() {
    this.showFaqSummary.update(v => !v);
  }

  toggleDetails(code: string) {
    const current = this.expandedCards();
    this.expandedCards.set({
      ...current,
      [code]: !current[code]
    });
  }

  isExpanded(code: string): boolean {
    return Boolean(this.expandedCards()[code]);
  }

  getGuideDetails(code: string): VaccineGuideDetail | null {
    return this.vaccineGuides[code] || null;
  }

  getCategoryLabel(cat: VaccineCategory): string {
    switch (cat) {
      case 'CORE': return '⭐ Esencial (Core)';
      case 'MANDATORY': return '⚖️ Obligatoria por Ley';
      case 'LIFESTYLE': return '🏡 Según Estilo de Vida';
      default: return 'Preventiva';
    }
  }

  getCategoryClass(cat: VaccineCategory): string {
    switch (cat) {
      case 'CORE': return 'tag-core';
      case 'MANDATORY': return 'tag-mandatory';
      case 'LIFESTYLE': return 'tag-lifestyle';
      default: return '';
    }
  }

  toggleApplied(vax: PetVaccine) {
    const pet = this.activePet();
    if (!pet) return;

    const newApplied = !vax.applied;
    const newDate = newApplied ? (vax.applied_date || this.today) : undefined;

    this.petService.updateVaccine(pet.id, vax.vaccine_code, newApplied, newDate, vax.notes).subscribe();
  }

  onDateChange(vax: PetVaccine, date: string) {
    const pet = this.activePet();
    if (!pet || !date) return;

    this.petService.updateVaccine(pet.id, vax.vaccine_code, true, date, vax.notes).subscribe();
  }

  setToday(vax: PetVaccine) {
    this.onDateChange(vax, this.today);
  }

  calculateBoosterDate(appliedDate?: string): string {
    if (!appliedDate) return 'Pendiente';
    try {
      const date = new Date(appliedDate.split('T')[0]);
      date.setFullYear(date.getFullYear() + 1);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '1 año tras aplicación';
    }
  }

  openAddPetModal() {
    this.petService.openAddPetModal();
  }
}
