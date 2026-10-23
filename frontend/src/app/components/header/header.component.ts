import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PetService } from '../../services/pet.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      
      <!-- Top User Session Row -->
      <div class="user-session-bar">
        @if (currentUser()) {
          <div class="user-pill" (click)="openUserModal()" title="Gestionar mi cuenta">
            <span class="user-avatar-circle">{{ getUserInitial(currentUser()?.name) }}</span>
            <span class="user-name-text">{{ currentUser()?.name }}</span>
            <span class="user-gear-icon">⚙️</span>
          </div>

          <button type="button" class="logout-btn" (click)="onLogout()" title="Cerrar sesión">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Salir</span>
          </button>
        } @else {
          <div class="guest-bar">
            <span class="guest-tag">Modo Invitado</span>
            <button type="button" class="login-nav-btn" (click)="goToLogin()">
              Iniciar Sesión / Registro →
            </button>
          </div>
        }
      </div>

      <!-- Pet Selector Row -->
      @if (activePet()) {
        <div class="pet-selector-bar">
          <div class="user-greeting">
            <span class="greeting-sub">Cuidado Preventivo</span>
            <div class="pet-title-row">
              <h2 class="pet-title">{{ activePet()?.name }}</h2>
              <span class="species-tag">{{ activePet()?.species === 'CAT' ? '🐱 Felino' : '🐶 Canino' }}</span>
              <button 
                type="button" 
                class="edit-pet-icon-btn" 
                (click)="openEditModal()"
                title="Editar datos, peso o foto de perfil">
                ✏️
              </button>
            </div>
          </div>

          <!-- Pet Avatar & Quick Switcher -->
          <div class="pets-switch">
            @if (pets().length > 1) {
              @for (pet of pets(); track pet.id + (pet.avatar_url || '')) {
                <button 
                  type="button" 
                  class="pet-avatar-btn" 
                  [class.pet-avatar-btn--active]="pet.id === activePet()?.id"
                  (click)="onSelectPet(pet.id)"
                  [title]="'Cambiar a ' + pet.name">
                  <img [src]="pet.avatar_url || (pet.species === 'CAT' ? defaultCatAvatar : defaultDogAvatar)" [alt]="pet.name" class="avatar-img" />
                  @if (pet.id === activePet()?.id) {
                    <span class="status-indicator"></span>
                  }
                </button>
              }
            } @else if (activePet(); as pet) {
              <button 
                type="button" 
                class="pet-avatar-btn pet-avatar-btn--active" 
                (click)="openEditModal()"
                [title]="'Ver/editar perfil de ' + pet.name">
                <img [src]="pet.avatar_url || (pet.species === 'CAT' ? defaultCatAvatar : defaultDogAvatar)" [alt]="pet.name" class="avatar-img" />
              </button>
            }

            <!-- Botón Agregar otra Mascota -->
            <button 
              type="button" 
              class="add-pet-circle-btn" 
              (click)="showAddPetModal.set(true)"
              title="Agregar otra mascota">
              +
            </button>
          </div>
        </div>

        <!-- Pet Quick Info Ribbon -->
        <div class="pet-ribbon" (click)="openEditModal()" title="Haz clic para actualizar datos o ficha">
          <div class="ribbon-item">
            <span class="ribbon-label">Sexo</span>
            <span class="ribbon-val">{{ activePet()?.sex === 'MALE' ? '♂ Macho' : '♀ Hembra' }}</span>
          </div>
          <div class="ribbon-divider"></div>
          <div class="ribbon-item">
            <span class="ribbon-label">Castración</span>
            <span class="ribbon-val">{{ activePet()?.is_neutered ? '✂️ Sí' : 'No' }}</span>
          </div>
          <div class="ribbon-divider"></div>
          <div class="ribbon-item">
            <span class="ribbon-label">Peso Actual</span>
            <span class="ribbon-val">{{ activePet()?.weight_kg }} kg</span>
          </div>
          <div class="ribbon-divider"></div>
          <div class="ribbon-item">
            <span class="ribbon-label">Edad</span>
            <span class="ribbon-val">{{ getAge(activePet()?.birth_date) }}</span>
          </div>
        </div>
      } @else {
        <!-- State when user has no pets yet -->
        <div class="no-pet-bar">
          <div>
            <h3 class="no-pet-title">Aún no tienes mascotas registradas</h3>
            <p class="no-pet-sub">Comienza agregando a tu compañero/a.</p>
          </div>
          <button type="button" class="btn-pill btn-pill--active" (click)="showAddPetModal.set(true)">
            + Registrar Mascota
          </button>
        </div>
      }

      <!-- MODAL PARA EDITAR DATOS DE LA MASCOTA -->
      @if (showEditModal()) {
        <div class="modal-backdrop" (click)="closeEditModal()">
          <div class="modal-card card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Editar Ficha de Mascota</h3>
              <button type="button" class="close-x" (click)="closeEditModal()">✕</button>
            </div>

            <form (ngSubmit)="handleSaveEdit()">
              <!-- Avatar Preview and Selection (Única foto del gato/perro) -->
              <div class="avatar-edit-section">
                <div class="avatar-preview-wrap">
                  <img [src]="editAvatarUrl() || (editSpecies === 'CAT' ? defaultCatAvatar : defaultDogAvatar)" alt="Preview" class="avatar-preview-img" />
                </div>
                <div class="avatar-actions-col">
                  <span class="sub-label">Foto de {{ editName || 'la mascota' }}:</span>

                  <label class="btn-upload-file">
                    <input 
                      type="file" 
                      accept="image/*" 
                      (change)="onEditFileSelected($event)" 
                      style="display:none;" />
                    📷 {{ isCustomAvatar(editAvatarUrl()) ? 'Cambiar foto de mi mascota' : 'Subir foto de mi mascota' }}
                  </label>

                  @if (isCustomAvatar(editAvatarUrl())) {
                    <button 
                      type="button" 
                      class="btn-remove-avatar" 
                      (click)="removeCustomAvatar('edit')">
                      ✕ Quitar foto personalizada
                    </button>
                  }
                  <span class="field-hint">Esta es la única foto exclusiva de su perfil.</span>
                </div>
              </div>

              <!-- Nombre -->
              <div class="form-group">
                <label for="editPetName">Nombre de la Mascota *</label>
                <input 
                  id="editPetName"
                  type="text" 
                  class="form-input" 
                  [(ngModel)]="editName" 
                  name="editName" 
                  maxlength="50"
                  placeholder="Ej: Chester, Luna..."
                  required />
              </div>

              <!-- Especie -->
              <div class="form-group">
                <label>Especie</label>
                <div class="species-toggle-row">
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="editSpecies === 'CAT'"
                    (click)="setEditSpecies('CAT')">
                    🐱 Felino (Gato)
                  </button>
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="editSpecies === 'DOG'"
                    (click)="setEditSpecies('DOG')">
                    🐶 Canino (Perro)
                  </button>
                </div>
              </div>

              <!-- Sexo -->
              <div class="form-group">
                <label>Sexo de la Mascota *</label>
                <div class="species-toggle-row">
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="editSex === 'FEMALE'"
                    (click)="editSex = 'FEMALE'">
                    ♀ Hembra
                  </button>
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="editSex === 'MALE'"
                    (click)="editSex = 'MALE'">
                    ♂ Macho
                  </button>
                </div>
              </div>

              <!-- Castración / Esterilización -->
              <div class="form-group">
                <label>¿Está castrado/a o esterilizado/a?</label>
                <div class="species-toggle-row">
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="editIsNeutered === true"
                    (click)="editIsNeutered = true">
                    ✂️ Sí, operado/a
                  </button>
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="editIsNeutered === false"
                    (click)="editIsNeutered = false">
                    No está castrado/a
                  </button>
                </div>

                @if (editIsNeutered) {
                  <div class="neutered-date-box">
                    <label for="editNeuteredDate">Fecha de la cirugía u operación (estimada o exacta)</label>
                    <input 
                      id="editNeuteredDate"
                      type="date" 
                      [max]="today"
                      class="form-input" 
                      [(ngModel)]="editNeuteredDate" 
                      name="editNeuteredDate" />
                    <span class="field-hint">Permite llevar el historial clínico y calcular controles preventivos.</span>
                  </div>
                }
              </div>

              <!-- Peso Actual con Stepper rápido -->
              <div class="form-group">
                <label for="editPetWeight">Peso Actual (kg) *</label>
                <input 
                  id="editPetWeight"
                  type="number" 
                  step="0.05" 
                  min="0.1" 
                  max="150" 
                  class="form-input" 
                  [(ngModel)]="editWeight" 
                  name="editWeight" 
                  required />
                
                <div class="stepper-row">
                  <button type="button" class="stepper-btn" (click)="adjustEditWeight(-0.5)">-0.5 kg</button>
                  <button type="button" class="stepper-btn" (click)="adjustEditWeight(-0.1)">-0.1 kg</button>
                  <button type="button" class="stepper-btn" (click)="adjustEditWeight(+0.1)">+0.1 kg</button>
                  <button type="button" class="stepper-btn" (click)="adjustEditWeight(+0.5)">+0.5 kg</button>
                </div>
                <span class="field-hint">Permite decimales (ej: 4.25). Rango válido: 0.1 a 150 kg.</span>
              </div>

              <!-- Fecha de Nacimiento / Edad con Píldoras rápidas -->
              <div class="form-group">
                <label for="editPetBirth">Fecha de Nacimiento *</label>
                <input 
                  id="editPetBirth"
                  type="date" 
                  [max]="today"
                  class="form-input" 
                  [(ngModel)]="editBirthDate" 
                  name="editBirthDate" 
                  required />
                
                <div class="quick-age-box">
                  <span class="sub-label">Ajuste rápido de edad:</span>
                  <div class="quick-age-pills">
                    <button type="button" class="age-pill-btn" (click)="setEditAgeMonths(3)">3m</button>
                    <button type="button" class="age-pill-btn" (click)="setEditAgeMonths(6)">6m</button>
                    <button type="button" class="age-pill-btn" (click)="setEditAgeMonths(12)">1 año</button>
                    <button type="button" class="age-pill-btn" (click)="setEditAgeMonths(24)">2 años</button>
                    <button type="button" class="age-pill-btn" (click)="setEditAgeMonths(36)">3 años</button>
                    <button type="button" class="age-pill-btn" (click)="setEditAgeMonths(60)">5 años</button>
                    <button type="button" class="age-pill-btn" (click)="setEditAgeMonths(96)">8 años</button>
                    <button type="button" class="age-pill-btn" (click)="setEditAgeMonths(120)">10 años</button>
                  </div>
                </div>

                <div class="age-calc-badge">
                  🎂 Edad calculada: <strong>{{ getAge(editBirthDate) }}</strong>
                </div>
              </div>

              @if (editErrorMessage()) {
                <div class="modal-error-alert">
                  {{ editErrorMessage() }}
                </div>
              }

              <button 
                type="submit" 
                class="btn-primary-action"
                [disabled]="isSavingEdit()">
                {{ isSavingEdit() ? 'Guardando Cambios...' : 'Guardar Cambios' }}
              </button>

              <!-- Eliminar Perfil -->
              <div class="danger-zone-box">
                @if (!confirmingDelete()) {
                  <button 
                    type="button" 
                    class="btn-delete-pet-trigger" 
                    (click)="confirmingDelete.set(true)">
                    🗑️ Eliminar este perfil de mascota
                  </button>
                } @else {
                  <div class="delete-confirmation-prompt">
                    <p class="delete-warn-text">
                      ¿Seguro/a de que deseas eliminar el perfil de <strong>{{ editName }}</strong>? Se borrarán sus datos y registros asociados.
                    </p>
                    <div class="delete-actions-row">
                      <button 
                        type="button" 
                        class="btn-confirm-delete"
                        [disabled]="isDeletingPet()"
                        (click)="handleDeletePet()">
                        {{ isDeletingPet() ? 'Eliminando...' : 'Sí, eliminar perfil' }}
                      </button>
                      <button 
                        type="button" 
                        class="btn-cancel-delete" 
                        (click)="confirmingDelete.set(false)">
                        Cancelar
                      </button>
                    </div>
                  </div>
                }
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL PARA REGISTRAR NUEVA MASCOTA -->
      @if (showAddPetModal()) {
        <div class="modal-backdrop" (click)="closeAddModal()">
          <div class="modal-card card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Registrar Mascota</h3>
              <button type="button" class="close-x" (click)="closeAddModal()">✕</button>
            </div>

            <form (ngSubmit)="handleAddPet()">
              <!-- Avatar Preview and Selection -->
              <div class="avatar-edit-section">
                <div class="avatar-preview-wrap">
                  <img [src]="newPetAvatar() || (newPetSpecies === 'CAT' ? defaultCatAvatar : defaultDogAvatar)" alt="Preview" class="avatar-preview-img" />
                </div>
                <div class="avatar-actions-col">
                  <span class="sub-label">Foto de tu mascota:</span>
                  <label class="btn-upload-file">
                    <input 
                      type="file" 
                      accept="image/*" 
                      (change)="onAddFileSelected($event)" 
                      style="display:none;" />
                    📷 Subir foto desde este dispositivo
                  </label>
                  <span class="field-hint">Sube la foto que identificará a tu mascota.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="newPetName">Nombre de la Mascota *</label>
                <input 
                  id="newPetName"
                  type="text" 
                  class="form-input" 
                  placeholder="ej: Rocky, Misi, Oliver..." 
                  [(ngModel)]="newPetName" 
                  name="newPetName" 
                  maxlength="50"
                  required />
              </div>

              <div class="form-group">
                <label>Especie</label>
                <div class="species-toggle-row">
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="newPetSpecies === 'CAT'"
                    (click)="setNewPetSpecies('CAT')">
                    🐱 Felino (Gato)
                  </button>
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="newPetSpecies === 'DOG'"
                    (click)="setNewPetSpecies('DOG')">
                    🐶 Canino (Perro)
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Sexo de la Mascota</label>
                <div class="species-toggle-row">
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="newPetSex === 'FEMALE'"
                    (click)="newPetSex = 'FEMALE'">
                    ♀ Hembra
                  </button>
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="newPetSex === 'MALE'"
                    (click)="newPetSex = 'MALE'">
                    ♂ Macho
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>¿Está castrado/a o esterilizado/a?</label>
                <div class="species-toggle-row">
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="newPetIsNeutered === true"
                    (click)="newPetIsNeutered = true">
                    ✂️ Sí, operado/a
                  </button>
                  <button 
                    type="button" 
                    class="btn-pill" 
                    [class.btn-pill--active]="newPetIsNeutered === false"
                    (click)="newPetIsNeutered = false">
                    No
                  </button>
                </div>

                @if (newPetIsNeutered) {
                  <div class="neutered-date-box">
                    <label for="newPetNeuteredDate">Fecha aproximada de la operación</label>
                    <input 
                      id="newPetNeuteredDate"
                      type="date" 
                      [max]="today"
                      class="form-input" 
                      [(ngModel)]="newPetNeuteredDate" 
                      name="newPetNeuteredDate" />
                  </div>
                }
              </div>

              <div class="form-group">
                <label for="newPetWeight">Peso Actual (kg) *</label>
                <input 
                  id="newPetWeight"
                  type="number" 
                  step="0.05" 
                  min="0.1" 
                  max="150" 
                  class="form-input" 
                  [(ngModel)]="newPetWeight" 
                  name="newPetWeight" 
                  required />

                <div class="stepper-row">
                  <button type="button" class="stepper-btn" (click)="adjustNewPetWeight(-0.5)">-0.5 kg</button>
                  <button type="button" class="stepper-btn" (click)="adjustNewPetWeight(-0.1)">-0.1 kg</button>
                  <button type="button" class="stepper-btn" (click)="adjustNewPetWeight(+0.1)">+0.1 kg</button>
                  <button type="button" class="stepper-btn" (click)="adjustNewPetWeight(+0.5)">+0.5 kg</button>
                </div>
              </div>

              <div class="form-group">
                <label for="newPetBirth">Fecha de Nacimiento</label>
                <input 
                  id="newPetBirth"
                  type="date" 
                  [max]="today"
                  class="form-input" 
                  [(ngModel)]="newPetBirthDate" 
                  name="newPetBirthDate" />

                <div class="quick-age-box">
                  <span class="sub-label">Ajuste rápido:</span>
                  <div class="quick-age-pills">
                    <button type="button" class="age-pill-btn" (click)="setAddAgeMonths(3)">3m</button>
                    <button type="button" class="age-pill-btn" (click)="setAddAgeMonths(6)">6m</button>
                    <button type="button" class="age-pill-btn" (click)="setAddAgeMonths(12)">1 año</button>
                    <button type="button" class="age-pill-btn" (click)="setAddAgeMonths(24)">2 años</button>
                    <button type="button" class="age-pill-btn" (click)="setAddAgeMonths(36)">3 años</button>
                    <button type="button" class="age-pill-btn" (click)="setAddAgeMonths(60)">5 años</button>
                  </div>
                </div>

                <div class="age-calc-badge">
                  🎂 Edad: <strong>{{ getAge(newPetBirthDate) }}</strong>
                </div>
              </div>

              @if (addErrorMessage()) {
                <div class="modal-error-alert">
                  {{ addErrorMessage() }}
                </div>
              }

              <button 
                type="submit" 
                class="btn-primary-action"
                [disabled]="isSavingPet() || !newPetName">
                {{ isSavingPet() ? 'Guardando Mascota...' : 'Guardar Mascota' }}
              </button>
            </form>
          </div>
        </div>
      }

      <!-- MODAL DE GESTIÓN DE CUENTA DE USUARIO -->
      @if (showUserModal()) {
        <div class="modal-backdrop" (click)="closeUserModal()">
          <div class="modal-card card user-account-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Mi Cuenta</h3>
              <button type="button" class="close-x" (click)="closeUserModal()">✕</button>
            </div>

            <div class="user-account-content">
              <div class="user-info-card">
                <div class="user-avatar-lg">
                  {{ getUserInitial(currentUser()?.name) }}
                </div>
                <div class="user-details-col">
                  <h4 class="user-fullname">{{ currentUser()?.name }}</h4>
                  <p class="user-email-text">✉️ {{ currentUser()?.email }}</p>
                  <span class="user-status-pill">✅ Cuenta Verificada</span>
                </div>
              </div>

              <div class="user-account-actions">
                <button type="button" class="btn-account-logout" (click)="onLogout()">
                  🚪 Cerrar Sesión
                </button>
              </div>

              <!-- ZONA DE PELIGRO: ELIMINAR CUENTA COMPLETA -->
              <div class="danger-zone-box">
                @if (!confirmingDeleteAccount()) {
                  <button 
                    type="button" 
                    class="btn-delete-account-trigger" 
                    (click)="confirmingDeleteAccount.set(true)">
                    🗑️ Eliminar mi cuenta permanentemente
                  </button>
                } @else {
                  <div class="delete-confirmation-prompt">
                    <p class="delete-warn-text">
                      ⚠️ <strong>¿Seguro/a de que deseas eliminar tu cuenta?</strong>
                      Se borrará definitivamente tu usuario (<strong>{{ currentUser()?.email }}</strong>), todas tus mascotas registradas y sus datos clínicos asociados.
                    </p>
                    <p class="delete-subwarn-text">
                      Esta acción <strong>no se puede deshacer</strong> y liberará este correo para que puedas volver a registrarte cuando quieras.
                    </p>
                    @if (deleteAccountError()) {
                      <p class="error-msg">{{ deleteAccountError() }}</p>
                    }
                    <div class="delete-actions-row">
                      <button 
                        type="button" 
                        class="btn-confirm-delete"
                        [disabled]="isDeletingAccount()"
                        (click)="handleDeleteAccount()">
                        {{ isDeletingAccount() ? 'Eliminando cuenta...' : 'Sí, eliminar mi cuenta definitivamente' }}
                      </button>
                      <button 
                        type="button" 
                        class="btn-cancel-delete" 
                        [disabled]="isDeletingAccount()"
                        (click)="confirmingDeleteAccount.set(false)">
                        Cancelar
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

    </header>
  `,
  styles: [`
    .app-header {
      padding: 0.75rem 1rem 0.5rem 1rem;
      background-color: var(--color-bg-main);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .user-session-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid rgba(45, 58, 47, 0.1);

      .user-pill {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-pill);
        transition: background-color 0.2s ease;

        &:hover {
          background-color: rgba(45, 58, 47, 0.08);
        }

        .user-avatar-circle {
          width: 1.5rem;
          height: 1.5rem;
          background-color: var(--color-active);
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .user-name-text {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-text-main);
        }

        .user-gear-icon {
          font-size: 0.75rem;
          opacity: 0.7;
        }
      }

      .logout-btn {
        background: none;
        border: none;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #9c361c;
        cursor: pointer;
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-pill);
        background-color: rgba(224, 122, 95, 0.15);
        transition: background-color 0.2s ease;

        &:hover {
          background-color: rgba(224, 122, 95, 0.25);
        }
      }

      .guest-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        .guest-tag {
          font-size: 0.72rem;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .login-nav-btn {
          background: none;
          border: none;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-active);
          cursor: pointer;
        }
      }
    }

    .pet-selector-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .user-greeting {
      display: flex;
      flex-direction: column;

      .greeting-sub {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-muted);
      }

      .pet-title-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .pet-title {
        font-size: 1.35rem;
        font-weight: 800;
        margin: 0;
      }

      .species-tag {
        font-size: 0.7rem;
        font-weight: 600;
        background-color: var(--color-card-bg);
        color: var(--color-active);
        padding: 0.15rem 0.45rem;
        border-radius: var(--radius-pill);
      }

      .edit-pet-icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.85rem;
        padding: 0.2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.2);
        }
      }
    }

    .pets-switch {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .pet-avatar-btn {
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 50%;
      border: 2px solid transparent;
      padding: 0;
      background: none;
      cursor: pointer;
      position: relative;
      transition: transform 0.2s ease, border-color 0.2s ease;

      .avatar-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      &--active {
        border-color: var(--color-active);
        transform: scale(1.08);
        box-shadow: 0 0.25rem 0.75rem rgba(45, 58, 47, 0.2);
      }

      .status-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 0.7rem;
        height: 0.7rem;
        background-color: #2ec4b6;
        border: 2px solid var(--color-bg-main);
        border-radius: 50%;
      }
    }

    .add-pet-circle-btn {
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 50%;
      background-color: var(--color-card-bg);
      border: 1.5px dashed var(--color-active);
      color: var(--color-active);
      font-size: 1.2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--color-active-light);
        transform: scale(1.05);
      }
    }

    .no-pet-bar {
      background-color: var(--color-card-bg);
      border-radius: 1rem;
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 0.25rem 0.75rem var(--color-shadow);

      .no-pet-title {
        font-size: 0.9rem;
        font-weight: 700;
        margin: 0;
      }

      .no-pet-sub {
        font-size: 0.75rem;
        color: var(--color-text-muted);
        margin: 0;
      }
    }

    .pet-ribbon {
      background-color: var(--color-card-bg);
      border-radius: var(--radius-pill);
      padding: 0.45rem 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 0.25rem 0.75rem var(--color-shadow);
      cursor: pointer;
      transition: filter 0.2s ease, transform 0.2s ease;

      &:hover {
        filter: brightness(0.98);
        transform: translateY(-1px);
      }
    }

    .ribbon-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .ribbon-label {
        font-size: 0.65rem;
        color: var(--color-text-muted);
        text-transform: uppercase;
        font-weight: 600;
      }

      .ribbon-val {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--color-text-main);
      }

      .text-success {
        color: var(--color-active);
      }
    }

    .ribbon-divider {
      width: 1px;
      height: 1.3rem;
      background-color: rgba(45, 58, 47, 0.1);
    }

    // Modal
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
      max-width: 22.5rem;
      box-shadow: 0 1rem 3rem rgba(0,0,0,0.25);
      max-height: 90vh;
      overflow-y: auto;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.85rem;

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
        gap: 0.75rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        label {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .field-hint {
          font-size: 0.7rem;
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

      .avatar-edit-section {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: #f8fbf8;
        padding: 0.65rem;
        border-radius: 1rem;
        border: 1px solid rgba(45, 58, 47, 0.08);

        .avatar-preview-wrap {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
          border: 2px solid var(--color-active);
          overflow: hidden;
          flex-shrink: 0;

          .avatar-preview-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .avatar-actions-col {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex: 1;

          .sub-label {
            font-size: 0.68rem;
            font-weight: 700;
            color: var(--color-text-muted);
          }

          .btn-remove-avatar {
            background: none;
            border: none;
            color: #b54024;
            font-size: 0.7rem;
            font-weight: 700;
            cursor: pointer;
            padding: 0.15rem 0;
            text-align: left;
            transition: opacity 0.15s ease;

            &:hover {
              opacity: 0.8;
            }
          }
        }
      }

      .danger-zone-box {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px dashed rgba(224, 122, 95, 0.3);

        .btn-delete-pet-trigger {
          width: 100%;
          background: none;
          border: 1px dashed #e07a5f;
          color: #c44e33;
          border-radius: var(--radius-pill);
          padding: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background-color: rgba(224, 122, 95, 0.08);
          }
        }

        .delete-confirmation-prompt {
          background-color: #fdf5f3;
          border: 1px solid rgba(224, 122, 95, 0.4);
          border-radius: 0.85rem;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          .delete-warn-text {
            font-size: 0.75rem;
            color: #9c361c;
            margin: 0;
            line-height: 1.35;
          }

          .delete-actions-row {
            display: flex;
            gap: 0.4rem;

            .btn-confirm-delete {
              flex: 1;
              background-color: #d95338;
              color: #ffffff;
              border: none;
              border-radius: var(--radius-pill);
              padding: 0.45rem;
              font-size: 0.75rem;
              font-weight: 700;
              cursor: pointer;
              transition: background-color 0.15s ease;

              &:hover {
                background-color: #bf3f26;
              }
            }

            .btn-cancel-delete {
              background-color: #ffffff;
              border: 1px solid rgba(45, 58, 47, 0.2);
              color: var(--color-text-main);
              border-radius: var(--radius-pill);
              padding: 0.45rem 0.85rem;
              font-size: 0.75rem;
              font-weight: 600;
              cursor: pointer;
            }
          }
        }

        .btn-delete-account-trigger {
          width: 100%;
          background: none;
          border: 1.5px dashed #e07a5f;
          color: #c44e33;
          border-radius: var(--radius-pill);
          padding: 0.6rem;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background-color: rgba(224, 122, 95, 0.12);
          }
        }

        .delete-subwarn-text {
          font-size: 0.72rem;
          color: #7b2913;
          margin: 0;
          line-height: 1.35;
        }
      }

      .user-account-modal {
        .user-account-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-info-card {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          background-color: #ffffff;
          padding: 0.85rem;
          border-radius: 1rem;
          border: 1px solid rgba(45, 58, 47, 0.08);

          .user-avatar-lg {
            width: 3.2rem;
            height: 3.2rem;
            background-color: var(--color-active);
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            font-weight: 800;
            flex-shrink: 0;
          }

          .user-details-col {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;

            .user-fullname {
              margin: 0;
              font-size: 1rem;
              font-weight: 800;
              color: var(--color-text-main);
            }

            .user-email-text {
              margin: 0;
              font-size: 0.78rem;
              color: var(--color-text-muted);
            }

            .user-status-pill {
              font-size: 0.68rem;
              font-weight: 700;
              color: #065f46;
              background-color: #d1fae5;
              padding: 0.15rem 0.5rem;
              border-radius: var(--radius-pill);
              width: fit-content;
            }
          }
        }

        .btn-account-logout {
          width: 100%;
          padding: 0.65rem;
          background: none;
          border: 1.5px solid rgba(45, 58, 47, 0.2);
          border-radius: var(--radius-pill);
          color: var(--color-text-main);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;

          &:hover {
            background-color: rgba(45, 58, 47, 0.05);
          }
        }
      }

      .btn-upload-file {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: #ffffff;
        border: 1.5px dashed var(--color-active);
        color: var(--color-active);
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.35rem 0.6rem;
        border-radius: var(--radius-pill);
        cursor: pointer;
        text-align: center;
        transition: all 0.2s ease;

        &:hover {
          background-color: var(--color-active-light);
        }
      }

      .neutered-date-box {
        margin-top: 0.4rem;
        padding: 0.6rem;
        background-color: rgba(122, 158, 126, 0.08);
        border: 1px solid rgba(122, 158, 126, 0.2);
        border-radius: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        label {
          font-size: 0.72rem;
          color: var(--color-text-main);
          font-weight: 600;
          text-transform: none;
        }

        .field-hint {
          font-size: 0.68rem;
          color: var(--color-text-muted);
        }
      }

      .stepper-row {
        display: flex;
        gap: 0.35rem;
        margin-top: 0.25rem;

        .stepper-btn {
          flex: 1;
          padding: 0.25rem 0.4rem;
          font-size: 0.72rem;
          font-weight: 700;
          background-color: rgba(45, 58, 47, 0.08);
          border: 1px solid rgba(45, 58, 47, 0.12);
          border-radius: var(--radius-pill);
          color: var(--color-text-main);
          cursor: pointer;
          transition: background-color 0.15s ease;

          &:hover {
            background-color: rgba(122, 158, 126, 0.25);
          }
        }
      }

      .quick-age-box {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-top: 0.35rem;

        .quick-age-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;

          .age-pill-btn {
            background-color: rgba(45, 58, 47, 0.07);
            border: 1px solid rgba(45, 58, 47, 0.1);
            padding: 0.2rem 0.5rem;
            border-radius: var(--radius-pill);
            font-size: 0.7rem;
            font-weight: 600;
            cursor: pointer;
            color: var(--color-text-main);
            transition: all 0.15s ease;

            &:hover {
              background-color: var(--color-active);
              color: #ffffff;
            }
          }
        }
      }

      .age-calc-badge {
        margin-top: 0.35rem;
        font-size: 0.75rem;
        background-color: var(--color-active-light);
        color: var(--color-text-main);
        padding: 0.3rem 0.65rem;
        border-radius: var(--radius-pill);
        display: inline-block;
      }

      .modal-error-alert {
        background-color: var(--color-alert-light);
        color: #9c361c;
        border: 1px solid var(--color-alert);
        border-radius: var(--radius-pill);
        padding: 0.5rem 0.75rem;
        font-size: 0.78rem;
        font-weight: 600;
        text-align: center;
      }
    }
  `]
})
export class HeaderComponent {
  private petService = inject(PetService);
  private authService = inject(AuthService);
  private router = inject(Router);

  activePet = this.petService.activePet;
  pets = this.petService.pets;
  currentUser = this.authService.currentUser;

  today = new Date().toISOString().split('T')[0];

  defaultCatAvatar = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80';
  defaultDogAvatar = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80';

  // Modals bound to PetService so other components (like Dashboard) can trigger edit
  showEditModal = this.petService.isEditModalOpen;
  isSavingEdit = signal<boolean>(false);
  confirmingDelete = signal<boolean>(false);
  isDeletingPet = signal<boolean>(false);
  editErrorMessage = signal<string>('');

  showUserModal = signal<boolean>(false);
  confirmingDeleteAccount = signal<boolean>(false);
  isDeletingAccount = signal<boolean>(false);
  deleteAccountError = signal<string>('');

  editName = '';
  editSpecies: 'CAT' | 'DOG' = 'CAT';
  editSex: 'MALE' | 'FEMALE' = 'FEMALE';
  editIsNeutered = false;
  editNeuteredDate = '';
  editWeight = 4.0;
  editBirthDate = '';
  editAvatarUrl = signal<string>('');

  showAddPetModal = this.petService.isAddModalOpen;
  isSavingPet = signal<boolean>(false);
  addErrorMessage = signal<string>('');

  newPetName = '';
  newPetSpecies: 'CAT' | 'DOG' = 'CAT';
  newPetSex: 'MALE' | 'FEMALE' = 'FEMALE';
  newPetIsNeutered = false;
  newPetNeuteredDate = '';
  newPetWeight = 4.0;
  newPetBirthDate = this.today;
  newPetAvatar = signal<string>('');

  constructor() {
    // When edit modal is opened from any place, populate the active pet values
    effect(() => {
      if (this.petService.isEditModalOpen()) {
        this.populateEditFields();
      }
    });
  }

  isCustomAvatar(url?: string): boolean {
    if (!url) return false;
    return url.startsWith('data:image/') || (!url.includes('unsplash.com') && !url.includes('cat-avatar.svg') && !url.includes('dog-avatar.svg'));
  }

  removeCustomAvatar(target: 'edit' | 'new') {
    if (target === 'edit') {
      this.editAvatarUrl.set('');
    } else {
      this.newPetAvatar.set('');
    }
  }

  handleDeletePet() {
    const pet = this.activePet();
    if (!pet) return;

    this.isDeletingPet.set(true);
    this.petService.deletePet(pet.id).subscribe({
      next: () => {
        this.isDeletingPet.set(false);
        this.confirmingDelete.set(false);
        this.closeEditModal();
      },
      error: (err) => {
        this.isDeletingPet.set(false);
        this.editErrorMessage.set(err?.error?.error || 'Error al eliminar el perfil.');
      }
    });
  }

  populateEditFields() {
    const pet = this.activePet();
    if (!pet) return;

    this.editName = pet.name;
    this.editSpecies = pet.species;
    this.editSex = pet.sex || 'FEMALE';
    this.editIsNeutered = pet.is_neutered !== undefined ? pet.is_neutered : false;
    this.editNeuteredDate = pet.neutered_date ? pet.neutered_date.split('T')[0] : '';
    this.editWeight = Number(pet.weight_kg);
    this.editBirthDate = pet.birth_date ? pet.birth_date.split('T')[0] : this.today;
    this.editAvatarUrl.set(pet.avatar_url || '');
    this.editErrorMessage.set('');
  }

  onSelectPet(petId: string) {
    this.petService.selectPet(petId);
  }

  getUserInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  onLogout() {
    this.closeUserModal();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openUserModal() {
    this.showUserModal.set(true);
    this.confirmingDeleteAccount.set(false);
    this.deleteAccountError.set('');
  }

  closeUserModal() {
    this.showUserModal.set(false);
    this.confirmingDeleteAccount.set(false);
    this.deleteAccountError.set('');
  }

  handleDeleteAccount() {
    this.isDeletingAccount.set(true);
    this.deleteAccountError.set('');

    this.authService.deleteAccount().subscribe({
      next: () => {
        this.isDeletingAccount.set(false);
        this.closeUserModal();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isDeletingAccount.set(false);
        this.deleteAccountError.set(err?.error?.error || 'Error al eliminar la cuenta');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  openEditModal() {
    this.petService.openEditModal();
  }

  closeEditModal() {
    this.petService.closeEditModal();
  }

  openAddPetModal() {
    this.newPetName = '';
    this.newPetSpecies = 'CAT';
    this.newPetWeight = 4.0;
    this.newPetBirthDate = this.today;
    this.newPetAvatar.set('');
    this.addErrorMessage.set('');
    this.petService.openAddPetModal();
  }

  closeAddModal() {
    this.petService.closeAddPetModal();
  }

  setEditSpecies(species: 'CAT' | 'DOG') {
    this.editSpecies = species;
  }

  setNewPetSpecies(species: 'CAT' | 'DOG') {
    this.newPetSpecies = species;
  }

  adjustEditWeight(delta: number) {
    const newWeight = Math.round((Number(this.editWeight || 0) + delta) * 100) / 100;
    if (newWeight >= 0.1 && newWeight <= 150) {
      this.editWeight = newWeight;
    }
  }

  adjustNewPetWeight(delta: number) {
    const newWeight = Math.round((Number(this.newPetWeight || 0) + delta) * 100) / 100;
    if (newWeight >= 0.1 && newWeight <= 150) {
      this.newPetWeight = newWeight;
    }
  }

  setEditAgeMonths(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    this.editBirthDate = d.toISOString().split('T')[0];
  }

  setAddAgeMonths(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    this.newPetBirthDate = d.toISOString().split('T')[0];
  }

  /**
   * Procesa la imagen seleccionada: la recorta en cuadrado y la redimensiona a 400x400
   * para que cargue instantáneamente y la vista previa del círculo se actualice de inmediato.
   */
  private processAndResizeImage(
    file: File,
    onSuccess: (dataUrl: string) => void,
    onError: (msg: string) => void
  ) {
    if (!file.type.startsWith('image/')) {
      onError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => onError('Error al leer el archivo de imagen.');
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => onError('No se pudo procesar la imagen seleccionada.');
      img.onload = () => {
        try {
          const maxDim = 400;
          const width = img.width;
          const height = img.height;
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          const canvas = document.createElement('canvas');
          canvas.width = Math.min(maxDim, minDim);
          canvas.height = Math.min(maxDim, minDim);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            onSuccess(e.target?.result as string);
            return;
          }

          // Recorte centrado 1:1 perfecto para avatares circulares
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, canvas.width, canvas.height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onSuccess(optimizedDataUrl);
        } catch {
          onSuccess(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onEditFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.processAndResizeImage(
        file,
        (dataUrl) => {
          this.editAvatarUrl.set(dataUrl);
          this.editErrorMessage.set('');
        },
        (errorMsg) => {
          this.editErrorMessage.set(errorMsg);
        }
      );
      input.value = '';
    }
  }

  onAddFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.processAndResizeImage(
        file,
        (dataUrl) => {
          this.newPetAvatar.set(dataUrl);
          this.addErrorMessage.set('');
        },
        (errorMsg) => {
          this.addErrorMessage.set(errorMsg);
        }
      );
      input.value = '';
    }
  }

  handleSaveEdit() {
    const pet = this.activePet();
    if (!pet) return;

    const trimmedName = this.editName ? this.editName.trim() : '';
    if (!trimmedName) {
      this.editErrorMessage.set('El nombre de la mascota es obligatorio.');
      return;
    }

    if (trimmedName.length > 50) {
      this.editErrorMessage.set('El nombre no puede superar los 50 caracteres.');
      return;
    }

    const weightNum = Number(this.editWeight);
    if (isNaN(weightNum) || weightNum <= 0.05 || weightNum > 150) {
      this.editErrorMessage.set('El peso debe ser un número válido entre 0.1 y 150 kg.');
      return;
    }

    if (!this.editBirthDate) {
      this.editErrorMessage.set('Ingresa la fecha de nacimiento.');
      return;
    }

    if (this.editBirthDate > this.today) {
      this.editErrorMessage.set('La fecha de nacimiento no puede ser en el futuro.');
      return;
    }

    this.isSavingEdit.set(true);
    this.editErrorMessage.set('');

    this.petService.updatePet(pet.id, {
      name: trimmedName,
      species: this.editSpecies,
      sex: this.editSex,
      is_neutered: this.editIsNeutered,
      neutered_date: this.editIsNeutered && this.editNeuteredDate ? this.editNeuteredDate : undefined,
      weight_kg: Math.round(weightNum * 100) / 100,
      birth_date: this.editBirthDate,
      avatar_url: this.editAvatarUrl()
    }).subscribe({
      next: () => {
        this.isSavingEdit.set(false);
        this.closeEditModal();
      },
      error: (err) => {
        this.isSavingEdit.set(false);
        this.editErrorMessage.set(err.error?.error || 'Error al guardar los cambios en la mascota.');
      }
    });
  }

  handleAddPet() {
    const trimmedName = this.newPetName ? this.newPetName.trim() : '';
    if (!trimmedName) {
      this.addErrorMessage.set('El nombre es obligatorio.');
      return;
    }

    if (trimmedName.length > 50) {
      this.addErrorMessage.set('El nombre no puede superar los 50 caracteres.');
      return;
    }

    const weightNum = Number(this.newPetWeight);
    if (isNaN(weightNum) || weightNum <= 0.05 || weightNum > 150) {
      this.addErrorMessage.set('El peso debe ser un número válido entre 0.1 y 150 kg.');
      return;
    }

    if (this.newPetBirthDate && this.newPetBirthDate > this.today) {
      this.addErrorMessage.set('La fecha de nacimiento no puede ser futura.');
      return;
    }

    this.isSavingPet.set(true);
    this.addErrorMessage.set('');

    this.petService.addPet({
      name: trimmedName,
      species: this.newPetSpecies,
      sex: this.newPetSex,
      is_neutered: this.newPetIsNeutered,
      neutered_date: this.newPetIsNeutered && this.newPetNeuteredDate ? this.newPetNeuteredDate : undefined,
      weight_kg: Math.round(weightNum * 100) / 100,
      birth_date: this.newPetBirthDate || this.today,
      avatar_url: this.newPetAvatar() || (this.newPetSpecies === 'CAT' ? this.defaultCatAvatar : this.defaultDogAvatar)
    }).subscribe({
      next: () => {
        this.isSavingPet.set(false);
        this.closeAddModal();
        this.newPetName = '';
      },
      error: (err) => {
        this.isSavingPet.set(false);
        this.addErrorMessage.set(err.error?.error || 'Error al crear mascota.');
      }
    });
  }

  getAge(birthDate?: string): string {
    if (!birthDate) return '1 año';
    const birth = new Date(birthDate.split('T')[0]);
    const now = new Date();
    
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) months--;

    if (months < 0) return 'Recién nacido';
    if (months < 1) return '< 1 mes';
    if (months < 12) return `${months} meses`;

    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    if (remMonths === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
    return `${years}a ${remMonths}m`;
  }
}
