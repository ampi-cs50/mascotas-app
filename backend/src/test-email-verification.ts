import { validateEmailFull, validateEmailSyntax, checkDomainMx } from './services/emailValidator.service.js';
import { mailerService } from './services/mailer.service.js';

async function runTests() {
  console.log('🧪 Iniciando batería de pruebas de validación de correo...\n');

  // 1. Pruebas de Sintaxis
  console.log('--- 1. Pruebas de Sintaxis (RFC 5322) ---');
  const syntaxCases = [
    { email: '', expectedValid: false, label: 'Vacío' },
    { email: 'sin-arroba.com', expectedValid: false, label: 'Sin arroba' },
    { email: 'usuario@', expectedValid: false, label: 'Sin dominio' },
    { email: '@dominio.com', expectedValid: false, label: 'Sin usuario' },
    { email: 'usuario..doble@gmail.com', expectedValid: false, label: 'Puntos consecutivos' },
    { email: '.usuario@gmail.com', expectedValid: false, label: 'Punto al inicio' },
    { email: 'usuario@dominio', expectedValid: false, label: 'Dominio sin TLD' },
    { email: 'usuario@dominio.c', expectedValid: false, label: 'TLD de 1 letra' },
    { email: 'usuario@mailinator.com', expectedValid: false, label: 'Dominio desechable' },
    { email: 'usuario@gmial.com', expectedValid: true, hasSuggestion: true, label: 'Typo detectado (gmial)' },
    { email: 'valido.seguro_123@gmail.com', expectedValid: true, label: 'Sintaxis válida' }
  ];

  for (const tc of syntaxCases) {
    const res = validateEmailSyntax(tc.email);
    const pass = res.isValid === tc.expectedValid;
    console.log(`${pass ? '✅' : '❌'} ${tc.label} (${tc.email || '<vacío>'}): isValid=${res.isValid} | error="${res.error || ''}" | suggestion="${res.suggestion || ''}"`);
    if (!pass) throw new Error(`Fallo en prueba de sintaxis: ${tc.label}`);
  }

  // 2. Pruebas de Registros MX
  console.log('\n--- 2. Pruebas de Registros MX (DNS) ---');
  const mxCases = [
    { domain: 'c.com', expectedHasMx: false, label: 'c.com (sin MX/inexistente)' },
    { domain: 'inexistente-dominio-xyz-12345.com', expectedHasMx: false, label: 'Dominio inexistente' },
    { domain: 'mascotas.care', expectedHasMx: true, label: 'mascotas.care (Demo bypass)' },
    { domain: 'gmail.com', expectedHasMx: true, label: 'gmail.com (Servidores de Google)' },
    { domain: 'outlook.com', expectedHasMx: true, label: 'outlook.com (Servidores de Microsoft)' }
  ];

  for (const tc of mxCases) {
    const res = await checkDomainMx(tc.domain);
    const pass = res.hasMx === tc.expectedHasMx;
    console.log(`${pass ? '✅' : '❌'} ${tc.label}: hasMx=${res.hasMx} | mxCount=${res.mxRecords.length} | error="${res.error || ''}"`);
    if (!pass) throw new Error(`Fallo en prueba de MX: ${tc.label}`);
  }

  // 3. Prueba Integral (Sintaxis + MX)
  console.log('\n--- 3. Pruebas Integrales ---');
  const fullCases = [
    { email: 'juli@c.com', expectedValid: false, label: 'juli@c.com (caso reportado por usuario)' },
    { email: 'usuario@tempmail.com', expectedValid: false, label: 'Correo desechable tempmail' },
    { email: 'demo@mascotas.care', expectedValid: true, label: 'demo@mascotas.care' },
    { email: 'contacto@gmail.com', expectedValid: true, label: 'contacto@gmail.com' }
  ];

  for (const tc of fullCases) {
    const res = await validateEmailFull(tc.email);
    const pass = res.isValid === tc.expectedValid;
    console.log(`${pass ? '✅' : '❌'} ${tc.label}: isValid=${res.isValid} | error="${res.error || ''}"`);
    if (!pass) throw new Error(`Fallo en prueba integral: ${tc.label}`);
  }

  // 4. Prueba del Mailer (Generación de código y plantilla)
  console.log('\n--- 4. Prueba de Generación y Envío de Correo ---');
  const code = mailerService.generateVerificationCode();
  const token = mailerService.generateVerificationToken();
  const expiration = mailerService.getVerificationExpiration();

  console.log(`Código generado: ${code} (longitud: ${code.length}, numérico: ${/^\d{6}$/.test(code)})`);
  console.log(`Token generado: ${token.slice(0, 16)}... (longitud: ${token.length})`);
  console.log(`Expira en: ${expiration.toISOString()}`);

  if (!/^\d{6}$/.test(code)) throw new Error('El código debe ser de 6 dígitos numéricos');
  if (token.length !== 64) throw new Error('El token debe tener 64 caracteres');

  const sendRes = await mailerService.sendVerificationEmail({
    toEmail: 'test@gmail.com',
    userName: 'Tester Usuario',
    code,
    token
  });

  console.log(`Resultado de envío: success=${sendRes.success}, mode=${sendRes.mode}, link=${sendRes.link}`);

  const lastEmail = mailerService.getLastEmail('test@gmail.com');
  if (!lastEmail || lastEmail.code !== code) {
    throw new Error('No se pudo recuperar el correo enviado del historial');
  }
  console.log('✅ Historial de correos verificado correctamente.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS UNITARIAS Y DE INTEGRACIÓN PASARON EXITOSAMENTE!');
}

runTests().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
