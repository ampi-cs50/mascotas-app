import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService, EmailValidationResponse } from '../../services/auth.service';
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
        @if (pendingEmail()) {
          <button 
            type="button" 
            class="auth-tab-btn auth-tab-btn--verify" 
            [class.auth-tab-btn--active]="activeMode() === 'verify'"
            (click)="switchMode('verify')">
            ✉️ Confirmar Correo
          </button>
        }
        @if (activeMode() === 'forgot' || activeMode() === 'reset') {
          <button 
            type="button" 
            class="auth-tab-btn auth-tab-btn--reset" 
            [class.auth-tab-btn--active]="true">
            🔐 Recuperación
          </button>
        }
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

      <!-- ========================================================= -->
      <!-- 1. Formulario Iniciar Sesión (Login)                       -->
      <!-- ========================================================= -->
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
              <div class="label-row">
                <label for="loginPassword">Contraseña</label>
                <button type="button" class="btn-text-link" (click)="openForgotPassword()">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
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

      <!-- ========================================================= -->
      <!-- 2. Formulario Crear Cuenta (Register con validación MX)    -->
      <!-- ========================================================= -->
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
              <div class="label-row">
                <label for="regEmail">Correo Electrónico</label>
                @if (isCheckingEmail()) {
                  <span class="checking-badge">🔍 Validando sintaxis y registros MX...</span>
                }
              </div>

              <input 
                id="regEmail" 
                type="email" 
                class="form-input" 
                [class.form-input--valid]="emailValidationStatus() === 'valid'"
                [class.form-input--invalid]="emailValidationStatus() === 'invalid'"
                placeholder="ej: laura@gmail.com"
                [(ngModel)]="registerEmail" 
                (ngModelChange)="onEmailInputChange($event)"
                (blur)="validateEmailNow()"
                name="registerEmail" 
                required />

              <!-- Feedback interactivo de validación de correo -->
              @if (emailValidationStatus() === 'valid') {
                <div class="email-feedback email-feedback--success">
                  <span class="icon">✅</span>
                  <span>Dominio con servidores de correo activos (registros MX verificados).</span>
                </div>
              }

              @if (emailValidationStatus() === 'invalid') {
                <div class="email-feedback email-feedback--error">
                  <span class="icon">❌</span>
                  <span>{{ emailValidationMessage() }}</span>
                </div>
              }

              <!-- Sugerencia si se detectó un posible error tipográfico (ej: gmial.com -> gmail.com) -->
              @if (emailSuggestion()) {
                <div class="email-suggestion-box">
                  <span class="icon">💡</span>
                  <span>¿Quisiste escribir <strong>{{ emailSuggestion() }}</strong>?</span>
                  <button type="button" class="btn-suggestion" (click)="applyEmailSuggestion()">
                    Corregir
                  </button>
                </div>
              }
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
              [disabled]="isLoading() || isCheckingEmail()">
              @if (isLoading()) {
                Registrando y enviando código...
              } @else {
                Continuar y Enviar Código por Correo →
              }
            </button>
          </form>
        </section>
      }

      <!-- ========================================================= -->
      <!-- 3. Formulario Confirmación de Correo (Código obligatorio)  -->
      <!-- ========================================================= -->
      @if (activeMode() === 'verify') {
        <section class="card auth-card verify-card">
          <div class="verify-header">
            <div class="verify-icon-wrap">
              <span class="verify-icon">✉️</span>
            </div>
            <h2 class="verify-title">Confirma tu Correo</h2>
            <p class="verify-desc">
              Hemos enviado un código obligatorio de confirmación y un enlace directo a:
            </p>
            <div class="verify-email-pill">
              <strong>{{ pendingEmail() }}</strong>
            </div>
          </div>

          <form (ngSubmit)="handleVerifyCode()" class="verify-form">
            <div class="form-group">
              <label for="verifyCode" class="text-center">Ingresa el Código de 6 Dígitos</label>
              <input 
                id="verifyCode" 
                type="text" 
                maxlength="6"
                pattern="[0-9]*"
                class="form-input code-input" 
                placeholder="123456"
                [(ngModel)]="verificationCode" 
                name="verificationCode" 
                autofocus
                required />
              <span class="code-hint">El código vence en 15 minutos</span>
            </div>

            <button 
              type="submit" 
              class="btn-primary-action submit-btn"
              [disabled]="isLoading() || !verificationCode || verificationCode.trim().length < 6">
              @if (isLoading()) {
                Verificando código...
              } @else {
                Confirmar y Activar Cuenta 🎉
              }
            </button>
          </form>

          <div class="resend-box">
            <p class="resend-text">¿No recibiste el correo o se venció el código?</p>
            <button 
              type="button" 
              class="btn-resend" 
              [disabled]="resendCooldown() > 0 || isLoading()"
              (click)="handleResendCode()">
              @if (resendCooldown() > 0) {
                Reenviar en {{ resendCooldown() }}s
              } @else {
                🔄 Reenviar Código de Confirmación
              }
            </button>
          </div>

          <div class="back-box">
            <button type="button" class="btn-link" (click)="switchMode('register')">
              ← Corregir datos o registrar otro correo
            </button>
          </div>
        </section>
      }

      <!-- ========================================================= -->
      <!-- 4. Formulario Olvidé mi Contraseña (Forgot Password)      -->
      <!-- ========================================================= -->
      @if (activeMode() === 'forgot') {
        <section class="card auth-card forgot-card">
          <div class="verify-header">
            <div class="verify-icon-wrap forgot-icon-wrap">
              <span class="verify-icon">🔐</span>
            </div>
            <h2 class="verify-title">Recuperar Contraseña</h2>
            <p class="verify-desc">
              Ingresa el correo de tu cuenta. Te enviaremos un código de 6 dígitos y un enlace para restablecerla de forma segura.
            </p>
          </div>

          <form (ngSubmit)="handleForgotPassword()">
            <div class="form-group">
              <label for="forgotEmail">Correo Electrónico Registrado</label>
              <input 
                id="forgotEmail" 
                type="email" 
                class="form-input" 
                placeholder="ej: amparo@mascotas.care"
                [(ngModel)]="forgotEmail" 
                name="forgotEmail" 
                required />
            </div>

            <button 
              type="submit" 
              class="btn-primary-action submit-btn"
              [disabled]="isLoading() || !forgotEmail || !forgotEmail.includes('@')">
              @if (isLoading()) {
                Enviando correo de recuperación...
              } @else {
                Enviar Código de Recuperación →
              }
            </button>
          </form>

          <div class="forgot-footer-actions">
            <button type="button" class="btn-link" (click)="switchMode('login')">
              ← Volver a Iniciar Sesión
            </button>
            <span class="sep">•</span>
            <button type="button" class="btn-link" (click)="goToResetWithExistingCode()">
              Ya tengo mi código de 6 dígitos →
            </button>
          </div>
        </section>
      }

      <!-- ========================================================= -->
      <!-- 5. Formulario Nueva Contraseña (Reset Password)            -->
      <!-- ========================================================= -->
      @if (activeMode() === 'reset') {
        <section class="card auth-card reset-card">
          <div class="verify-header">
            <div class="verify-icon-wrap reset-icon-wrap">
              <span class="verify-icon">🔑</span>
            </div>
            <h2 class="verify-title">Nueva Contraseña</h2>
            <p class="verify-desc">
              @if (isDirectTokenReset()) {
                Ingresa y confirma tu nueva contraseña para actualizar el acceso a tu cuenta.
              } @else {
                Ingresa el código de 6 dígitos que enviamos a tu correo y define tu nueva contraseña.
              }
            </p>
            @if (resetEmail || forgotEmail) {
              <div class="verify-email-pill">
                <strong>{{ resetEmail || forgotEmail }}</strong>
              </div>
            }
          </div>

          <form (ngSubmit)="handleResetPassword()">
            @if (!isDirectTokenReset()) {
              @if (!resetEmail && !forgotEmail) {
                <div class="form-group">
                  <label for="resetEmailInput">Correo Electrónico</label>
                  <input 
                    id="resetEmailInput" 
                    type="email" 
                    class="form-input" 
                    placeholder="ej: amparo@mascotas.care"
                    [(ngModel)]="resetEmail" 
                    name="resetEmailInput" 
                    required />
                </div>
              }

              <div class="form-group">
                <label for="resetCodeInput" class="text-center">Código de Recuperación de 6 Dígitos</label>
                <input 
                  id="resetCodeInput" 
                  type="text" 
                  maxlength="6"
                  pattern="[0-9]*"
                  class="form-input code-input" 
                  placeholder="123456"
                  [(ngModel)]="resetCode" 
                  name="resetCodeInput" 
                  autofocus
                  required />
                <span class="code-hint">Validez de 15 minutos desde su emisión</span>
              </div>
            }

            <div class="form-group">
              <label for="resetPassword">Nueva Contraseña (Mínimo 6 caracteres)</label>
              <input 
                id="resetPassword" 
                type="password" 
                class="form-input" 
                placeholder="Al menos 6 caracteres"
                [(ngModel)]="resetNewPassword" 
                name="resetNewPassword" 
                minlength="6"
                required />
            </div>

            <div class="form-group">
              <label for="resetPasswordConfirm">Confirmar Nueva Contraseña</label>
              <input 
                id="resetPasswordConfirm" 
                type="password" 
                class="form-input" 
                placeholder="Repite la nueva contraseña"
                [(ngModel)]="resetNewPasswordConfirm" 
                name="resetNewPasswordConfirm" 
                minlength="6"
                required />
            </div>

            <button 
              type="submit" 
              class="btn-primary-action submit-btn"
              [disabled]="isLoading() || (!isDirectTokenReset() && (!resetCode || resetCode.trim().length < 6)) || !resetNewPassword || resetNewPassword.length < 6">
              @if (isLoading()) {
                Actualizando contraseña...
              } @else {
                Guardar Nueva Contraseña 🎉
              }
            </button>
          </form>

          <div class="forgot-footer-actions">
            <button type="button" class="btn-link" (click)="switchMode('forgot')">
              ← Solicitar otro código
            </button>
            <span class="sep">•</span>
            <button type="button" class="btn-link" (click)="switchMode('login')">
              Volver a Iniciar Sesión
            </button>
          </div>
        </section>
      }

      <!-- Privacy & Assurance Footer -->
      <footer class="auth-footer">
        <p>🔒 Seguridad de cuentas: Validación de sintaxis RFC 5322, comprobación DNS de registros MX y confirmación obligatoria por correo.</p>
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
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all 0.2s ease;

        &--active {
          background-color: var(--color-card-bg);
          color: var(--color-text-main);
          box-shadow: 0 0.25rem 0.75rem rgba(45, 58, 47, 0.1);
        }

        &--verify {
          color: #2d6a4f;
          font-weight: 800;
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

      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      label {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--color-text-main);
        text-transform: uppercase;
        letter-spacing: 0.03em;

        &.text-center {
          text-align: center;
        }
      }

      .checking-badge {
        font-size: 0.72rem;
        font-weight: 600;
        color: #2d6a4f;
      }
    }

    .form-input {
      &--valid {
        border-color: #10b981 !important;
        background-color: #f0fdf4 !important;
      }

      &--invalid {
        border-color: #ef4444 !important;
        background-color: #fef2f2 !important;
      }
    }

    .email-feedback {
      font-size: 0.78rem;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;

      &--success {
        color: #065f46;
        background-color: #d1fae5;
      }

      &--error {
        color: #991b1b;
        background-color: #fee2e2;
      }
    }

    .email-suggestion-box {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 0.4rem 0.6rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      color: #92400e;

      .btn-suggestion {
        margin-left: auto;
        background-color: #d97706;
        color: #ffffff;
        border: none;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        cursor: pointer;
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

    /* Estilos específicos para la vista de Confirmación de Correo */
    .verify-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .verify-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;

      .verify-icon-wrap {
        width: 3.5rem;
        height: 3.5rem;
        background: #e8f5e9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.25rem;

        .verify-icon {
          font-size: 1.8rem;
        }
      }

      .verify-title {
        font-size: 1.3rem;
        font-weight: 800;
        margin: 0;
        color: var(--color-text-main);
      }

      .verify-desc {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        margin: 0;
      }

      .verify-email-pill {
        display: inline-block;
        background-color: rgba(45, 106, 79, 0.12);
        color: #2d6a4f;
        padding: 0.3rem 0.85rem;
        border-radius: var(--radius-pill);
        font-size: 0.88rem;
        margin-top: 0.25rem;
      }
    }

    .code-input {
      font-family: 'Courier New', Courier, monospace;
      font-size: 1.8rem;
      font-weight: 800;
      text-align: center;
      letter-spacing: 0.5rem;
      padding: 0.75rem;
      color: #1b4332;
    }

    .code-hint {
      text-align: center;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.2rem;
    }

    .resend-box {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      border-top: 1px solid rgba(45, 58, 47, 0.1);
      padding-top: 0.75rem;

      .resend-text {
        font-size: 0.78rem;
        color: var(--color-text-muted);
        margin: 0;
      }

      .btn-resend {
        background: none;
        border: none;
        color: #2d6a4f;
        font-weight: 700;
        font-size: 0.82rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;

        &:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }
      }
    }

    .btn-text-link {
      background: none;
      border: none;
      color: #2d6a4f;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;

      &:hover {
        color: #1b4332;
      }
    }

    .forgot-icon-wrap {
      background: #fef3c7 !important;
      .verify-icon {
        color: #b45309;
      }
    }

    .reset-icon-wrap {
      background: #e0f2fe !important;
      .verify-icon {
        color: #0284c7;
      }
    }

    .forgot-footer-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 1rem;
      border-top: 1px solid rgba(45, 58, 47, 0.1);
      padding-top: 0.75rem;

      .sep {
        color: var(--color-text-muted);
        font-size: 0.8rem;
      }
    }

    .back-box {
      text-align: center;

      .btn-link {
        background: none;
        border: none;
        color: var(--color-text-muted);
        font-size: 0.8rem;
        cursor: pointer;
        text-decoration: underline;

        &:hover {
          color: var(--color-text-main);
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
export class AuthComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private petService = inject(PetService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeMode = signal<'login' | 'register' | 'verify' | 'forgot' | 'reset'>('login');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Estados de validación en tiempo real para el correo
  emailValidationStatus = signal<'idle' | 'valid' | 'invalid'>('idle');
  emailValidationMessage = signal<string>('');
  emailSuggestion = signal<string>('');
  isCheckingEmail = signal<boolean>(false);

  // Estado de confirmación de cuenta
  pendingEmail = signal<string>('');
  verificationCode = '';
  resendCooldown = signal<number>(0);
  private cooldownInterval: any = null;

  // Form Fields - Login & Register
  loginEmail = '';
  loginPassword = '';

  registerName = '';
  registerEmail = '';
  registerPassword = '';
  petName = '';
  petSpecies: 'CAT' | 'DOG' = 'CAT';
  petWeight = 4.0;

  // Form Fields - Forgot & Reset Password
  forgotEmail = '';
  resetEmail = '';
  resetCode = '';
  resetToken = '';
  resetNewPassword = '';
  resetNewPasswordConfirm = '';
  isDirectTokenReset = signal<boolean>(false);

  private emailInputSubject = new Subject<string>();
  private emailSub: Subscription | null = null;
  private querySub: Subscription | null = null;

  ngOnInit() {
    // Escuchar cambios en el input de email con debounce para validación MX proactiva
    this.emailSub = this.emailInputSubject.pipe(
      debounceTime(600),
      distinctUntilChanged()
    ).subscribe(email => {
      this.performEmailValidation(email);
    });

    // Detectar enlaces por queryParams (confirmación o restablecimiento de contraseña)
    this.querySub = this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const email = params['email'];
      const resetToken = params['reset_token'];

      if (resetToken) {
        this.resetToken = resetToken;
        if (email) {
          this.resetEmail = email;
          this.forgotEmail = email;
        }
        this.isDirectTokenReset.set(true);
        this.activeMode.set('reset');
        this.successMessage.set('Enlace verificado. Por favor ingresa tu nueva contraseña.');
      } else if (token) {
        if (email) {
          this.pendingEmail.set(email);
        }
        this.verifyWithToken(token);
      }
    });
  }

  ngOnDestroy() {
    this.emailSub?.unsubscribe();
    this.querySub?.unsubscribe();
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  switchMode(mode: 'login' | 'register' | 'verify' | 'forgot' | 'reset') {
    this.activeMode.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  openForgotPassword() {
    if (this.loginEmail && this.loginEmail.trim()) {
      this.forgotEmail = this.loginEmail.trim();
    }
    this.switchMode('forgot');
  }

  goToResetWithExistingCode() {
    if (this.forgotEmail && this.forgotEmail.trim()) {
      this.resetEmail = this.forgotEmail.trim();
    }
    this.isDirectTokenReset.set(false);
    this.switchMode('reset');
  }

  fillDemoCredentials() {
    this.loginEmail = 'demo@mascotas.care';
    this.loginPassword = 'demo123';
    this.errorMessage.set('');
  }

  onEmailInputChange(val: string) {
    if (!val || val.trim().length === 0) {
      this.emailValidationStatus.set('idle');
      this.emailValidationMessage.set('');
      this.emailSuggestion.set('');
      return;
    }
    this.emailInputSubject.next(val.trim());
  }

  validateEmailNow() {
    if (this.registerEmail && this.registerEmail.trim().length > 0) {
      this.performEmailValidation(this.registerEmail.trim());
    }
  }

  private performEmailValidation(email: string) {
    if (!email || !email.includes('@')) {
      return;
    }

    this.isCheckingEmail.set(true);
    this.authService.validateEmail(email).subscribe({
      next: (res: EmailValidationResponse) => {
        this.isCheckingEmail.set(false);
        if (res.valid) {
          if (res.isTaken) {
            this.emailValidationStatus.set('invalid');
            this.emailValidationMessage.set('Ya existe una cuenta activa con este correo. Inicia sesión en su lugar.');
          } else {
            this.emailValidationStatus.set('valid');
            this.emailValidationMessage.set('');
          }
        } else {
          this.emailValidationStatus.set('invalid');
          this.emailValidationMessage.set(res.error || 'Correo no válido');
        }

        if (res.suggestion) {
          this.emailSuggestion.set(res.suggestion);
        } else {
          this.emailSuggestion.set('');
        }
      },
      error: () => {
        this.isCheckingEmail.set(false);
      }
    });
  }

  applyEmailSuggestion() {
    const sug = this.emailSuggestion();
    if (sug) {
      this.registerEmail = sug;
      this.emailSuggestion.set('');
      this.performEmailValidation(sug);
    }
  }

  handleLogin() {
    const trimmedEmail = this.loginEmail ? this.loginEmail.trim() : '';
    if (!trimmedEmail || !this.loginPassword) {
      this.errorMessage.set('Por favor, ingresa tu correo y contraseña.');
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
        // Si la cuenta requiere confirmación obligatoria, redirigir a la pantalla de verificación
        if (err.status === 403 && err.error?.requiresVerification) {
          this.pendingEmail.set(err.error.email || trimmedEmail);
          this.activeMode.set('verify');
          this.errorMessage.set(err.error.error || 'Tu cuenta requiere confirmación obligatoria antes de ingresar.');
          return;
        }

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
        this.pendingEmail.set(res.email || trimmedEmail);

        this.activeMode.set('verify');
        this.successMessage.set(res.message || 'Código enviado. Por favor confirma tu correo electrónico.');
        this.startResendCooldown(30);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al registrar cuenta. Verifica el correo ingresado.');
        if (err.error?.suggestion) {
          this.emailSuggestion.set(err.error.suggestion);
        }
      }
    });
  }

  handleVerifyCode() {
    const email = this.pendingEmail();
    const code = this.verificationCode ? this.verificationCode.trim() : '';

    if (!email) {
      this.errorMessage.set('No se encontró el correo a verificar. Vuelve a iniciar el registro.');
      return;
    }

    if (!code || code.length < 6) {
      this.errorMessage.set('Ingresa el código completo de 6 dígitos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.verifyCode(email, code).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('¡Cuenta confirmada y activada exitosamente! Redirigiendo...');
        this.petService.refreshAll();
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 900);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'El código ingresado es incorrecto o ha expirado.');
      }
    });
  }

  verifyWithToken(token: string) {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.verifyToken(token).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('¡Correo verificado con éxito mediante el enlace! Redirigiendo a tu cuenta...');
        this.petService.refreshAll();
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'El enlace de confirmación ha expirado o es inválido.');
        this.activeMode.set('verify');
      }
    });
  }

  handleResendCode() {
    const email = this.pendingEmail();
    if (!email) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.resendCode(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('Se ha enviado un nuevo código de 6 dígitos a tu correo.');
        this.startResendCooldown(30);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'No se pudo reenviar el código. Intenta de nuevo más tarde.');
      }
    });
  }

  handleForgotPassword() {
    const trimmedEmail = this.forgotEmail ? this.forgotEmail.trim() : '';
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      this.errorMessage.set('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.forgotPassword(trimmedEmail).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.resetEmail = res.email || trimmedEmail;
        this.isDirectTokenReset.set(false);
        this.activeMode.set('reset');
        this.successMessage.set(res.message || 'Se ha enviado un código de recuperación a tu correo electrónico.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'No se pudo enviar el correo de recuperación. Revisa la dirección ingresada.');
      }
    });
  }

  handleResetPassword() {
    const email = this.resetEmail || this.forgotEmail;
    const code = this.resetCode ? this.resetCode.trim() : '';
    const newPass = this.resetNewPassword;
    const confirmPass = this.resetNewPasswordConfirm;

    if (!newPass || newPass.length < 6) {
      this.errorMessage.set('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPass !== confirmPass) {
      this.errorMessage.set('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    if (!this.isDirectTokenReset() && (!code || code.length < 6)) {
      this.errorMessage.set('Por favor ingresa el código completo de 6 dígitos enviado a tu correo.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.resetPassword({
      email: email ? email.trim() : undefined,
      code: !this.isDirectTokenReset() ? code : undefined,
      token: this.isDirectTokenReset() ? this.resetToken : undefined,
      newPassword: newPass
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message || '¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión.');
        this.loginEmail = email || '';
        this.loginPassword = '';
        this.resetCode = '';
        this.resetToken = '';
        this.resetNewPassword = '';
        this.resetNewPasswordConfirm = '';
        this.isDirectTokenReset.set(false);
        this.activeMode.set('login');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al restablecer la contraseña. El código o enlace puede ser inválido o haber expirado.');
      }
    });
  }

  private startResendCooldown(seconds: number) {
    this.resendCooldown.set(seconds);
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        clearInterval(this.cooldownInterval);
        this.resendCooldown.set(0);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }
}
