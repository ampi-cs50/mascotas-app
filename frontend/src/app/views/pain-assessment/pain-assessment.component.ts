import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PetService } from '../../services/pet.service';
import { PainAssessment, Pet } from '../../models/pet.models';

@Component({
  selector: 'app-pain-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pain-assessment-view">
      
      <!-- Encabezado de la Vista -->
      <div class="view-header">
        <div class="tag-row">
          <span class="badge badge--moderate">Herramienta Clínica</span>
          <span class="scale-title">
            {{ isDog() ? 'Escala Conductual Canina (Glasgow / CSU)' : 'Feline Grimace Scale (FGS)' }}
          </span>
        </div>
        <h1>{{ isDog() ? 'Evaluador de Dolor Canino' : 'Evaluador de Dolor Facial' }}</h1>
        <p class="text-muted">
          {{ isDog() 
            ? 'Evalúa postura corporal, ánimo y respuesta al tacto de ' + petName() + ' para detectar dolor osteomuscular o visceral oculto.' 
            : 'Compara los 3 rasgos faciales de ' + petName() + ' para detectar signos sutiles de dolor o malestar según la escala de muecas.' 
          }}
        </p>

        <!-- Selector de Mascota / Especie Activa -->
        @if (allPets().length > 1) {
          <div class="pet-switch-pills">
            <span class="switch-label">Evaluando a:</span>
            @for (p of allPets(); track p.id) {
              <button 
                type="button" 
                class="pet-pill-btn"
                [class.pet-pill-btn--active]="p.id === activePet()?.id"
                (click)="switchPet(p.id)">
                <span>{{ p.species === 'DOG' ? '🐶' : '🐱' }}</span>
                <strong>{{ p.name }}</strong>
                <span class="pet-pill-species">({{ p.species === 'DOG' ? 'Perro' : 'Gato' }})</span>
              </button>
            }
          </div>
        }

        <!-- Explicación Clínica de la Especie -->
        <div class="species-info-banner" [class.species-info--dog]="isDog()">
          <div class="info-icon">{{ isDog() ? '🐕' : '🐈' }}</div>
          <div class="info-text">
            <strong>{{ isDog() ? '¿Por qué no se evalúa la cara en perros?' : '¿Por qué la cara en gatos?' }}</strong>
            <p>
              {{ isDog()
                ? 'A diferencia de los felinos, la enorme variedad de razas caninas (hocicos chatos vs largos, orejas caídas vs erguidas) impide un patrón facial único. En perros, el estándar veterinario (Glasgow CMPS-SF y Colorado State University) mide postura, marcha, ánimo y reacción a la palpación.'
                : 'Los felinos enmascaran instintivamente el dolor. La escala FGS mide la tensión de los músculos faciales involuntarios (posición de orejas, cierre orbital y tensión del hocico con bigotes), altamente correlacionados con dolor agudo.'
              }}
            </p>
          </div>
        </div>
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

      <!-- ======================================================= -->
      <!-- FLUJO PARA PERROS: Glasgow CMPS-SF & CSU Acute Pain Scale -->
      <!-- ======================================================= -->
      @if (isDog()) {

        <!-- 1. Postura Corporal y Movilidad (Perro) -->
        <section class="card trait-card">
          <div class="trait-header">
            <span class="trait-step">Paso 1</span>
            <h3>Postura Corporal y Movilidad</h3>
            <p class="trait-sub">Observa la línea de la columna, la posición de la cola y cómo se para o desplaza.</p>
          </div>

          <div class="options-grid">
            @for (opt of dogPostureOptions; track opt.score) {
              <button 
                type="button" 
                class="trait-option-btn"
                [class.trait-option-btn--selected]="step1Score() === opt.score"
                (click)="step1Score.set(opt.score)">
                <div class="illustration-box">
                  <!-- SVG Perro Paso 1: Postura -->
                  <svg viewBox="0 0 120 80" class="scale-svg" aria-hidden="true">
                    <!-- Línea de suelo -->
                    <line x1="8" y1="74" x2="112" y2="74" stroke="#D1DCD2" stroke-width="2" stroke-linecap="round" />

                    @if (opt.score === 0) {
                      <!-- Relajado / Fluido: Columna suave, cola alegre levantada -->
                      <!-- Cola levantada con suave movimiento -->
                      <path d="M 32 40 Q 18 26 22 14" fill="none" stroke="#2D3A2F" stroke-width="2.5" stroke-linecap="round" />
                      <path d="M 14 16 Q 11 20 13 25" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
                      <path d="M 9 19 Q 7 23 9 27" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" />

                      <!-- Cuerpo silueta fluida -->
                      <path d="M 32 40 Q 54 37 74 40 L 84 28 Q 88 23 94 26 L 102 33 L 98 42 L 86 44 Q 78 52 68 52 L 40 52 Q 32 48 32 40 Z" fill="#edd9c7" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />
                      
                      <!-- Patas firmes y naturales -->
                      <line x1="76" y1="48" x2="76" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <line x1="84" y1="48" x2="84" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <path d="M 36 48 L 30 62 L 32 74" fill="none" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <path d="M 44 50 L 40 62 L 42 74" fill="none" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />

                      <!-- Oreja y cara relajada -->
                      <path d="M 80 28 Q 76 38 82 40 Z" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2" />
                      <circle cx="92" cy="30" r="2" fill="#2D3A2F" />
                      <circle cx="102" cy="35" r="2" fill="#2D3A2F" />

                      <!-- Sello de bienestar verde -->
                      <circle cx="106" cy="14" r="8" fill="#d1fae5" />
                      <path d="M 102 14 L 105 17 L 110 11" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

                    } @else if (opt.score === 1) {
                      <!-- Rígido / Tenso: Columna recta horizontal, cabeza nivelada, cola caída -->
                      <!-- Cola baja / recta -->
                      <path d="M 32 44 L 22 66" fill="none" stroke="#2D3A2F" stroke-width="2.5" stroke-linecap="round" />

                      <!-- Cuerpo tenso horizontal -->
                      <path d="M 32 44 L 76 44 L 86 38 L 98 40 L 96 48 L 86 50 L 68 56 L 40 56 Z" fill="#edd9c7" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />

                      <!-- Línea de rigidez sobre el lomo (Ámbar) -->
                      <line x1="36" y1="36" x2="72" y2="36" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="3,2" />
                      <path d="M 52 32 L 55 36 L 52 40" fill="none" stroke="#f59e0b" stroke-width="2" />

                      <!-- Patas rígidas rectas -->
                      <line x1="76" y1="50" x2="76" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <line x1="84" y1="50" x2="84" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <line x1="36" y1="50" x2="34" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <line x1="44" y1="50" x2="42" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />

                      <!-- Oreja y cara neutra -->
                      <path d="M 82 40 L 74 48 L 84 48 Z" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2" />
                      <circle cx="90" cy="40" r="1.8" fill="#2D3A2F" />
                      <circle cx="97" cy="43" r="2" fill="#2D3A2F" />

                      <!-- Alerta ámbar -->
                      <circle cx="106" cy="14" r="8" fill="#fef3c7" />
                      <text x="106" y="18" font-size="10" font-weight="900" fill="#d97706" text-anchor="middle">!</text>

                    } @else {
                      <!-- Encorvado / Dolor: Cifosis evidente (lomo arqueado), cola escondida, cabeza gacha -->
                      <!-- Cola fuertemente metida entre las patas -->
                      <path d="M 28 58 Q 18 70 34 70" fill="none" stroke="#2D3A2F" stroke-width="2.5" stroke-linecap="round" />

                      <!-- Lomo marcadamente arqueado hacia arriba (cifosis) -->
                      <path d="M 28 58 Q 50 20 74 54 L 86 62 L 94 64 L 90 72 L 80 70 L 64 64 Q 48 58 36 62 Z" fill="#e8c7b0" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />

                      <!-- Relámpago de dolor en el lomo encorvado -->
                      <path d="M 46 16 L 52 24 L 47 26 L 55 33" fill="none" stroke="#e07a5f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M 38 22 L 34 20" stroke="#e07a5f" stroke-width="2" stroke-linecap="round" />
                      <path d="M 62 22 L 66 20" stroke="#e07a5f" stroke-width="2" stroke-linecap="round" />

                      <!-- Patas encogidas por dolor -->
                      <line x1="76" y1="58" x2="76" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <line x1="84" y1="64" x2="84" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <line x1="34" y1="60" x2="38" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />

                      <!-- Cabeza gacha con ojos apretados de dolor -->
                      <path d="M 74 52 L 64 58 L 76 60 Z" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2" />
                      <path d="M 86 62 L 90 64" stroke="#2D3A2F" stroke-width="2" stroke-linecap="round" />
                      <circle cx="94" cy="66" r="2" fill="#2D3A2F" />

                      <!-- Alerta roja -->
                      <circle cx="106" cy="14" r="8" fill="#fee2e2" />
                      <path d="M 106 10 L 106 15 M 106 18 L 106 19" stroke="#ef4444" stroke-width="2" stroke-linecap="round" />
                    }
                  </svg>
                </div>
                <div class="trait-option-label">
                  <span class="score-badge" [class]="'badge--score-' + opt.score">+{{ opt.score }}</span>
                  <strong>{{ opt.title }}</strong>
                  <span class="opt-desc">{{ opt.desc }}</span>
                </div>
              </button>
            }
          </div>
        </section>

        <!-- 2. Disposición, Ánimo y Mirada (Perro) -->
        <section class="card trait-card">
          <div class="trait-header">
            <span class="trait-step">Paso 2</span>
            <h3>Comportamiento, Ánimo y Mirada</h3>
            <p class="trait-sub">Verifica su energía para interactuar, expresión facial y mirada.</p>
          </div>

          <div class="options-grid">
            @for (opt of dogDemeanorOptions; track opt.score) {
              <button 
                type="button" 
                class="trait-option-btn"
                [class.trait-option-btn--selected]="step2Score() === opt.score"
                (click)="step2Score.set(opt.score)">
                <div class="illustration-box">
                  <!-- SVG Perro Paso 2: Expresión Frontal -->
                  <svg viewBox="0 0 100 80" class="scale-svg" aria-hidden="true">
                    @if (opt.score === 0) {
                      <!-- Sociable y Atento: Orejas arriba, ojos brillantes con destello, sonrisa con lengüita -->
                      <path d="M 26 42 Q 50 30 74 42 Q 86 64 50 76 Q 14 64 26 42" fill="#edd9c7" stroke="#2D3A2F" stroke-width="2.5" />
                      <!-- Orejas erguidas -->
                      <path d="M 28 38 L 18 16 L 42 32 Z" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />
                      <path d="M 72 38 L 82 16 L 58 32 Z" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />
                      <!-- Ojos grandes y alegres -->
                      <ellipse cx="38" cy="46" rx="5" ry="5.5" fill="#2D3A2F" />
                      <circle cx="40" cy="44" r="1.8" fill="#ffffff" />
                      <ellipse cx="62" cy="46" rx="5" ry="5.5" fill="#2D3A2F" />
                      <circle cx="64" cy="44" r="1.8" fill="#ffffff" />
                      <!-- Nariz -->
                      <path d="M 44 54 Q 50 51 56 54 Q 50 62 44 54" fill="#2D3A2F" />
                      <!-- Sonrisa feliz y lengua asomada -->
                      <path d="M 42 62 Q 50 68 58 62" fill="none" stroke="#2D3A2F" stroke-width="2" stroke-linecap="round" />
                      <path d="M 46 64 Q 50 72 54 64 Z" fill="#f4a39b" stroke="#2D3A2F" stroke-width="1.5" />
                      <!-- Destello bienestar -->
                      <circle cx="86" cy="18" r="6" fill="#d1fae5" />
                      <text x="86" y="21" font-size="8" fill="#059669" text-anchor="middle">✦</text>

                    } @else if (opt.score === 1) {
                      <!-- Desganado / Apagado: Orejas caídas, ojos entrecerrados, sin sonrisa -->
                      <path d="M 26 42 Q 50 32 74 42 Q 86 64 50 76 Q 14 64 26 42" fill="#edd9c7" stroke="#2D3A2F" stroke-width="2.5" />
                      <!-- Orejas caídas sin fuerza -->
                      <path d="M 26 40 Q 14 54 22 66 Q 30 56 28 42" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2" />
                      <path d="M 74 40 Q 86 54 78 66 Q 70 56 72 42" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2" />
                      <!-- Ojos apagados mirando hacia abajo -->
                      <ellipse cx="38" cy="48" rx="5" ry="2.5" fill="#2D3A2F" />
                      <ellipse cx="62" cy="48" rx="5" ry="2.5" fill="#2D3A2F" />
                      <line x1="33" y1="44" x2="43" y2="46" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                      <line x1="67" y1="44" x2="57" y2="46" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                      <!-- Nariz -->
                      <path d="M 44 56 Q 50 53 56 56 Q 50 63 44 56" fill="#2D3A2F" />
                      <!-- Boca plana / seria -->
                      <line x1="42" y1="65" x2="58" y2="65" stroke="#2D3A2F" stroke-width="2" stroke-linecap="round" />
                      <!-- Indicador ámbar -->
                      <circle cx="86" cy="18" r="6" fill="#fef3c7" />
                      <text x="86" y="21.5" font-size="8" font-weight="900" fill="#d97706" text-anchor="middle">···</text>

                    } @else {
                      <!-- Inquieto / Mirada de Dolor: Orejas pegadas atrás, ceño fruncido, boca en quejido/jadeo -->
                      <path d="M 26 44 Q 50 34 74 44 Q 84 64 50 76 Q 16 64 26 44" fill="#e8c7b0" stroke="#2D3A2F" stroke-width="2.5" />
                      <!-- Orejas aplastadas hacia atrás -->
                      <path d="M 26 42 L 8 36 L 22 50 Z" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2.2" />
                      <path d="M 74 42 L 92 36 L 78 50 Z" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2.2" />
                      <!-- Ojos con blanco visible (whale eye) y arrugas de dolor -->
                      <ellipse cx="38" cy="48" rx="5.5" ry="5.5" fill="#ffffff" stroke="#2D3A2F" stroke-width="1.8" />
                      <circle cx="39" cy="48" r="3" fill="#2D3A2F" />
                      <ellipse cx="62" cy="48" rx="5.5" ry="5.5" fill="#ffffff" stroke="#2D3A2F" stroke-width="1.8" />
                      <circle cx="61" cy="48" r="3" fill="#2D3A2F" />
                      <!-- Ceño fruncido de dolor en coral -->
                      <path d="M 33 41 L 43 45" stroke="#e07a5f" stroke-width="2.2" stroke-linecap="round" />
                      <path d="M 67 41 L 57 45" stroke="#e07a5f" stroke-width="2.2" stroke-linecap="round" />
                      <path d="M 46 36 L 50 42 L 54 36" fill="none" stroke="#e07a5f" stroke-width="2" stroke-linecap="round" />
                      <!-- Boca entreabierta tensa con quejido / jadeo -->
                      <path d="M 40 62 Q 50 74 60 62 Z" fill="#4a2828" stroke="#2D3A2F" stroke-width="2" />
                      <!-- Temblor líneas -->
                      <path d="M 8 50 Q 5 54 8 58" fill="none" stroke="#e07a5f" stroke-width="2" stroke-linecap="round" />
                      <path d="M 92 50 Q 95 54 92 58" fill="none" stroke="#e07a5f" stroke-width="2" stroke-linecap="round" />
                    }
                  </svg>
                </div>
                <div class="trait-option-label">
                  <span class="score-badge" [class]="'badge--score-' + opt.score">+{{ opt.score }}</span>
                  <strong>{{ opt.title }}</strong>
                  <span class="opt-desc">{{ opt.desc }}</span>
                </div>
              </button>
            }
          </div>
        </section>

        <!-- 3. Respuesta a la Caricia y Palpación (Perro) -->
        <section class="card trait-card">
          <div class="trait-header">
            <span class="trait-step">Paso 3</span>
            <h3>Respuesta a la Caricia y Tacto</h3>
            <p class="trait-sub">Acaricia suavemente el lomo, abdomen o articulaciones y observa su reacción.</p>
          </div>

          <div class="options-grid">
            @for (opt of dogTouchOptions; track opt.score) {
              <button 
                type="button" 
                class="trait-option-btn"
                [class.trait-option-btn--selected]="step3Score() === opt.score"
                (click)="step3Score.set(opt.score)">
                <div class="illustration-box">
                  <!-- SVG Perro Paso 3: Respuesta al Tacto -->
                  <svg viewBox="0 0 120 80" class="scale-svg" aria-hidden="true">
                    <!-- Suelo -->
                    <line x1="8" y1="74" x2="112" y2="74" stroke="#D1DCD2" stroke-width="2" stroke-linecap="round" />

                    @if (opt.score === 0) {
                      <!-- Receptivo / Disfruta: Se apoya en la caricia con ojos cerrados de placer -->
                      <path d="M 38 46 Q 60 42 80 46 L 90 36 Q 94 32 100 36 L 106 44 L 96 52 Q 88 56 76 56 L 46 56 Z" fill="#edd9c7" stroke="#2D3A2F" stroke-width="2.5" />
                      <line x1="76" y1="56" x2="76" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <line x1="46" y1="56" x2="44" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <!-- Ojos cerrados de placer -->
                      <path d="M 94 40 Q 98 36 102 40" fill="none" stroke="#2D3A2F" stroke-width="2" stroke-linecap="round" />
                      <!-- Mano acariciando con suavidad -->
                      <path d="M 38 24 C 48 24, 54 32, 66 36 C 72 38, 76 38, 78 34" fill="none" stroke="#2D3A2F" stroke-width="3.5" stroke-linecap="round" />
                      <path d="M 38 24 C 48 24, 54 32, 66 36 C 72 38, 76 38, 78 34" fill="none" stroke="#fed7aa" stroke-width="2" stroke-linecap="round" />
                      <!-- Corazón verde de calma -->
                      <path d="M 88 18 Q 88 12 94 12 Q 98 12 98 16 Q 98 22 88 26 Q 78 22 78 16 Q 78 12 82 12 Q 88 12 88 18 Z" fill="#10b981" />

                    } @else if (opt.score === 1) {
                      <!-- Se Aparta / Tensión: Cuerpo tenso, gira la cabeza vigilando la mano -->
                      <!-- Mano tocando el lomo -->
                      <path d="M 26 26 C 34 26, 40 34, 52 40" fill="none" stroke="#2D3A2F" stroke-width="3.5" stroke-linecap="round" />
                      <path d="M 26 26 C 34 26, 40 34, 52 40" fill="none" stroke="#fed7aa" stroke-width="2" stroke-linecap="round" />
                      <!-- Cuerpo tenso -->
                      <path d="M 42 46 Q 60 48 74 46 L 80 40 L 88 42 L 86 50 L 76 54 L 46 54 Z" fill="#edd9c7" stroke="#2D3A2F" stroke-width="2.5" />
                      <!-- Cabeza girada con recelo hacia la mano -->
                      <path d="M 74 46 Q 72 34 62 36 L 58 42 L 66 46 Z" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2" />
                      <circle cx="64" cy="38" r="2" fill="#2D3A2F" />
                      <!-- Flecha ámbar de apartarse / retroceso -->
                      <path d="M 94 48 L 106 48 M 102 44 L 106 48 L 102 52" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                      <line x1="72" y1="54" x2="72" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <line x1="48" y1="54" x2="48" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />

                    } @else {
                      <!-- Rechazo / Defensa: Mano retirada, destello rojo de dolor, boca defensiva -->
                      <!-- Mano retirada rápidamente -->
                      <path d="M 16 18 C 24 18, 26 26, 36 28" fill="none" stroke="#2D3A2F" stroke-width="3.5" stroke-linecap="round" />
                      <path d="M 16 18 C 24 18, 26 26, 36 28" fill="none" stroke="#fed7aa" stroke-width="2" stroke-linecap="round" />
                      <!-- Relámpago de dolor agudo al contacto -->
                      <polygon points="50,22 55,30 51,32 58,40 46,33 50,31" fill="#ef4444" stroke="#2D3A2F" stroke-width="1.5" />
                      <!-- Cuerpo en defensa / quejido / gruñido -->
                      <path d="M 44 48 Q 60 40 76 48 L 86 38 L 98 42 L 94 54 L 84 58 L 48 58 Z" fill="#e8c7b0" stroke="#2D3A2F" stroke-width="2.5" />
                      <!-- Boca abierta mostrando dientes -->
                      <path d="M 90 44 L 98 44 L 94 52 Z" fill="#5c2626" stroke="#2D3A2F" stroke-width="1.8" />
                      <polygon points="92,44 94,47 96,44" fill="#ffffff" />
                      <polygon points="92,50 94,47 96,50" fill="#ffffff" />
                      <!-- Orejas pegadas -->
                      <path d="M 82 38 L 74 34 L 82 44 Z" fill="#dfc3ad" stroke="#2D3A2F" stroke-width="2" />
                      <line x1="74" y1="58" x2="70" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <line x1="50" y1="58" x2="54" y2="74" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <!-- Alerta de peligro / mordida defensiva -->
                      <path d="M 106 14 L 115 30 L 97 30 Z" fill="#fee2e2" stroke="#ef4444" stroke-width="2" stroke-linejoin="round" />
                      <text x="106" y="27" font-size="10" font-weight="900" fill="#ef4444" text-anchor="middle">!</text>
                    }
                  </svg>
                </div>
                <div class="trait-option-label">
                  <span class="score-badge" [class]="'badge--score-' + opt.score">+{{ opt.score }}</span>
                  <strong>{{ opt.title }}</strong>
                  <span class="opt-desc">{{ opt.desc }}</span>
                </div>
              </button>
            }
          </div>
        </section>

      } @else {

        <!-- ======================================================= -->
        <!-- FLUJO PARA GATOS: Feline Grimace Scale (FGS)             -->
        <!-- ======================================================= -->

        <!-- 1. Posición de las Orejas (Gato) -->
        <section class="card trait-card">
          <div class="trait-header">
            <span class="trait-step">Paso 1</span>
            <h3>Posición de las Orejas</h3>
            <p class="trait-sub">Observa si las orejas están erguidas hacia el frente o aplanadas hacia los costados.</p>
          </div>

          <div class="options-grid">
            @for (opt of catEarsOptions; track opt.score) {
              <button 
                type="button" 
                class="trait-option-btn"
                [class.trait-option-btn--selected]="step1Score() === opt.score"
                (click)="step1Score.set(opt.score)">
                <div class="illustration-box">
                  <!-- SVG Ilustración de Orejas de Gato -->
                  <svg viewBox="0 0 100 80" class="scale-svg" aria-hidden="true">
                    <!-- Contorno cabeza felina -->
                    <path d="M 20 65 Q 50 80 80 65 Q 70 35 50 35 Q 30 35 20 65" fill="#fcf6ed" stroke="#2D3A2F" stroke-width="2.5" />
                    
                    @if (opt.score === 0) {
                      <!-- Orejas hacia el frente erguidas (0) con interior rosado suave -->
                      <path d="M 28 44 L 20 12 L 42 36 Z" fill="#eedbc9" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />
                      <path d="M 26 38 L 22 18 L 38 34 Z" fill="#f4b9b8" />
                      <path d="M 72 44 L 80 12 L 58 36 Z" fill="#eedbc9" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />
                      <path d="M 74 38 L 78 18 L 62 34 Z" fill="#f4b9b8" />
                      <circle cx="86" cy="18" r="6" fill="#d1fae5" />
                      <text x="86" y="21" font-size="8" fill="#059669" text-anchor="middle">✓</text>
                    } @else if (opt.score === 1) {
                      <!-- Orejas rotadas ligeramente hacia afuera / avión (1) -->
                      <path d="M 28 48 L 10 24 L 40 38 Z" fill="#eedbc9" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />
                      <path d="M 25 44 L 14 27 L 36 38 Z" fill="#f4b9b8" />
                      <path d="M 72 48 L 90 24 L 60 38 Z" fill="#eedbc9" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />
                      <path d="M 75 44 L 86 27 L 64 38 Z" fill="#f4b9b8" />
                      <circle cx="86" cy="18" r="6" fill="#fef3c7" />
                      <text x="86" y="21.5" font-size="8" font-weight="900" fill="#d97706" text-anchor="middle">!</text>
                    } @else {
                      <!-- Orejas aplanadas hacia atrás/costados (2) -->
                      <path d="M 26 52 L 4 44 L 36 42 Z" fill="#eedbc9" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />
                      <path d="M 74 52 L 96 44 L 64 42 Z" fill="#eedbc9" stroke="#2D3A2F" stroke-width="2.5" stroke-linejoin="round" />
                      <line x1="46" y1="44" x2="54" y2="44" stroke="#e07a5f" stroke-width="2" stroke-linecap="round" />
                      <circle cx="86" cy="18" r="6" fill="#fee2e2" />
                      <text x="86" y="21.5" font-size="8" font-weight="900" fill="#ef4444" text-anchor="middle">!</text>
                    }

                    <!-- Ojos guía -->
                    <circle cx="38" cy="55" r="2.5" fill="#2D3A2F" />
                    <circle cx="62" cy="55" r="2.5" fill="#2D3A2F" />
                  </svg>
                </div>
                <div class="trait-option-label">
                  <span class="score-badge" [class]="'badge--score-' + opt.score">+{{ opt.score }}</span>
                  <strong>{{ opt.title }}</strong>
                  <span class="opt-desc">{{ opt.desc }}</span>
                </div>
              </button>
            }
          </div>
        </section>

        <!-- 2. Apertura y Tensión de Ojos (Gato) -->
        <section class="card trait-card">
          <div class="trait-header">
            <span class="trait-step">Paso 2</span>
            <h3>Apertura y Tensión de Ojos</h3>
            <p class="trait-sub">Verifica si tiene la mirada relajada o los párpados apretados por tensión orbital.</p>
          </div>

          <div class="options-grid">
            @for (opt of catEyesOptions; track opt.score) {
              <button 
                type="button" 
                class="trait-option-btn"
                [class.trait-option-btn--selected]="step2Score() === opt.score"
                (click)="step2Score.set(opt.score)">
                <div class="illustration-box">
                  <!-- SVG Ilustración de Ojos de Gato -->
                  <svg viewBox="0 0 100 80" class="scale-svg" aria-hidden="true">
                    <path d="M 20 65 Q 50 80 80 65 Q 70 35 50 35 Q 30 35 20 65" fill="#fcf6ed" stroke="#2D3A2F" stroke-width="2.5" />
                    <!-- Orejas base -->
                    <path d="M 28 45 L 22 18 L 40 37 Z" fill="#eedbc9" stroke="#2D3A2F" stroke-width="2" />
                    <path d="M 72 45 L 78 18 L 60 37 Z" fill="#eedbc9" stroke="#2D3A2F" stroke-width="2" />

                    @if (opt.score === 0) {
                      <!-- Ojos abiertos y redondos con iris verde esmeralda y pupila vertical -->
                      <ellipse cx="38" cy="54" rx="7" ry="7" fill="#6ba370" stroke="#2D3A2F" stroke-width="2" />
                      <ellipse cx="38" cy="54" rx="2" ry="5.5" fill="#2D3A2F" />
                      <circle cx="36" cy="52" r="1.5" fill="#ffffff" />

                      <ellipse cx="62" cy="54" rx="7" ry="7" fill="#6ba370" stroke="#2D3A2F" stroke-width="2" />
                      <ellipse cx="62" cy="54" rx="2" ry="5.5" fill="#2D3A2F" />
                      <circle cx="60" cy="52" r="1.5" fill="#ffffff" />
                    } @else if (opt.score === 1) {
                      <!-- Ojos entrecerrados / almendrados (tensión moderada) -->
                      <ellipse cx="38" cy="54" rx="7" ry="3.5" fill="#6ba370" stroke="#2D3A2F" stroke-width="2" />
                      <line x1="31" y1="54" x2="45" y2="54" stroke="#2D3A2F" stroke-width="2" />

                      <ellipse cx="62" cy="54" rx="7" ry="3.5" fill="#6ba370" stroke="#2D3A2F" stroke-width="2" />
                      <line x1="55" y1="54" x2="69" y2="54" stroke="#2D3A2F" stroke-width="2" />
                    } @else {
                      <!-- Ojos apretados cerrados con arrugas de dolor -->
                      <path d="M 31 55 Q 38 50 45 55" fill="none" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <path d="M 55 55 Q 62 50 69 55" fill="none" stroke="#2D3A2F" stroke-width="3" stroke-linecap="round" />
                      <path d="M 33 50 L 37 47" stroke="#e07a5f" stroke-width="1.8" stroke-linecap="round" />
                      <path d="M 67 50 L 63 47" stroke="#e07a5f" stroke-width="1.8" stroke-linecap="round" />
                    }
                  </svg>
                </div>
                <div class="trait-option-label">
                  <span class="score-badge" [class]="'badge--score-' + opt.score">+{{ opt.score }}</span>
                  <strong>{{ opt.title }}</strong>
                  <span class="opt-desc">{{ opt.desc }}</span>
                </div>
              </button>
            }
          </div>
        </section>

        <!-- 3. Tensión del Hocico y Bigotes (Gato) -->
        <section class="card trait-card">
          <div class="trait-header">
            <span class="trait-step">Paso 3</span>
            <h3>Hocico y Bigotes</h3>
            <p class="trait-sub">Observa la forma de las almohadillas nasales y la orientación de los bigotes.</p>
          </div>

          <div class="options-grid">
            @for (opt of catMuzzleOptions; track opt.score) {
              <button 
                type="button" 
                class="trait-option-btn"
                [class.trait-option-btn--selected]="step3Score() === opt.score"
                (click)="step3Score.set(opt.score)">
                <div class="illustration-box">
                  <!-- SVG Ilustración de Hocico y Bigotes de Gato -->
                  <svg viewBox="0 0 100 80" class="scale-svg" aria-hidden="true">
                    <path d="M 20 65 Q 50 80 80 65 Q 70 35 50 35 Q 30 35 20 65" fill="#fcf6ed" stroke="#2D3A2F" stroke-width="2.5" />
                    <circle cx="38" cy="50" r="2.5" fill="#2D3A2F" />
                    <circle cx="62" cy="50" r="2.5" fill="#2D3A2F" />
                    <!-- Naricita rosada -->
                    <polygon points="46,58 54,58 50,62" fill="#E07A5F" />

                    @if (opt.score === 0) {
                      <!-- Hocico relajado redondo, bigotes curvos hacia abajo -->
                      <circle cx="44" cy="65" r="5" fill="#eedbc9" stroke="#2D3A2F" stroke-width="1.5" />
                      <circle cx="56" cy="65" r="5" fill="#eedbc9" stroke="#2D3A2F" stroke-width="1.5" />
                      <path d="M 40 64 Q 28 66 18 72" fill="none" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                      <path d="M 40 67 Q 26 71 16 78" fill="none" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                      <path d="M 60 64 Q 72 66 82 72" fill="none" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                      <path d="M 60 67 Q 74 71 84 78" fill="none" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                    } @else if (opt.score === 1) {
                      <!-- Hocico elíptico más plano, bigotes rectos horizontales -->
                      <ellipse cx="44" cy="65" rx="6" ry="4" fill="#eedbc9" stroke="#2D3A2F" stroke-width="1.5" />
                      <ellipse cx="56" cy="65" rx="6" ry="4" fill="#eedbc9" stroke="#2D3A2F" stroke-width="1.5" />
                      <line x1="39" y1="63" x2="14" y2="63" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                      <line x1="39" y1="67" x2="14" y2="69" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                      <line x1="61" y1="63" x2="86" y2="63" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                      <line x1="61" y1="67" x2="86" y2="69" stroke="#2D3A2F" stroke-width="1.8" stroke-linecap="round" />
                    } @else {
                      <!-- Hocico tenso elíptico, bigotes proyectados hacia adelante con alerta coral -->
                      <ellipse cx="43" cy="64" rx="7" ry="3.5" fill="#e8c7b0" stroke="#e07a5f" stroke-width="2" />
                      <ellipse cx="57" cy="64" rx="7" ry="3.5" fill="#e8c7b0" stroke="#e07a5f" stroke-width="2" />
                      <line x1="38" y1="62" x2="10" y2="56" stroke="#e07a5f" stroke-width="2.2" stroke-linecap="round" />
                      <line x1="38" y1="66" x2="12" y2="64" stroke="#e07a5f" stroke-width="2.2" stroke-linecap="round" />
                      <line x1="62" y1="62" x2="90" y2="56" stroke="#e07a5f" stroke-width="2.2" stroke-linecap="round" />
                      <line x1="62" y1="66" x2="88" y2="64" stroke="#e07a5f" stroke-width="2.2" stroke-linecap="round" />
                    }
                  </svg>
                </div>
                <div class="trait-option-label">
                  <span class="score-badge" [class]="'badge--score-' + opt.score">+{{ opt.score }}</span>
                  <strong>{{ opt.title }}</strong>
                  <span class="opt-desc">{{ opt.desc }}</span>
                </div>
              </button>
            }
          </div>
        </section>

      }

      <!-- Notas Clínicas de la Evaluación -->
      <section class="card">
        <h3>Notas de la Evaluación (Opcional)</h3>
        <input 
          type="text" 
          class="form-input" 
          placeholder="Ej: Observado tras caminata, comida o siesta..."
          [ngModel]="assessmentNotes()"
          (ngModelChange)="assessmentNotes.set($event)" />
      </section>

      <!-- Confirmation Toast -->
      @if (saveSuccess()) {
        <div class="success-alert">
          <span>✅ Evaluación de dolor guardada en el historial de {{ petName() }}</span>
        </div>
      }

      <!-- Guardar Evaluación CTA -->
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
      gap: 0.85rem;
    }

    .view-header {
      .tag-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.35rem;

        .scale-title {
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

    /* Selector de Mascota en la Vista */
    .pet-switch-pills {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;

      .switch-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--color-text-muted);
        text-transform: uppercase;
        margin-right: 0.15rem;
      }

      .pet-pill-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.3rem 0.65rem;
        border-radius: var(--radius-pill);
        border: 1px solid rgba(45, 58, 47, 0.15);
        background: #ffffff;
        font-size: 0.78rem;
        cursor: pointer;
        transition: all 0.2s ease;

        .pet-pill-species {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          font-weight: normal;
        }

        &:hover {
          border-color: var(--color-active);
        }

        &--active {
          background: var(--color-active-light);
          border-color: var(--color-active);
          color: var(--color-active);
          font-weight: 700;

          .pet-pill-species {
            color: var(--color-active);
            opacity: 0.85;
          }
        }
      }
    }

    /* Banner Informativo de Especie */
    .species-info-banner {
      display: flex;
      gap: 0.65rem;
      background: #f0f7f1;
      border: 1px solid #cce5d1;
      border-radius: 0.85rem;
      padding: 0.75rem 0.85rem;
      margin-top: 0.75rem;
      align-items: flex-start;

      &.species-info--dog {
        background: #fdf6ec;
        border-color: #faecd8;
      }

      .info-icon {
        font-size: 1.3rem;
        flex-shrink: 0;
        line-height: 1.2;
      }

      .info-text {
        strong {
          display: block;
          font-size: 0.82rem;
          color: var(--color-text-main);
          margin-bottom: 0.2rem;
        }

        p {
          font-size: 0.74rem;
          color: var(--color-text-muted);
          line-height: 1.35;
          margin: 0;
        }
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
          font-size: 1.02rem;
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
      padding: 0.55rem 0.4rem;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      .illustration-box {
        width: 100%;
        height: 4.8rem;
        background: #fbfbfa;
        border-radius: 0.75rem;
        border: 1px solid rgba(45, 58, 47, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.2rem;
        overflow: hidden;

        .scale-svg {
          width: 100%;
          height: 100%;
          display: block;
        }
      }

      .trait-option-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 0.4rem;
        width: 100%;

        .score-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.1rem 0.45rem;
          border-radius: var(--radius-pill);
          background: rgba(45, 58, 47, 0.08);
          color: var(--color-text-muted);

          &.badge--score-0 {
            background-color: #d1fae5;
            color: #065f46;
          }

          &.badge--score-1 {
            background-color: #fef3c7;
            color: #92400e;
          }

          &.badge--score-2 {
            background-color: #fee2e2;
            color: #991b1b;
          }
        }

        strong {
          font-size: 0.78rem;
          margin-top: 0.25rem;
          line-height: 1.2;
          color: var(--color-text-main);
        }

        .opt-desc {
          font-size: 0.68rem;
          color: var(--color-text-muted);
          line-height: 1.2;
          margin-top: 0.2rem;
        }
      }

      &:hover {
        border-color: var(--color-active);
        transform: translateY(-1px);
      }

      &--selected {
        border-color: var(--color-active);
        background-color: var(--color-active-light);
        box-shadow: 0 0 0 2px var(--color-active);

        .illustration-box {
          background: #ffffff;
          border-color: var(--color-active);
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

  allPets = this.petService.pets;
  activePet = this.petService.activePet;

  isDog = computed(() => this.activePet()?.species === 'DOG');
  petName = computed(() => this.activePet()?.name || 'tu mascota');

  // Tres dimensiones evaluadas (mapeadas a ears_score, eyes_score, muzzle_score para persistencia)
  step1Score = signal<number>(0); // Orejas (Gato) | Postura y Marcha (Perro)
  step2Score = signal<number>(0); // Ojos (Gato) | Ánimo y Mirada (Perro)
  step3Score = signal<number>(0); // Hocico (Gato) | Respuesta al Tacto (Perro)
  assessmentNotes = signal<string>('');

  isSaving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);

  totalScore = computed(() => {
    return this.step1Score() + this.step2Score() + this.step3Score();
  });

  scoreStatus = computed(() => {
    const score = this.totalScore();
    const dog = this.isDog();

    if (score <= 1) {
      return {
        level: 'green',
        title: dog ? 'Confortable / Sin dolor aparente (0-1)' : 'Sin dolor aparente (0-1)',
        desc: dog 
          ? 'Postura relajada, marcha fluida y carácter sociable. Tu perro se encuentra libre de molestias evidentes.'
          : 'Expresión serena y relajada. Tu gato se encuentra en estado de confort.'
      };
    } else if (score <= 3) {
      return {
        level: 'yellow',
        title: dog ? 'Alerta / Molestia leve a moderada (2-3)' : 'Alerta / Molestia leve (2-3)',
        desc: dog
          ? 'Rigidez en marcha, menor interés o rechazo leve al tacto. Monitorea su descanso y actividad; consulta si persiste más de 24h.'
          : 'Se aprecian cambios en orejas o mirada. Monitorea su evolución durante las próximas horas.'
      };
    } else {
      return {
        level: 'red',
        title: 'Dolor significativo / Alerta (4-6)',
        desc: dog
          ? 'Lomo encorvado, quejido, apatía o defensa activa. Requiere valoración veterinaria urgente para diagnóstico y alivio analgésico.'
          : 'Mueca evidente de malestar. Se recomienda consultar inmediatamente al médico veterinario.'
      };
    }
  });

  // Opciones Caninas (Glasgow CMPS-SF / CSU)
  dogPostureOptions = [
    { score: 0, title: 'Relajada / Fluida', desc: 'Columna nivelada, cola alegre, marcha ágil' },
    { score: 1, title: 'Rígida / Tensa', desc: 'Paso cuidadoso, espalda recta tensa, cola baja' },
    { score: 2, title: 'Encorvada / Dolor', desc: 'Cifosis marcada (lomo arqueado), cola escondida' }
  ];

  dogDemeanorOptions = [
    { score: 0, title: 'Sociable y Atento', desc: 'Ojos brillantes, busca contacto, sonrisa' },
    { score: 1, title: 'Desganado / Apagado', desc: 'Indiferente, orejas caídas, mirada triste' },
    { score: 2, title: 'Inquieto / Mirada Fija', desc: 'Ceño tenso de dolor, temblores o jadeo' }
  ];

  dogTouchOptions = [
    { score: 0, title: 'Receptivo / Disfruta', desc: 'Se relaja con la caricia, cuerpo dócil' },
    { score: 1, title: 'Se Aparta / Tensión', desc: 'Se tensa al tocar, gira la cabeza con recelo' },
    { score: 2, title: 'Rechazo / Defensa', desc: 'Quejido, gruñido o defensa activa al tacto' }
  ];

  // Opciones Felinas (FGS)
  catEarsOptions = [
    { score: 0, title: 'Erguidas', desc: 'Hacia adelante y atentas' },
    { score: 1, title: 'Rotadas', desc: 'Ligeramente hacia afuera' },
    { score: 2, title: 'Aplanadas', desc: 'Hacia los lados y atrás' }
  ];

  catEyesOptions = [
    { score: 0, title: 'Abiertos', desc: 'Mirada relajada y redonda' },
    { score: 1, title: 'Entrecerrados', desc: 'Tensión orbital moderada' },
    { score: 2, title: 'Cerrados', desc: 'Párpados apretados de dolor' }
  ];

  catMuzzleOptions = [
    { score: 0, title: 'Relajado', desc: 'Hocico redondeado, bigotes curvos' },
    { score: 1, title: 'Tenso', desc: 'Bigotes rectos horizontales' },
    { score: 2, title: 'Proyectado', desc: 'Hocico elíptico tenso, bigotes alerta' }
  ];

  switchPet(petId: string) {
    this.petService.selectPet(petId);
    this.step1Score.set(0);
    this.step2Score.set(0);
    this.step3Score.set(0);
    this.assessmentNotes.set('');
  }

  saveAssessment() {
    const pet = this.activePet();
    if (!pet) return;

    this.isSaving.set(true);

    const prefix = this.isDog() ? '[Escala Canina Glasgow/CSU] ' : '[Escala Felina FGS] ';
    const userNotes = this.assessmentNotes().trim();
    const finalNotes = userNotes ? `${prefix}${userNotes}` : `${prefix}Evaluación registrada.`;

    const assessment: PainAssessment = {
      pet_id: pet.id,
      score: this.totalScore(),
      ears_score: this.step1Score(),
      eyes_score: this.step2Score(),
      muzzle_score: this.step3Score(),
      notes: finalNotes
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
