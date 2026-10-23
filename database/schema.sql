-- ====================================================================
-- Documento de Arquitectura y Diseño - App de Cuidado Preventivo para Mascotas
-- Esquema de Base de Datos Relacional (PostgreSQL / MySQL compatible)
-- ====================================================================

-- Extensión para UUIDs si se usa PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(10),
    verification_token VARCHAR(100),
    verification_expires_at TIMESTAMP,
    reset_password_code VARCHAR(10),
    reset_password_token VARCHAR(100),
    reset_password_expires_at TIMESTAMP
);

-- 2. Tabla: pets
CREATE TABLE IF NOT EXISTS pets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(10) NOT NULL CHECK (species IN ('CAT', 'DOG')),
    sex VARCHAR(10) DEFAULT 'FEMALE' CHECK (sex IN ('MALE', 'FEMALE')),
    is_neutered BOOLEAN DEFAULT FALSE,
    neutered_date DATE,
    birth_date DATE,
    weight_kg DECIMAL(5, 2),
    avatar_url TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tabla: daily_logs
-- Restricción de unicidad: (pet_id, log_date)
CREATE TABLE IF NOT EXISTS daily_logs (
    id VARCHAR(36) PRIMARY KEY,
    pet_id VARCHAR(36) NOT NULL,
    log_date DATE NOT NULL,
    water_intake VARCHAR(10) NOT NULL CHECK (water_intake IN ('LOW', 'NORMAL', 'HIGH')),
    food_intake VARCHAR(10) NOT NULL CHECK (food_intake IN ('NONE', 'LOW', 'NORMAL', 'HIGH')),
    litter_urine VARCHAR(15) NOT NULL CHECK (litter_urine IN ('NONE', 'REDUCED', 'NORMAL', 'EXCESSIVE', 'DIFFICULTY')),
    energy_mood VARCHAR(15) NOT NULL CHECK (energy_mood IN ('LETHARGIC', 'CALM', 'ACTIVE', 'PLAYFUL', 'RESTLESS')),
    notes VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    CONSTRAINT uq_pet_log_date UNIQUE (pet_id, log_date)
);

-- 4. Tabla: clinical_events
CREATE TABLE IF NOT EXISTS clinical_events (
    id VARCHAR(36) PRIMARY KEY,
    pet_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('VACCINE', 'DEWORMING', 'MEDICATION', 'CHECKUP', 'SURGERY')),
    event_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes VARCHAR(1000),
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- 5. Tabla: toxicity_directory (NUEVO)
CREATE TABLE IF NOT EXISTS toxicity_directory (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('PLANT', 'FOOD', 'MEDICATION', 'OBJECT', 'CHEMICAL')),
    danger_level VARCHAR(15) NOT NULL CHECK (danger_level IN ('MILD', 'MODERATE', 'SEVERE', 'FATAL')),
    symptoms TEXT NOT NULL,
    action_required TEXT NOT NULL,
    target_species VARCHAR(20) DEFAULT 'ALL' -- CAT, DOG, ALL
);

-- 6. Tabla: pain_assessments (NUEVO)
CREATE TABLE IF NOT EXISTS pain_assessments (
    id VARCHAR(36) PRIMARY KEY,
    pet_id VARCHAR(36) NOT NULL,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INT NOT NULL,
    ears_score INT DEFAULT 0,
    eyes_score INT DEFAULT 0,
    muzzle_score INT DEFAULT 0,
    notes VARCHAR(1000),
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- 7. Tabla: pet_vaccines (Cartilla de Vacunación Preventiva)
CREATE TABLE IF NOT EXISTS pet_vaccines (
    id VARCHAR(36) PRIMARY KEY,
    pet_id VARCHAR(36) NOT NULL,
    vaccine_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('CORE', 'LIFESTYLE', 'MANDATORY')),
    applied BOOLEAN DEFAULT FALSE,
    applied_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    CONSTRAINT uq_pet_vaccine UNIQUE (pet_id, vaccine_code)
);

-- Índices recomendados para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_daily_logs_pet_date ON daily_logs(pet_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_events_pet_date ON clinical_events(pet_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_pain_assessments_pet_date ON pain_assessments(pet_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_pet_vaccines_pet ON pet_vaccines(pet_id);
CREATE INDEX IF NOT EXISTS idx_toxicity_category ON toxicity_directory(category);
