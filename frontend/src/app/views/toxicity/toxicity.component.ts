import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PetService } from '../../services/pet.service';
import { ToxicityItem, ToxicityCategory, DangerLevel } from '../../models/pet.models';

@Component({
  selector: 'app-toxicity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="toxicity-view">
      
      <!-- View Header -->
      <div class="view-header">
        <h1>Buscador de Toxicidad</h1>
        <p class="text-muted">Consulta rápida de plantas, alimentos y químicos peligrosos para <strong>{{ activePet()?.name || 'tu mascota' }}</strong></p>
      </div>

      <!-- Emergency Hotline Card -->
      <section class="card emergency-banner">
        <div class="emergency-content">
          <div class="emergency-icon">🚨</div>
          <div class="emergency-text">
            <h4>¿Sospechas de intoxicación aguda?</h4>
            <p>No esperes a la aparición de síntomas graves. Encuentra la clínica 24h más cercana.</p>
          </div>
        </div>
        <a 
          href="https://www.google.com/maps/search/?api=1&query=urgencias+veterinaria" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn-pill emergency-call-btn"
          id="btn-urgencias-vet-maps"
          title="Abrir Google Maps con urgencias veterinarias cercanas">
          📍 Llamar Urgencias Vet (Google Maps)
        </a>
      </section>

      <!-- Search Input -->
      <div class="search-box">
        <div class="search-icon">🔍</div>
        <input 
          type="search"
          class="form-input search-input"
          placeholder="Buscar lirio, chocolate, paracetamol..."
          [ngModel]="searchQuery()"
          (ngModelChange)="onSearchChange($event)" />
        @if (searchQuery()) {
          <button type="button" class="clear-btn" (click)="clearSearch()">✕</button>
        }
      </div>

      <!-- Category Filter Pills -->
      <div class="category-scroll">
        @for (cat of categories; track cat.id) {
          <button 
            type="button" 
            class="btn-pill cat-pill"
            [class.btn-pill--active]="selectedCategory() === cat.id"
            (click)="onCategorySelect(cat.id)">
            <span>{{ cat.icon }}</span>
            <span>{{ cat.label }}</span>
          </button>
        }
      </div>

      <!-- Results Count -->
      <div class="results-meta">
        <span>Mostrando <strong>{{ filteredItems().length }}</strong> elementos catalogados</span>
      </div>

      <!-- Items List -->
      <div class="directory-list">
        @for (item of filteredItems(); track item.id) {
          <article class="card toxicity-card" [class]="'border--' + item.danger_level.toLowerCase()">
            <div class="card-head">
              <div class="title-wrap">
                <span class="category-emoji">{{ getCategoryEmoji(item.category) }}</span>
                <h3 class="item-name">{{ item.name }}</h3>
              </div>
              <span class="badge" [class]="'badge--' + item.danger_level.toLowerCase()">
                {{ translateDanger(item.danger_level) }}
              </span>
            </div>

            <div class="species-tag-row">
              <span class="target-tag">
                Especie en riesgo: 
                <strong>{{ item.target_species === 'CAT' ? '🐱 Felinos' : (item.target_species === 'DOG' ? '🐶 Caninos' : '🐾 Perros y Gatos') }}</strong>
              </span>
            </div>

            <div class="info-block">
              <span class="block-label">⚠️ Síntomas:</span>
              <p class="symptoms-text">{{ item.symptoms }}</p>
            </div>

            <div class="action-block" [class]="'action-block--' + item.danger_level.toLowerCase()">
              <span class="action-label">🚑 Acción Requerida:</span>
              <p class="action-text">{{ item.action_required }}</p>
            </div>
          </article>
        } @empty {
          <div class="card empty-results">
            <span class="empty-icon">🔎</span>
            <h3>No se encontraron coincidencias</h3>
            <p>Intenta con otro término o selecciona "Todos" en los filtros de categorías.</p>
            <button type="button" class="btn-pill btn-pill--active" (click)="resetFilters()">Ver todos los elementos</button>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .toxicity-view {
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

    .emergency-banner {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border: 1.5px solid #f87171;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;

      .emergency-content {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .emergency-icon {
          font-size: 1.8rem;
        }

        h4 {
          color: #991b1b;
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
        }

        p {
          color: #7f1d1d;
          font-size: 0.78rem;
          margin: 0;
        }
      }

      .emergency-call-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background-color: #dc2626;
        color: #ffffff;
        font-weight: 800;
        font-size: 0.9rem;
        border: none;
        text-align: center;
        text-decoration: none;
        box-shadow: 0 0.25rem 0.75rem rgba(220, 38, 38, 0.35);
        transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
        cursor: pointer;

        &:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 0.4rem 1rem rgba(220, 38, 38, 0.45);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;

      .search-icon {
        position: absolute;
        left: 1rem;
        font-size: 1rem;
        pointer-events: none;
      }

      .search-input {
        padding-left: 2.5rem;
        padding-right: 2.5rem;
      }

      .clear-btn {
        position: absolute;
        right: 0.75rem;
        background: none;
        border: none;
        font-size: 0.9rem;
        color: var(--color-text-muted);
        cursor: pointer;
        padding: 0.25rem;
      }
    }

    .category-scroll {
      display: flex;
      gap: 0.4rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        display: none;
      }

      .cat-pill {
        white-space: nowrap;
        font-size: 0.8rem;
        padding: 0.4rem 0.75rem;
        flex-shrink: 0;
      }
    }

    .results-meta {
      font-size: 0.78rem;
      color: var(--color-text-muted);
      padding: 0 0.25rem;
    }

    .directory-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .toxicity-card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border-left: 5px solid transparent;

      &.border--fatal {
        border-left-color: var(--danger-fatal);
      }
      &.border--severe {
        border-left-color: var(--danger-severe);
      }
      &.border--moderate {
        border-left-color: var(--danger-moderate);
      }
      &.border--mild {
        border-left-color: var(--danger-mild);
      }
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;

      .title-wrap {
        display: flex;
        align-items: center;
        gap: 0.4rem;

        .category-emoji {
          font-size: 1.2rem;
        }

        .item-name {
          font-size: 1.05rem;
          font-weight: 800;
          margin: 0;
        }
      }
    }

    .species-tag-row {
      .target-tag {
        font-size: 0.75rem;
        color: var(--color-text-muted);
      }
    }

    .info-block {
      .block-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--color-text-muted);
      }

      .symptoms-text {
        font-size: 0.85rem;
        color: var(--color-text-main);
        margin-top: 0.15rem;
      }
    }

    .action-block {
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-pill);
      background-color: var(--color-active-light);

      .action-label {
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--color-active);
        display: block;
      }

      .action-text {
        font-size: 0.825rem;
        font-weight: 600;
        color: var(--color-text-main);
        margin-top: 0.15rem;
      }

      &--fatal {
        background-color: #fee2e2;
        .action-label { color: #991b1b; }
      }

      &--severe {
        background-color: var(--color-alert-light);
        .action-label { color: #9c361c; }
      }
    }

    .empty-results {
      text-align: center;
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .empty-icon {
        font-size: 2.5rem;
      }
    }
  `]
})
export class ToxicityComponent {
  private petService = inject(PetService);

  activePet = this.petService.activePet;
  toxicityItems = this.petService.toxicityItems;

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('ALL');

  categories = [
    { id: 'ALL', label: 'Todos', icon: '✨' },
    { id: 'PLANT', label: 'Plantas', icon: '🌿' },
    { id: 'FOOD', label: 'Alimentos', icon: '🍫' },
    { id: 'MEDICATION', label: 'Medicamentos', icon: '💊' },
    { id: 'OBJECT', label: 'Objetos', icon: '🧵' },
    { id: 'CHEMICAL', label: 'Químicos', icon: '🧪' }
  ];

  filteredItems = computed(() => {
    let items = this.toxicityItems();
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();

    if (cat !== 'ALL') {
      items = items.filter(i => i.category.toUpperCase() === cat);
    }

    if (query) {
      items = items.filter(i =>
        i.name.toLowerCase().includes(query) ||
        i.symptoms.toLowerCase().includes(query) ||
        i.action_required.toLowerCase().includes(query)
      );
    }

    return items;
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  onCategorySelect(catId: string) {
    this.selectedCategory.set(catId);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('ALL');
  }

  translateDanger(level: DangerLevel): string {
    switch (level) {
      case 'FATAL': return 'Peligro Mortal';
      case 'SEVERE': return 'Peligro Severo';
      case 'MODERATE': return 'Moderado';
      case 'MILD': return 'Leve';
      default: return level;
    }
  }

  getCategoryEmoji(category: ToxicityCategory): string {
    switch (category) {
      case 'PLANT': return '🌿';
      case 'FOOD': return '🍫';
      case 'MEDICATION': return '💊';
      case 'OBJECT': return '🧵';
      case 'CHEMICAL': return '🧪';
      default: return '⚠️';
    }
  }
}
