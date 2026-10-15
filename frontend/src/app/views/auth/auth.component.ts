import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PetService } from '../../services/pet.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-view">
      
      <!-- Logo & Branding -->
      <div class="auth-brand">
        <div class="brand-icon-wrap">
          <span class="brand-paw">🐾</span>
        </div>
        <h1 class="brand-title">Cuidado Preventivo</h1>
        <p class="brand-subtitle">Bienestar y salud temprana para tu mascota</p>
      </div>

      <!-- Auth Switcher (Tabs) -->
      <div class="auth-tabs">
        <button 
          type="button" 
          class="auth-tab-btn" 
          [class.auth-tab-btn--active]="activeMode() === 'login'"
          (click)="switchMode('login')">
          Iniciar Sesión
        </button>
        <button 
          type="button" 
          class="auth-tab-btn" 
          [class.auth-tab-btn--active]="activeMode() === 'register'"
          (click)="switchMode('register')">
          Crear Cuenta
        </button>
      </div>

      <!-- Error Alert -->
      @if (errorMessage()) {
        <div class="card card--alert">
          <div class="alert-content">
            <span class="alert-icon">⚠️</span>
            <p>{{ errorMessage() }}</p>
          </div>
        </div>
      }

      <!-- Success Alert -->
      @if (successMessage()) {
        <div class="card card--success">
          <div class="alert-content">
            <span class="alert-icon">✅</span>
            <p>{{ successMessage() }}</p>
          </div>
        </div>
      }

      <!-- Formulario Iniciar Sesión (Login) -->
      @if (activeMode() === 'login') {
        <section class="card auth-card">
          <form (ngSubmit)="handleLogin()">
            <div class="form-group">
              <label for="loginEmail">Correo Electrónico</label>
              <input 
                id="loginEmail" 
                type="email" 
                class="form-input" 
                placeholder="ej: amparo@mascotas.care"
                [(ngModel)]="loginEmail" 
                name="loginEmail" 
                required />
            </div>

            <div class="form-group">
              <label for="loginPassword">Contraseña</label>
              <input 
                id="loginPassword" 
                type="password" 
                class="form-input" 
                placeholder="••••••••"
                [(ngModel)]="loginPassword" 
                name="loginPassword" 
                required />
            </div>

            <button 
              type="submit" 
              class="btn-primary-action submit-btn"
              [disabled]="isLoading()">
              @if (isLoading()) {
                Iniciando sesión...
              } @else {
                Entrar a mi Cuenta →
              }
            </button>
          </form>

          <!-- Botón de Acceso Rápido Demo -->
          <div class="demo-quick-box">
            <span class="demo-label">¿Quieres probar rápido?</span>
            <button type="button" class="btn-pill demo-btn" (click)="fillDemoCredentials()">
              🔑 Usar Cuenta Demo (Amparo)
            </button>
          </div>
        </section>
      }

      <!-- Formulario Crear Cuenta (Register) -->
      @if (activeMode() === 'register') {
        <section class="card auth-card">
          <form (ngSubmit)="handleRegister()">
            <div class="form-group">
              <label for="regName">Nombre Completo</label>
              <input 
                id="regName" 
                type="text" 
                class="form-input" 
                placeholder="ej: Laura Gómez"
                [(ngModel)]="registerName" 
                name="registerName" 
                required />
            </div>

            <div class="form-group">
              <label for="regEmail">Correo Electrónico</label>
              <input 
                id="regEmail" 
                type="email" 
                class="form-input" 
                placeholder="ej: laura@ejemplo.com"
                [(ngModel)]="registerEmail" 
                name="registerEmail" 
                required />
            </div>

            <div class="form-group">
              <label for="regPassword">Contraseña (Mínimo 6 caracteres)</label>
              <input 
                id="regPassword" 
                type="password" 
                class="form-input" 
                placeholder="Al menos 6 caracteres"
                [(ngModel)]="registerPassword" 
                name="registerPassword" 
                minlength="6"
                required />
            </div>

            <!-- Datos de Primera Mascota (Onboarding amigable) -->
            <div class="onboarding-pet-box">
              <span class="onboarding-title">🐾 Primera Mascota (Opcional):</span>
              <div class="pet-inputs-row">
                <input 
                  type="text" 
                  class="form-input" 
                  placeholder="Nombre (ej: Rocky)"
                  [(ngModel)]="petName" 
                  name="petName" />
                <select class="form-input species-select" [(ngModel)]="petSpecies" name="petSpecies">
                  <option value="CAT">Gato 🐱</option>
                  <option value="DOG">Perro 🐶</option>
                </select>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0.1" 
                  max="150" 
                  class="form-input weight-input" 
                  placeholder="Peso kg"
                  title="Peso en kg"
                  [(ngModel)]="petWeight" 
                  name="petWeight" />
              </div>
            </div>

            <button 
              type="submit" 
              class="btn-primary-action submit-btn"
              [disabled]="isLoading()">
              @if (isLoading()) {
                Creando cuenta...
              } @else {
                Crear Cuenta y Comenzar 🎉
              }
            </button>
          </form>
        </section>
      }

      <!-- Privacy & Assurance Footer -->
      <footer class="auth-footer">
        <p>🔒 Datos protegidos en base de datos relacional PostgreSQL con autenticación JWT segura.</p>
      </footer>

    </div>
  `,
  styles: [`
    .auth-view {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;
    }

    .auth-brand {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;

      .brand-icon-wrap {
        width: 4.5rem;
        height: 4.5rem;
        background-color: var(--color-card-bg);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0.5rem 1.5rem rgba(45, 58, 47, 0.15);
        border: 2px solid #ffffff;
        margin-bottom: 0.5rem;

        .brand-paw {
          font-size: 2.2rem;
        }
      }

      .brand-title {
        font-size: 1.6rem;
        font-weight: 800;
        margin: 0;
        color: var(--color-text-main);
      }

      .brand-subtitle {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        margin-top: 0.2rem;
      }
    }

    .auth-tabs {
      display: flex;
      background-color: rgba(45, 58, 47, 0.08);
      border-radius: var(--radius-pill);
      padding: 0.25rem;
      gap: 0.25rem;

      .auth-tab-btn {
        flex: 1;
        padding: 0.6rem 0;
        background: none;
        border: none;
        border-radius: var(--radius-pill);
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all 0.2s ease;

        &--active {
          background-color: var(--color-card-bg);
          color: var(--color-text-main);
          box-shadow: 0 0.25rem 0.75rem rgba(45, 58, 47, 0.1);
        }
      }
    }

    .card--alert {
      background-color: var(--color-alert-light);
      border: 1.5px solid var(--color-alert);
      padding: 0.75rem 1rem;
      margin-bottom: 0;

      .alert-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        p {
          font-size: 0.85rem;
          font-weight: 600;
          color: #9c361c;
          margin: 0;
        }
      }
    }

    .card--success {
      background-color: #d1fae5;
      border: 1.5px solid #10b981;
      padding: 0.75rem 1rem;
      margin-bottom: 0;

      .alert-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        p {
          font-size: 0.85rem;
          font-weight: 600;
          color: #065f46;
          margin: 0;
        }
      }
    }

    .auth-card {
      padding: 1.5rem 1.25rem;

      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      label {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--color-text-main);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
    }

    .submit-btn {
      margin-top: 0.5rem;
      padding: 0.85rem;
    }

    .demo-quick-box {
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(45, 58, 47, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .demo-label {
        font-size: 0.75rem;
        color: var(--color-text-muted);
        font-weight: 600;
      }

      .demo-btn {
        width: 100%;
        font-size: 0.825rem;
        background-color: #ffffff;
        border: 1.5px solid var(--color-active);
        color: var(--color-active);
        font-weight: 700;

        &:hover {
          background-color: var(--color-active-light);
        }
      }
    }

    .onboarding-pet-box {
      background-color: #ffffff;
      padding: 0.75rem;
      border-radius: 1rem;
      border: 1px solid rgba(45, 58, 47, 0.1);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .onboarding-title {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--color-active);
      }

      .pet-inputs-row {
        display: flex;
        gap: 0.5rem;

        .species-select {
          width: 6.5rem;
          padding: 0.5rem;
        }

        .weight-input {
          width: 5.5rem;
          padding: 0.5rem;
        }
      }
    }

    .auth-footer {
      text-align: center;
      padding: 0 1rem;

      p {
        font-size: 0.72rem;
        color: var(--color-text-muted);
        line-height: 1.35;
      }
    }
  `]
})
export class AuthComponent {
  private authService = inject(AuthService);
  private petService = inject(PetService);
  private router = inject(Router);

  activeMode = signal<'login' | 'register'>('login');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Form Fields
  loginEmail = '';
  loginPassword = '';

  registerName = '';
  registerEmail = '';
  registerPassword = '';
  petName = '';
  petSpecies: 'CAT' | 'DOG' = 'CAT';
  petWeight = 4.0;

  switchMode(mode: 'login' | 'register') {
    this.activeMode.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  fillDemoCredentials() {
    this.loginEmail = 'demo@mascotas.care';
    this.loginPassword = 'demo123';
    this.errorMessage.set('');
  }

  handleLogin() {
    const trimmedEmail = this.loginEmail ? this.loginEmail.trim() : '';
    if (!trimmedEmail || !this.loginPassword) {
      this.errorMessage.set('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      this.errorMessage.set('El formato del correo electrónico no es válido (ej: nombre@correo.com).');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(trimmedEmail, this.loginPassword).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(`¡Bienvenido/a de nuevo, ${res.user.name}!`);
        this.petService.refreshAll();
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 800);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al iniciar sesión. Revisa tus credenciales.');
      }
    });
  }

  handleRegister() {
    const trimmedName = this.registerName ? this.registerName.trim() : '';
    const trimmedEmail = this.registerEmail ? this.registerEmail.trim() : '';

    if (!trimmedName || !trimmedEmail || !this.registerPassword) {
      this.errorMessage.set('Completa tu nombre, correo y contraseña.');
      return;
    }

    if (trimmedName.length < 2) {
      this.errorMessage.set('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      this.errorMessage.set('Ingresa un correo electrónico válido (ejemplo: usuario@correo.com).');
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    let validatedWeight: number | undefined = undefined;
    if (this.petName && this.petName.trim()) {
      const w = Number(this.petWeight);
      if (isNaN(w) || w <= 0.05 || w > 150) {
        this.errorMessage.set('El peso de la mascota debe ser un valor válido entre 0.1 y 150 kg.');
        return;
      }
      validatedWeight = Math.round(w * 100) / 100;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(
      trimmedName,
      trimmedEmail,
      this.registerPassword,
      this.petName ? this.petName.trim() : undefined,
      this.petSpecies,
      validatedWeight
    ).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('¡Cuenta creada con éxito! Redirigiendo...');

        this.petService.refreshAll();
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 900);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al registrar cuenta. Intenta con otro correo.');
      }
    });
  }
}
