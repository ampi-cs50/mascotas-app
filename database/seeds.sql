-- ====================================================================
-- Datos Iniciales / Semilla (Seed Data)
-- App de Cuidado Preventivo para Mascotas
-- ====================================================================

-- 1. Usuario Demo (password: demo123, hash bcrypt $2a$10$wKxN74b6...)
INSERT INTO users (id, email, password_hash, name, created_at)
VALUES 
('usr-001', 'demo@mascotas.care', '$2a$10$X7vQvh0N0K9d1r0.mG31..tFw2Lq5I63K1gZkQeM1kP1x5O6VzXKi', 'Amparo Rodríguez', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Mascotas
INSERT INTO pets (id, user_id, name, species, sex, is_neutered, neutered_date, birth_date, weight_kg, avatar_url)
VALUES 
('pet-cat-01', 'usr-001', 'Luna', 'CAT', 'FEMALE', TRUE, '2022-10-10', '2022-04-15', 3.85, 'assets/cat-avatar.svg'),
('pet-dog-02', 'usr-001', 'Chester', 'DOG', 'MALE', TRUE, '2022-03-15', '2021-08-10', 26.50, 'assets/dog-avatar.svg')
ON CONFLICT (id) DO NOTHING;

-- 3. Directorio de Toxicidad (NUEVO)
INSERT INTO toxicity_directory (id, name, category, danger_level, symptoms, action_required, target_species)
VALUES 
('tox-01', 'Lirio (Lilium)', 'PLANT', 'FATAL', 'Vómitos, sialorrea, letargo extremo, anuria y fallo renal agudo en 24-72h.', 'Acudir a urgencias veterinarias de inmediato. Muy tóxico para gatos incluso en pequeñas cantidades de polen o agua de florero.', 'CAT'),
('tox-02', 'Chocolate (Teobromina)', 'FOOD', 'SEVERE', 'Vómitos, diarrea, sed excesiva, jadeo continuo, hiperactividad, arritmia cardíaca y convulsiones.', 'Urgencia veterinaria. No inducir el vómito si ya pasaron más de 2h o si el animal está desorientado.', 'ALL'),
('tox-03', 'Ibuprofeno / Medicamentos AINEs', 'MEDICATION', 'FATAL', 'Úlceras gástricas, vómito con sangre, heces oscuras, insuficiencia renal aguda y shock.', 'Acudir a urgencias de inmediato. Llevar la caja del medicamento para calcular la dosis tóxica.', 'ALL'),
('tox-04', 'Uvas y Pasas', 'FOOD', 'SEVERE', 'Vómito dentro de las primeras horas, diarrea, letargo severo, deshidratación y daño renal.', 'Contactar a clínica de inmediato para lavado gástrico y fluidoterapia intravenosa preventiva.', 'DOG'),
('tox-05', 'Paracetamol (Acetaminofén)', 'MEDICATION', 'FATAL', 'Methemoglobinemia, mucosas cianóticas (azuladas), hipotermia, hinchazón facial y daño hepático fulminante.', 'Urgencia veterinaria máxima. Los gatos carecen de la enzima glucuronil-transferasa.', 'ALL'),
('tox-06', 'Cuerpo Extraño Lineal (Hilo, Lana, Hilo dental)', 'OBJECT', 'SEVERE', 'Vómitos repetitivos, dolor abdominal agudo, decaimiento, postura encorvada.', 'NO tirar del hilo visible bajo la lengua o en el ano; puede seccionar el intestino. Ir a urgencias.', 'CAT'),
('tox-07', 'Lavandina / Cloro', 'CHEMICAL', 'SEVERE', 'Quemaduras químicas en mucosa oral y esófago, salivación profusa, vómito espumoso.', 'NO provocar el vómito para no quemar el esófago nuevamente. Enjuagar la boca con agua fresca y acudir a urgencias.', 'ALL'),
('tox-08', 'Cebolla, Ajo y Puerro', 'FOOD', 'MODERATE', 'Anemia hemolítica (daño oxidativo a glóbulos rojos), debilidad, encías pálidas, taquipnea.', 'Consultar con veterinario; requiere monitoreo de hematocrito.', 'ALL'),
('tox-09', 'Monstera / Costilla de Adán', 'PLANT', 'MODERATE', 'Irritación oral intensa por oxalatos de calcio insolubles, salivación, dificultad para tragar.', 'Limpiar la boca con agua o leche para disolver cristales. Si persiste inflamación, acudir a clínica.', 'ALL'),
('tox-10', 'Poinsettia / Flor de Pascua', 'PLANT', 'MILD', 'Salivación leve, irritación de piel y encías, náusea transitoria.', 'Lavar boca y pelaje expuesto con agua. Monitorear síntomas en el hogar.', 'ALL')
ON CONFLICT (id) DO NOTHING;

-- 4. Eventos Clínicos Preventivos
INSERT INTO clinical_events (id, pet_id, event_type, event_date, title, notes)
VALUES 
('ev-01', 'pet-cat-01', 'VACCINE', '2026-03-10', 'Vacuna Triple Felina (Refuerzo)', 'Vacuna anual administrada sin reacciones adversas.'),
('ev-02', 'pet-cat-01', 'DEWORMING', '2026-05-15', 'Desparasitación Interna (Praziquantel)', 'Comprimido palatable tolerado favorablemente.'),
('ev-03', 'pet-dog-02', 'VACCINE', '2026-02-20', 'Vacuna Séxtuple Canina y Antirrábica', 'Control de peso ok (26.5kg).'),
('ev-04', 'pet-dog-02', 'CHECKUP', '2026-07-01', 'Chequeo Preventivo Semestral', 'Dientes limpios, articulaciones en óptimo estado.')
ON CONFLICT (id) DO NOTHING;

-- 5. Bitácora Diaria (Últimos días para Luna)
INSERT INTO daily_logs (id, pet_id, log_date, water_intake, food_intake, litter_urine, energy_mood, notes)
VALUES 
('log-01', 'pet-cat-01', '2026-10-09', 'NORMAL', 'NORMAL', 'NORMAL', 'PLAYFUL', 'Jugó con la pelota de lana sintética y comió su porción completa.'),
('log-02', 'pet-cat-01', '2026-10-10', 'NORMAL', 'NORMAL', 'NORMAL', 'ACTIVE', 'Día tranquilo con buen apetito.'),
('log-03', 'pet-cat-01', '2026-10-11', 'HIGH', 'NORMAL', 'EXCESSIVE', 'CALM', 'Bebió más agua de lo habitual por día templado.'),
('log-04', 'pet-cat-01', '2026-10-12', 'NORMAL', 'LOW', 'NORMAL', 'LETHARGIC', 'Comió la mitad del plato. Se observa algo más remolona.'),
('log-05', 'pet-cat-01', '2026-10-13', 'NORMAL', 'NORMAL', 'NORMAL', 'ACTIVE', 'Recuperó energía habitual tras cepillado matutino.'),
('log-06', 'pet-cat-01', '2026-10-14', 'NORMAL', 'NORMAL', 'NORMAL', 'PLAYFUL', 'Muy activa, ronronea y pide alimento.')
ON CONFLICT (id) DO NOTHING;

-- 6. Evaluación de Dolor Facial (Feline Grimace Scale)
INSERT INTO pain_assessments (id, pet_id, assessment_date, score, ears_score, eyes_score, muzzle_score, notes)
VALUES 
('pain-01', 'pet-cat-01', '2026-10-12 18:30:00', 1, 1, 0, 0, 'Orejas ligeramente rotadas por ruido exterior; ojos y hocico relajados.')
ON CONFLICT (id) DO NOTHING;

-- 7. Cartilla y Chequeo de Vacunación Preventiva
INSERT INTO pet_vaccines (id, pet_id, vaccine_code, name, category, applied, applied_date, notes)
VALUES 
('vax-luna-01', 'pet-cat-01', 'fel-core-triple', 'Triple Felina (FVRCP)', 'CORE', TRUE, '2026-03-10', 'Protege contra Panleucopenia, Rinotraqueítis y Calicivirus. Esencial aún en departamentos.'),
('vax-luna-02', 'pet-cat-01', 'fel-mandatory-rabies', 'Antirrábica Felina', 'MANDATORY', TRUE, '2025-11-20', 'Obligatoria por normativa de salud pública.'),
('vax-luna-03', 'pet-cat-01', 'fel-lifestyle-felv', 'Leucemia Felina (FeLV)', 'LIFESTYLE', FALSE, NULL, 'Opcional si vive 100% en interior sin contacto con gatos externos.'),
('vax-luna-04', 'pet-cat-01', 'fel-opt-chlamydia', 'Clamidiosis Felina', 'LIFESTYLE', FALSE, NULL, 'Opcional según riesgo de conjuntivitis y hacinamiento.'),

('vax-chester-01', 'pet-dog-02', 'can-core-multiple', 'Polivalente Canina (Séxtuple)', 'CORE', TRUE, '2026-02-20', 'Protege contra Moquillo, Parvovirus, Hepatitis y Parainfluenza canina.'),
('vax-chester-02', 'pet-dog-02', 'can-mandatory-rabies', 'Antirrábica Canina', 'MANDATORY', TRUE, '2026-02-20', 'Obligatoria anualmente por salud pública.'),
('vax-chester-03', 'pet-dog-02', 'can-core-lepto', 'Leptospirosis Canina', 'CORE', TRUE, '2026-02-20', 'Protege contra bacteria Leptospira.'),
('vax-chester-04', 'pet-dog-02', 'can-lifestyle-bordetella', 'Tos de las Perreras (Bordetella)', 'LIFESTYLE', FALSE, NULL, 'Opcional según estilo de vida (guarderías, peluquerías caninas).'),
('vax-chester-05', 'pet-dog-02', 'can-opt-giardia', 'Giardia Canina', 'LIFESTYLE', FALSE, NULL, 'Opcional en zonas húmedas o aguas estancadas.')
ON CONFLICT (pet_id, vaccine_code) DO NOTHING;

