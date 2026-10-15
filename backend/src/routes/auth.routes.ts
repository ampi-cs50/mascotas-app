import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { postgresDb } from '../db/postgres.js';
import { db } from '../db/repository.js';
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth.js';
import { User, Pet } from '../types/index.js';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, petName, petSpecies, petWeight } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Check existing user in Postgres
    let existing: User | null | undefined = null;
    try {
      existing = await postgresDb.findUserByEmail(email);
    } catch {
      existing = db.findUserByEmail(email);
    }

    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo electrónico' });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: email.trim().toLowerCase(),
      password_hash: bcrypt.hashSync(password, 10),
      name: name.trim(),
      created_at: new Date().toISOString()
    };

    try {
      await postgresDb.createUser(newUser);
    } catch (e) {
      console.warn('Fallback to local db on register', e);
      db.createUser(newUser);
    }

    let createdPet: Pet | null = null;
    // Si el usuario ingresó una mascota durante el registro, crearla inmediatamente
    if (petName && petName.trim() !== '') {
      const species = petSpecies && petSpecies.toUpperCase() === 'DOG' ? 'DOG' : 'CAT';
      const parsedWeight = Number(petWeight);
      const safeWeight = (!isNaN(parsedWeight) && parsedWeight >= 0.1 && parsedWeight <= 150)
        ? Math.round(parsedWeight * 100) / 100
        : (species === 'CAT' ? 4.0 : 15.0);

      const newPet: Pet = {
        id: `pet-${Date.now()}`,
        user_id: newUser.id,
        name: petName.trim().slice(0, 50),
        species,
        birth_date: new Date().toISOString().split('T')[0],
        weight_kg: safeWeight,
        avatar_url: species === 'DOG'
          ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80'
      };

      try {
        createdPet = await postgresDb.createPet(newPet);
      } catch (e) {
        console.warn('Fallback to local db for initial pet', e);
        createdPet = db.createPet(newPet);
      }
    }

    const token = generateToken(newUser.id);

    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      pet: createdPet
    });
  } catch (err: any) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error al registrar usuario', details: err?.message });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    let user: User | null | undefined = null;
    try {
      user = await postgresDb.findUserByEmail(email);
    } catch {
      user = db.findUserByEmail(email);
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
    }

    const token = generateToken(user.id);
    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err: any) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión', details: err?.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    let user: User | null | undefined = null;
    try {
      user = await postgresDb.findUserById(userId);
    } catch {
      user = db.findUserById(userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

export default router;
