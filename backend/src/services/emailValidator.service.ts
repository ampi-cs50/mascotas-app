import dns from 'dns';

// Conjunto de dominios desechables o temporales comunes
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'getairmail.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'burnermail.io'
]);

// Mapa de corrección de errores tipográficos frecuentes en dominios populares
const POPULAR_DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'oulook.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.es': 'yahoo.es',
  'iclud.com': 'icloud.com',
  'prtonmail.com': 'protonmail.com'
};

export interface EmailSyntaxValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  domain?: string;
  localPart?: string;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  domain?: string;
  mxRecords?: string[];
  syntaxOnly?: boolean;
}

/**
 * Validador estricto de sintaxis de correo electrónico acorde a RFC 5322.
 */
export function validateEmailSyntax(email: string): EmailSyntaxValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Debes proporcionar un correo electrónico.'
    };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'El correo electrónico no puede estar vacío.'
    };
  }

  if (trimmed.length > 254) {
    return {
      isValid: false,
      error: 'El correo electrónico es demasiado extenso (máximo 254 caracteres permitidos).'
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error: 'El correo electrónico no debe contener espacios en blanco.'
    };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'El correo debe contener exactamente un símbolo "@" separando usuario y dominio.'
    };
  }

  const [localPart, rawDomain] = parts;

  // Validación de la parte local (nombre de usuario)
  if (!localPart || localPart.length === 0) {
    return {
      isValid: false,
      error: 'El correo no contiene un nombre de usuario antes del "@".'
    };
  }

  if (localPart.length > 64) {
    return {
      isValid: false,
      error: 'La parte local del correo (antes de @) no puede superar los 64 caracteres.'
    };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'El nombre de usuario no puede iniciar ni terminar con un punto.'
    };
  }

  if (localPart.includes('..')) {
    return {
      isValid: false,
      error: 'El correo electrónico no puede contener puntos consecutivos.'
    };
  }

  // Caracteres válidos en parte local según RFC 5322 estándar
  const localPartRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  if (!localPartRegex.test(localPart)) {
    return {
      isValid: false,
      error: 'El nombre de usuario contiene caracteres especiales no permitidos.'
    };
  }

  // Validación del dominio
  const domain = rawDomain.toLowerCase();
  if (!domain || domain.length === 0) {
    return {
      isValid: false,
      error: 'Falta especificar el dominio del correo después del "@".'
    };
  }

  if (domain.length > 253) {
    return {
      isValid: false,
      error: 'El dominio del correo supera la longitud máxima permitida (253 caracteres).'
    };
  }

  if (!domain.includes('.')) {
    return {
      isValid: false,
      error: 'El dominio debe contener una extensión válida (ejemplo: .com, .org, .es).'
    };
  }

  if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
    return {
      isValid: false,
      error: 'El dominio no puede iniciar ni terminar con un punto o guión.'
    };
  }

  if (domain.includes('..')) {
    return {
      isValid: false,
      error: 'El dominio no puede contener puntos consecutivos.'
    };
  }

  // Separar etiquetas del dominio (ej: ["gmail", "com"])
  const domainLabels = domain.split('.');
  const tld = domainLabels[domainLabels.length - 1];

  // El TLD debe tener al menos 2 letras y solo contener caracteres alfabéticos
  if (!/^[a-zA-Z]{2,63}$/.test(tld)) {
    return {
      isValid: false,
      error: `La extensión del dominio ".${tld}" no es válida. Debe contener solo letras (ej: .com, .es, .org).`
    };
  }

  for (const label of domainLabels) {
    if (label.length === 0 || label.length > 63) {
      return {
        isValid: false,
        error: 'Las partes del dominio deben tener entre 1 y 63 caracteres.'
      };
    }
    if (!/^[a-zA-Z0-9-]+$/.test(label)) {
      return {
        isValid: false,
        error: 'El dominio contiene caracteres no válidos. Solo se admiten letras, números y guiones.'
      };
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return {
        isValid: false,
        error: 'Las etiquetas del dominio no pueden empezar ni terminar con guión.'
      };
    }
  }

  // Verificar si es un dominio temporal/desechable
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'No se admiten correos electrónicos temporales o desechables. Por favor utiliza una dirección permanente.'
    };
  }

  // Sugerencia de corrección por error tipográfico
  let suggestion: string | undefined;
  if (POPULAR_DOMAIN_TYPOS[domain]) {
    const correctedDomain = POPULAR_DOMAIN_TYPOS[domain];
    suggestion = `${localPart}@${correctedDomain}`;
  }

  return {
    isValid: true,
    domain,
    localPart,
    suggestion
  };
}

/**
 * Consulta y valida los registros MX (Mail Exchange) del dominio mediante DNS.
 * Comprueba que el dominio realmente cuente con servidores de correo habilitados.
 */
export async function checkDomainMx(domain: string, timeoutMs: number = 4000): Promise<{
  hasMx: boolean;
  mxRecords: string[];
  error?: string;
}> {
  // Dominio de prueba interno de la app (seed demo data)
  if (domain.toLowerCase() === 'mascotas.care' || domain.toLowerCase() === 'localhost') {
    return {
      hasMx: true,
      mxRecords: ['mail.mascotas.care (Dominio de Demostración Local)']
    };
  }

  const resolveMxPromise = dns.promises.resolveMx(domain);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const err: any = new Error('DNS_TIMEOUT');
      err.code = 'ETIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  try {
    const records = await Promise.race([resolveMxPromise, timeoutPromise]);

    if (!records || records.length === 0) {
      // Intentar comprobar si al menos existe registro A (RFC 5321 Fallback)
      try {
        const aRecords = await dns.promises.resolve4(domain);
        if (aRecords && aRecords.length > 0) {
          return {
            hasMx: true,
            mxRecords: [`A-Record Fallback: ${aRecords[0]}`]
          };
        }
      } catch {
        // Fallback falló también
      }

      return {
        hasMx: false,
        mxRecords: [],
        error: `El dominio "@${domain}" no cuenta con servidores de intercambio de correo (registros MX).`
      };
    }

    // Ordenar por prioridad (menor prioridad = preferido)
    const sorted = records
      .filter(r => r && r.exchange && r.exchange.trim().length > 0)
      .sort((a, b) => a.priority - b.priority);

    if (sorted.length === 0) {
      return {
        hasMx: false,
        mxRecords: [],
        error: `El dominio "@${domain}" devolvió registros MX vacíos o sin servidor válido.`
      };
    }

    return {
      hasMx: true,
      mxRecords: sorted.map(r => r.exchange)
    };
  } catch (err: any) {
    const code = err.code || err.message;

    if (code === 'ENOTFOUND' || code === 'NXDOMAIN' || code === 'ENOENT') {
      return {
        hasMx: false,
        mxRecords: [],
        error: `El dominio "@${domain}" no existe o no se encuentra registrado en los servidores DNS.`
      };
    }

    if (code === 'ENODATA') {
      return {
        hasMx: false,
        mxRecords: [],
        error: `El dominio "@${domain}" existe pero no tiene ningún registro MX configurado para recibir correos.`
      };
    }

    if (code === 'ETIMEOUT') {
      // Si hay timeout de DNS, verificar si al menos resuelve dirección IP A
      try {
        const aRecords = await dns.promises.resolve4(domain);
        if (aRecords && aRecords.length > 0) {
          return {
            hasMx: true,
            mxRecords: [`Fallback IP: ${aRecords[0]}`]
          };
        }
      } catch {
        // Continuar con error de tiempo de espera
      }

      return {
        hasMx: false,
        mxRecords: [],
        error: `Tiempo de espera agotado al consultar los servidores de correo de "@${domain}". Verifica tu conexión o intenta más tarde.`
      };
    }

    return {
      hasMx: false,
      mxRecords: [],
      error: `Error al validar los registros de correo del dominio "@${domain}": ${err.message || code}`
    };
  }
}

/**
 * Validación integral de correo: Sintaxis + Registros MX.
 */
export async function validateEmailFull(email: string): Promise<EmailValidationResult> {
  // 1. Validación de Sintaxis
  const syntax = validateEmailSyntax(email);
  if (!syntax.isValid) {
    return {
      isValid: false,
      error: syntax.error,
      suggestion: syntax.suggestion
    };
  }

  const domain = syntax.domain!;

  // 2. Validación de Registros MX
  const mxCheck = await checkDomainMx(domain);
  if (!mxCheck.hasMx) {
    return {
      isValid: false,
      error: mxCheck.error || `El dominio "@${domain}" no puede recibir correos electrónicos.`,
      suggestion: syntax.suggestion,
      domain
    };
  }

  return {
    isValid: true,
    domain,
    mxRecords: mxCheck.mxRecords,
    suggestion: syntax.suggestion
  };
}
