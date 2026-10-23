import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-nav">
      <a 
        routerLink="/dashboard" 
        routerLinkActive="active" 
        [routerLinkActiveOptions]="{exact: true}"
        class="nav-tab">
        <div class="nav-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span class="nav-text">Inicio</span>
      </a>

      <a 
        routerLink="/check-in" 
        routerLinkActive="active" 
        class="nav-tab">
        <div class="nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <span class="nav-text">Bitácora</span>
      </a>

      <a 
        routerLink="/vaccines" 
        routerLinkActive="active" 
        class="nav-tab"
        title="Cartilla y Chequeo de Vacunas">
        <div class="nav-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 3l2 2-9 9-2-2 9-9z"></path>
            <path d="M13 5l2 2"></path>
            <path d="M5 15l-2 6 6-2 9-9-4-4-9 9z"></path>
            <path d="M3 21l3-3"></path>
          </svg>
        </div>
        <span class="nav-text">Vacunas</span>
      </a>

      <a 
        routerLink="/pain-assessment" 
        routerLinkActive="active" 
        class="nav-tab nav-tab--special"
        title="Evaluador de Dolor Facial">
        <div class="nav-icon nav-icon--circle">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </div>
        <span class="nav-text">Escala</span>
      </a>

      <a 
        routerLink="/toxicity" 
        routerLinkActive="active" 
        class="nav-tab">
        <div class="nav-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <span class="nav-text">Prevención</span>
      </a>

      <a 
        routerLink="/insights" 
        routerLinkActive="active" 
        class="nav-tab">
        <div class="nav-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <span class="nav-text">Tendencias</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: relative;
      width: 100%;
      height: 4.5rem;
      flex-shrink: 0;
      background-color: var(--color-card-bg);
      border-top: 1px solid rgba(45, 58, 47, 0.08);
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0 0.5rem;
      box-shadow: 0 -0.25rem 1.25rem rgba(45, 58, 47, 0.08);
      z-index: 50;
    }

    .nav-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      text-decoration: none;
      color: var(--color-text-muted);
      flex: 1;
      height: 100%;
      transition: color 0.2s ease, transform 0.2s ease;

      .nav-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      }

      .nav-text {
        font-size: 0.72rem;
        font-weight: 600;
      }

      &.active {
        color: var(--color-active);

        .nav-icon {
          transform: translateY(-2px);
        }

        .nav-text {
          font-weight: 700;
        }
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .nav-tab--special {
      .nav-icon--circle {
        background-color: var(--color-active);
        color: #ffffff;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 50%;
        margin-top: -0.5rem;
        box-shadow: 0 0.25rem 0.75rem rgba(122, 158, 126, 0.4);
      }

      &.active .nav-icon--circle {
        background-color: var(--color-alert);
        box-shadow: 0 0.25rem 0.75rem rgba(224, 122, 95, 0.4);
      }
    }
  `]
})
export class BottomNavComponent {}
