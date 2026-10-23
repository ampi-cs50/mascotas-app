import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { postgresDb } from '../db/postgres.js';
import { db } from '../db/repository.js';
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth.js';
import { User, Pet } from '../types/index.js';
import { validateEmailFull, validateEmailSyntax, checkDomainMx } from '../services/emailValidator.service.js';
import { mailerService } from '../services/mailer.service.js';

const router = Router();

// Helper para buscar usuario en Postgres con fallback al repositorio local
async function findUserByEmail(email: string): Promise<User | null> {
  try {
    return await postgresDb.findUserByEmail(email);
  } catch (err) {
    console.warn('Fallback a DB local para findUserByEmail', err);
    return db.findUserByEmail(email) || null;
  }
}

async function findUserById(id: string): Promise<User | null> {
  try {
    return await postgresDb.findUserById(id);
  } catch (err) {
    console.warn('Fallback a DB local para findUserById', err);
    return db.findUserById(id) || null;
  }
}

async function findUserByToken(token: string): Promise<User | null> {
  try {
    return await postgresDb.findUserByToken(token);
  } catch (err) {
    console.warn('Fallback a DB local para findUserByToken', err);
    return db.findUserByToken(token) || null;
  }
}

async function findUserByResetToken(token: string): Promise<User | null> {
  try {
    return await postgresDb.findUserByResetToken(token);
  } catch (err) {
    console.warn('Fallback a DB local para findUserByResetToken', err);
    return db.findUserByResetToken(token) || null;
  }
}

async function saveOrUpdateUser(user: User, isNew: boolean): Promise<User> {
  if (isNew) {
    try {
      return await postgresDb.createUser(user);
    } catch (e) {
      console.warn('Fallback a DB local para createUser', e);
      return db.createUser(user);
    }
  } else {
    try {
      const updated = await postgresDb.updateUser(user.id, user);
      if (updated) return updated;
    } catch (e) {
      console.warn('Fallback a DB local para updateUser', e);
    }
    const updatedLocal = db.updateUser(user.id, user);
    return updatedLocal || user;
  }
}

async function markUserVerified(userId: string): Promise<User | null> {
  try {
    return await postgresDb.verifyUser(userId);
  } catch (e) {
    console.warn('Fallback a DB local para verifyUser', e);
    return db.verifyUser(userId) || null;
  }
}

// ====================================================================
// 1. POST /api/v1/auth/validate-email
// Validación anticipada de sintaxis y registros MX para feedback inmediato en UI
// ====================================================================
router.post('/validate-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ valid: false, error: 'Correo electrónico requerido' });
    }

    const validation = await validateEmailFull(email);
    if (!validation.isValid) {
      return res.status(200).json({
        valid: false,
        error: validation.error,
        suggestion: validation.suggestion,
        domain: validation.domain
      });
    }

    // Verificar si ya existe una cuenta verificada
    const existing = await findUserByEmail(email);
    const isTaken = !!(existing && (existing.is_verified ?? true));

    return res.status(200).json({
      valid: true,
      domain: validation.domain,
      mxRecords: validation.mxRecords,
      suggestion: validation.suggestion,
      isTaken,
      warning: isTaken ? 'Ya existe una cuenta activa con este correo' : undefined
    });
  } catch (err: any) {
    console.error('Error en validate-email:', err);
    return res.status(500).json({ valid: false, error: 'Error al verificar correo' });
  }
});

// ====================================================================
// 2. POST /api/v1/auth/register
// Registro con validación de sintaxis, chequeo MX y envío obligatorio de código
// ====================================================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, petName, petSpecies, petWeight } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nombre, correo electrónico y contraseña son requeridos' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // A) Validación integral del correo: Sintaxis estricta + Registros MX
    const emailValidation = await validateEmailFull(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        error: emailValidation.error,
        suggestion: emailValidation.suggestion,
        domain: emailValidation.domain
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // B) Comprobar existencia previa de usuario
    const existing = await findUserByEmail(normalizedEmail);

    if (existing) {
      // Si el usuario ya está verificado, no se permite sobreescribir la cuenta
      if (existing.is_verified ?? true) {
        return res.status(409).json({
          error: 'Ya existe una cuenta verificada con este correo electrónico. Por favor inicia sesión.'
        });
      }
      // Si existe pero nunca fue verificado, actualizamos sus credenciales y generamos nuevo código
      console.log(`Re-intentando registro para usuario no verificado: ${normalizedEmail}`);
    }

    // C) Generación de código numérico de 6 dígitos y token de enlace directo
    const verificationCode = mailerService.generateVerificationCode();
    const verificationToken = mailerService.generateVerificationToken();
    const verificationExpiresAt = mailerService.getVerificationExpiration(15); // 15 minutos

    let targetUser: User;
    const isNew = !existing;

    if (existing) {
      targetUser = {
        ...existing,
        name: trimmedName,
        password_hash: bcrypt.hashSync(password, 10),
        is_verified: false,
        verification_code: verificationCode,
        verification_token: verificationToken,
        verification_expires_at: verificationExpiresAt.toISOString()
      };
    } else {
      targetUser = {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        password_hash: bcrypt.hashSync(password, 10),
        name: trimmedName,
        created_at: new Date().toISOString(),
        is_verified: false,
        verification_code: verificationCode,
        verification_token: verificationToken,
        verification_expires_at: verificationExpiresAt.toISOString()
      };
    }

    await saveOrUpdateUser(targetUser, isNew);

    // D) Si se ingresó mascota inicial, crearla asociada al usuario
    let createdPet: Pet | null = null;
    if (petName && petName.trim() !== '') {
      const species = petSpecies && petSpecies.toUpperCase() === 'DOG' ? 'DOG' : 'CAT';
      const parsedWeight = Number(petWeight);
      const safeWeight = (!isNaN(parsedWeight) && parsedWeight >= 0.1 && parsedWeight <= 150)
        ? Math.round(parsedWeight * 100) / 100
        : (species === 'CAT' ? 4.0 : 15.0);

      const newPet: Pet = {
        id: `pet-${Date.now()}`,
        user_id: targetUser.id,
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
        console.warn('Fallback a DB local para mascota inicial', e);
        createdPet = db.createPet(newPet);
      }
    }

    // E) Envío de correo de confirmación obligatorio
    const mailResult = await mailerService.sendVerificationEmail({
      toEmail: normalizedEmail,
      userName: trimmedName,
      code: verificationCode,
      token: verificationToken
    });

    // F) Responder solicitando la confirmación obligatoria (sin emitir JWT aún)
    return res.status(201).json({
      status: 'pending_verification',
      requiresVerification: true,
      message: 'Cuenta creada. Por razones de seguridad, ingresa el código de 6 dígitos enviado a tu correo para activar tu cuenta.',
      email: normalizedEmail,
      expiresInMinutes: 15
    });
  } catch (err: any) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error al registrar usuario', details: err?.message });
  }
});

// ====================================================================
// 3. POST /api/v1/auth/verify-code
// Confirmación de cuenta mediante código numérico de 6 dígitos
// ====================================================================
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Correo electrónico y código de verificación son requeridos' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'No se encontró ninguna cuenta asociada a este correo electrónico' });
    }

    if (user.is_verified) {
      // Si ya está verificado, generar sesión
      const token = generateToken(user.id);
      return res.json({
        message: 'Tu cuenta ya se encuentra verificada',
        token,
        user: { id: user.id, email: user.email, name: user.name }
      });
    }

    // Verificar si el código ha expirado
    if (user.verification_expires_at) {
      const expiresAt = new Date(user.verification_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return res.status(400).json({
          error: 'El código de verificación ha expirado (validez de 15 minutos). Por favor solicita uno nuevo.',
          codeExpired: true
        });
      }
    }

    // Verificar coincidencia de código
    if (!user.verification_code || user.verification_code !== cleanCode) {
      return res.status(400).json({
        error: 'El código ingresado es incorrecto. Por favor verifica e intenta nuevamente.'
      });
    }

    // Activar cuenta
    await markUserVerified(user.id);

    const token = generateToken(user.id);

    return res.json({
      message: '¡Cuenta verificada y activada con éxito! Ya puedes acceder a todas las funciones.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err: any) {
    console.error('Error en verify-code:', err);
    res.status(500).json({ error: 'Error al verificar código de confirmación', details: err?.message });
  }
});

// ====================================================================
// 4. POST /api/v1/auth/verify-token (y soporte GET directo)
// Confirmación de cuenta mediante enlace de un solo clic
// ====================================================================
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de confirmación requerido' });
    }

    const cleanToken = token.trim();
    const user = await findUserByToken(cleanToken);

    if (!user) {
      return res.status(400).json({
        error: 'El enlace de confirmación no es válido o ya fue utilizado anteriormente.'
      });
    }

    // Comprobar expiración
    if (user.verification_expires_at) {
      const expiresAt = new Date(user.verification_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return res.status(400).json({
          error: 'El enlace de confirmación ha expirado. Por favor solicita un nuevo código.',
          tokenExpired: true
        });
      }
    }

    // Activar usuario
    await markUserVerified(user.id);

    const authToken = generateToken(user.id);

    return res.json({
      message: '¡Correo electrónico verificado exitosamente mediante el enlace!',
      token: authToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err: any) {
    console.error('Error en verify-token:', err);
    res.status(500).json({ error: 'Error al verificar enlace de confirmación' });
  }
});

// ====================================================================
// 5. POST /api/v1/auth/resend-code
// Reenvío de código de confirmación
// ====================================================================
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es requerido' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({ error: 'No existe una cuenta registrada con este correo electrónico' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'Esta cuenta ya está confirmada y activa. Puedes iniciar sesión directamente.' });
    }

    // Validar que el dominio siga teniendo registros MX válidos
    const validation = await validateEmailFull(normalizedEmail);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Generar nuevo código y token
    const newCode = mailerService.generateVerificationCode();
    const newToken = mailerService.generateVerificationToken();
    const newExpiration = mailerService.getVerificationExpiration(15);

    const updatedUser: User = {
      ...user,
      verification_code: newCode,
      verification_token: newToken,
      verification_expires_at: newExpiration.toISOString()
    };

    await saveOrUpdateUser(updatedUser, false);

    const mailResult = await mailerService.sendVerificationEmail({
      toEmail: normalizedEmail,
      userName: user.name,
      code: newCode,
      token: newToken
    });

    return res.json({
      message: 'Se ha enviado un nuevo código de verificación a tu correo.',
      email: normalizedEmail
    });
  } catch (err: any) {
    console.error('Error en resend-code:', err);
    res.status(500).json({ error: 'Error al reenviar código de verificación' });
  }
});

// ====================================================================
// 6. POST /api/v1/auth/login
// Inicio de sesión con bloqueo estricto si el correo no está verificado
// ====================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const user = await findUserByEmail(email.trim());

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
    }

    // Comprobación de confirmación de cuenta
    if (user.is_verified === false) {
      return res.status(403).json({
        error: 'Tu cuenta aún no ha sido confirmada. Debes verificar tu correo electrónico para poder acceder.',
        requiresVerification: true,
        email: user.email
      });
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

// ====================================================================
// 7. POST /api/v1/auth/forgot-password
// Solicitar restablecimiento de contraseña vía correo electrónico
// ====================================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es requerido' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validar sintaxis y registros MX
    const emailValidation = await validateEmailFull(normalizedEmail);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        error: emailValidation.error,
        suggestion: emailValidation.suggestion
      });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({
        error: 'No se encontró ninguna cuenta asociada a este correo electrónico.'
      });
    }

    // Generar código numérico de 6 dígitos y token criptográfico de 64 caracteres
    const resetCode = mailerService.generateVerificationCode();
    const resetToken = mailerService.generateVerificationToken();
    const resetExpiresAt = mailerService.getVerificationExpiration(15); // 15 minutos

    const updatedUser: User = {
      ...user,
      reset_password_code: resetCode,
      reset_password_token: resetToken,
      reset_password_expires_at: resetExpiresAt.toISOString()
    };

    await saveOrUpdateUser(updatedUser, false);

    // Enviar correo con plantilla estilizada de recuperación
    await mailerService.sendPasswordResetEmail({
      toEmail: normalizedEmail,
      userName: user.name || 'Usuario',
      code: resetCode,
      token: resetToken
    });

    // Responder sin exponer el código o token en la respuesta
    return res.json({
      message: 'Te hemos enviado un correo con el código y enlace para restablecer tu contraseña.',
      email: normalizedEmail
    });
  } catch (err: any) {
    console.error('Error en forgot-password:', err);
    res.status(500).json({ error: 'Error al procesar la solicitud de recuperación', details: err?.message });
  }
});

// ====================================================================
// 8. POST /api/v1/auth/reset-password
// Restablecer contraseña mediante código de 6 dígitos o token directo
// ====================================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, token, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    let user: User | null = null;

    if (token && typeof token === 'string' && token.trim()) {
      user = await findUserByResetToken(token.trim());
    } else if (email && code) {
      const normalizedEmail = email.trim().toLowerCase();
      const candidate = await findUserByEmail(normalizedEmail);
      if (candidate && candidate.reset_password_code && candidate.reset_password_code.trim() === code.toString().trim()) {
        user = candidate;
      }
    }

    if (!user) {
      return res.status(400).json({
        error: 'El código o enlace de recuperación es inválido o ha caducado.'
      });
    }

    // Comprobar expiración
    if (user.reset_password_expires_at) {
      const expiresAt = new Date(user.reset_password_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return res.status(400).json({
          error: 'El código de recuperación ha expirado (validez de 15 minutos). Por favor solicita uno nuevo.',
          codeExpired: true
        });
      }
    }

    // Hashear la nueva contraseña y limpiar los tokens de recuperación
    const password_hash = bcrypt.hashSync(newPassword, 10);
    const updatedUser: User = {
      ...user,
      password_hash,
      is_verified: true, // Si el usuario comprobó su acceso al correo para resetear, queda validado
      reset_password_code: null,
      reset_password_token: null,
      reset_password_expires_at: null,
      verification_code: null,
      verification_token: null,
      verification_expires_at: null
    };

    await saveOrUpdateUser(updatedUser, false);

    return res.json({
      message: '¡Contraseña restablecida con éxito! Ya puedes iniciar sesión con tu nueva contraseña.'
    });
  } catch (err: any) {
    console.error('Error en reset-password:', err);
    res.status(500).json({ error: 'Error al restablecer la contraseña', details: err?.message });
  }
});

// ====================================================================
// 9. GET /api/v1/auth/dev-preview/:email
// Endpoint para consultar el último código enviado (modo desarrollo)
// ====================================================================
router.get('/dev-preview/:email', (req, res) => {
  const { email } = req.params;
  const last = mailerService.getLastEmail(email);
  if (!last) {
    return res.status(404).json({ error: 'No hay correos registrados para esta dirección' });
  }
  res.json({
    to: last.to,
    userName: last.userName,
    code: last.code,
    link: last.link,
    sentAt: last.sentAt,
    mode: last.mode
  });
});

// ====================================================================
// 8. GET /api/v1/auth/me
// Obtener perfil del usuario autenticado
// ====================================================================
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      is_verified: user.is_verified ?? true
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// ====================================================================
// 9. DELETE /api/v1/auth/me
// Eliminar cuenta de usuario y todos sus datos asociados
// ====================================================================
router.delete('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    try {
      await postgresDb.deleteUser(userId);
    } catch (e) {
      console.warn('Fallback a DB local para deleteUser', e);
    }
    db.deleteUser(userId);

    return res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (err: any) {
    console.error('Error al eliminar cuenta:', err);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});

export default router;
