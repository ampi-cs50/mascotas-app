import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface SentEmailRecord {
  to: string;
  userName: string;
  code: string;
  token: string;
  link: string;
  sentAt: string;
  subject: string;
  mode: 'smtp' | 'simulated';
}

export class MailerService {
  private transporter: Transporter | null = null;
  private sentEmailsHistory: SentEmailRecord[] = [];
  private readonly appUrl: string;

  constructor() {
    this.appUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    this.initTransporter();
  }

  private initTransporter() {
    const service = process.env.SMTP_SERVICE;
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if ((service || host) && user && pass) {
      try {
        const transportConfig: any = service
          ? { service, auth: { user, pass } }
          : { host, port, secure, auth: { user, pass } };

        this.transporter = nodemailer.createTransport(transportConfig);
        console.log(`📧 Mailer configurado con servidor SMTP: ${service || `${host}:${port}`}`);

        // Verificar la conexión de forma asíncrona
        this.transporter.verify((err) => {
          if (err) {
            console.warn('⚠️ Advertencia: Error conectando con el servidor SMTP:', err.message);
          } else {
            console.log('✅ Servidor SMTP listo para enviar correos reales');
          }
        });
      } catch (err: any) {
        console.warn('⚠️ No se pudo inicializar transporte SMTP, usando modo simulado/local:', err.message);
        this.transporter = null;
      }
    } else {
      console.log('📬 Modo Desarrollo: Sin credenciales SMTP en .env. Los correos se registrarán en consola y memoria para pruebas inmediatas.');
    }
  }

  /**
   * Genera un código numérico seguro de 6 dígitos.
   */
  public generateVerificationCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Genera un token aleatorio seguro de 64 caracteres hexadecimales para enlaces directos.
   */
  public generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Retorna fecha de expiración para el código (15 minutos a partir de ahora).
   */
  public getVerificationExpiration(minutes: number = 15): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * Envia el correo con código y enlace de verificación.
   */
  public async sendVerificationEmail(params: {
    toEmail: string;
    userName: string;
    code: string;
    token: string;
  }): Promise<{ success: boolean; mode: 'smtp' | 'simulated'; link: string }> {
    const { toEmail, userName, code, token } = params;
    const verificationLink = `${this.appUrl}/auth?token=${token}&email=${encodeURIComponent(toEmail)}`;

    const subject = '🐾 Confirma tu cuenta en Cuidado Preventivo para Mascotas';

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9f6; margin: 0; padding: 24px; color: #2d3a2f; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e1e7df; overflow: hidden; box-shadow: 0 4px 20px rgba(45, 58, 47, 0.08); }
    .header { background: #2d3a2f; color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 8px 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .badge { display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 17px; font-weight: 700; margin-bottom: 12px; }
    .text { font-size: 14.5px; line-height: 1.6; color: #4b584d; margin-bottom: 24px; }
    .code-card { background: #f0f7f2; border: 2px dashed #40916c; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .code-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #2d6a4f; margin-bottom: 8px; }
    .code-digits { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1b4332; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .action-btn { display: inline-block; background-color: #2d6a4f; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(45, 106, 79, 0.3); }
    .footer { background: #fafbf9; padding: 20px 28px; border-top: 1px solid #edf1eb; font-size: 12px; color: #78857a; text-align: center; line-height: 1.5; }
    .footer-warning { margin-top: 8px; color: #9c361c; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">🐾 Cuidado Preventivo</span>
      <h1>Verificación de Cuenta</h1>
    </div>
    <div class="content">
      <div class="greeting">¡Hola, ${userName}!</div>
      <p class="text">
        Gracias por registrarte para cuidar proactivamente la salud y bienestar de tu mascota. 
        Para garantizar la seguridad y autenticidad de tu correo electrónico, ingresa el siguiente código de confirmación:
      </p>

      <div class="code-card">
        <div class="code-title">Tu código de confirmación obligatorio:</div>
        <div class="code-digits">${code}</div>
      </div>

      <p class="text" style="text-align: center; margin-bottom: 12px;">
        O si prefieres, confirma tu cuenta directamente haciendo clic en el siguiente botón:
      </p>

      <div class="btn-wrap">
        <a href="${verificationLink}" target="_blank" class="action-btn">Confirmar y Activar mi Cuenta →</a>
      </div>

      <p class="text" style="font-size: 13px; color: #6e7d70; text-align: center;">
        Este código y enlace son válidos durante <strong>15 minutos</strong>.
      </p>
    </div>
    <div class="footer">
      <p>Has recibido este correo porque se solicitó un registro con la dirección <strong>${toEmail}</strong>.</p>
      <p class="footer-warning">Si no fuiste tú quien solicitó este registro, puedes desestimar este mensaje; ninguna cuenta será activada sin verificación.</p>
    </div>
  </div>
</body>
</html>
`;

    const textContent = `
🐾 Cuidado Preventivo para Mascotas - Verificación de Cuenta

¡Hola, ${userName}!

Tu código de verificación obligatorio para confirmar tu correo es:
[ ${code} ]

Válido durante 15 minutos.

O también puedes confirmar tu cuenta directamente ingresando al siguiente enlace:
${verificationLink}

Si no fuiste tú quien solicitó el registro con ${toEmail}, ignora este mensaje.
`;

    let mode: 'smtp' | 'simulated' = 'simulated';

    if (this.transporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || '"Mascotas Care" <no-reply@mascotas.care>';
        await this.transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent
        });
        mode = 'smtp';
        console.log(`✅ Correo de verificación enviado exitosamente vía SMTP a ${toEmail}`);
      } catch (smtpErr) {
        console.warn(`⚠️ Error al enviar correo vía SMTP a ${toEmail}, registrando en modo simulado:`, smtpErr);
      }
    }

    // Guardar en historial en memoria para pruebas y auditoría
    const record: SentEmailRecord = {
      to: toEmail,
      userName,
      code,
      token,
      link: verificationLink,
      sentAt: new Date().toISOString(),
      subject,
      mode
    };
    this.sentEmailsHistory.unshift(record);
    if (this.sentEmailsHistory.length > 50) {
      this.sentEmailsHistory.pop();
    }

    // Registrar en consola de manera visualmente destacada para desarrollo
    console.log('\n============================================================');
    console.log(`✉️  CORREO DE VERIFICACIÓN ENVIADO [${mode.toUpperCase()}]`);
    console.log(`Para: ${userName} <${toEmail}>`);
    console.log(`CÓDIGO: [ ${code} ]`);
    console.log(`ENLACE DIRECTO: ${verificationLink}`);
    console.log('============================================================\n');

    return { success: true, mode, link: verificationLink };
  }

  /**
   * Envia el correo con código y enlace para restablecer la contraseña.
   */
  public async sendPasswordResetEmail(params: {
    toEmail: string;
    userName: string;
    code: string;
    token: string;
  }): Promise<{ success: boolean; mode: 'smtp' | 'simulated'; link: string }> {
    const { toEmail, userName, code, token } = params;
    const resetLink = `${this.appUrl}/login?reset_token=${token}&email=${encodeURIComponent(toEmail)}`;

    const subject = '🔐 Recuperación de Contraseña - Cuidado Preventivo para Mascotas';

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9f6; margin: 0; padding: 24px; color: #2d3a2f; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e1e7df; overflow: hidden; box-shadow: 0 4px 20px rgba(45, 58, 47, 0.08); }
    .header { background: #2d3a2f; color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 8px 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .badge { display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 17px; font-weight: 700; margin-bottom: 12px; }
    .text { font-size: 14.5px; line-height: 1.6; color: #4b584d; margin-bottom: 24px; }
    .code-card { background: #fff8f5; border: 2px dashed #e07a5f; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .code-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #c44e33; margin-bottom: 8px; }
    .code-digits { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #9c361c; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .action-btn { display: inline-block; background-color: #e07a5f; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(224, 122, 95, 0.3); }
    .footer { background: #fafbf9; padding: 20px 28px; border-top: 1px solid #edf1eb; font-size: 12px; color: #78857a; text-align: center; line-height: 1.5; }
    .footer-warning { margin-top: 8px; color: #9c361c; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">🐾 Mascotas Care</span>
      <h1>Recuperación de Contraseña</h1>
    </div>
    <div class="content">
      <div class="greeting">¡Hola, ${userName}!</div>
      <p class="text">
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Cuidado Preventivo para Mascotas.
      </p>

      <div class="code-card">
        <div class="code-title">Tu código de recuperación:</div>
        <div class="code-digits">${code}</div>
      </div>

      <p class="text" style="text-align: center; margin-bottom: 12px;">
        O si prefieres, haz clic en el siguiente botón para cambiar tu contraseña directamente:
      </p>

      <div class="btn-wrap">
        <a href="${resetLink}" target="_blank" class="action-btn">Restablecer mi Contraseña →</a>
      </div>

      <p class="text" style="font-size: 13px; color: #6e7d70; text-align: center;">
        Este código y enlace son válidos durante <strong>15 minutos</strong>.
      </p>
    </div>
    <div class="footer">
      <p>Has recibido este correo porque se solicitó restablecer la contraseña de <strong>${toEmail}</strong>.</p>
      <p class="footer-warning">Si tú no solicitaste este cambio, puedes desestimar este mensaje de forma segura; tu contraseña actual no ha sido modificada.</p>
    </div>
  </div>
</body>
</html>
`;

    const textContent = `
🐾 Cuidado Preventivo para Mascotas - Recuperación de Contraseña

¡Hola, ${userName}!

Hemos recibido una solicitud para cambiar tu contraseña. Tu código de 6 dígitos es:
[ ${code} ]

Válido durante 15 minutos.

O puedes restablecerla directamente ingresando a este enlace:
${resetLink}

Si no fuiste tú quien solicitó este cambio, ignora este mensaje.
`;

    let mode: 'smtp' | 'simulated' = 'simulated';

    if (this.transporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || '"Mascotas Care" <no-reply@mascotas.care>';
        await this.transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent
        });
        mode = 'smtp';
        console.log(`✅ Correo de recuperación de contraseña enviado vía SMTP a ${toEmail}`);
      } catch (smtpErr) {
        console.warn(`⚠️ Error al enviar correo de recuperación vía SMTP a ${toEmail}, registrando en modo simulado:`, smtpErr);
      }
    }

    const record: SentEmailRecord = {
      to: toEmail,
      userName,
      code,
      token,
      link: resetLink,
      sentAt: new Date().toISOString(),
      subject,
      mode
    };
    this.sentEmailsHistory.unshift(record);

    console.log('\n============================================================');
    console.log(`🔐 CORREO DE RECUPERACIÓN DE CONTRASEÑA [${mode.toUpperCase()}]`);
    console.log(`Para: ${userName} <${toEmail}>`);
    console.log(`CÓDIGO: [ ${code} ]`);
    console.log(`ENLACE DIRECTO: ${resetLink}`);
    console.log('============================================================\n');

    return { success: true, mode, link: resetLink };
  }

  /**
   * Obtiene el último correo enviado a una dirección dada (útil para pruebas y modo dev).
   */
  public getLastEmail(email?: string): SentEmailRecord | undefined {
    if (!email) {
      return this.sentEmailsHistory[0];
    }
    return this.sentEmailsHistory.find(e => e.to.toLowerCase() === email.toLowerCase());
  }

  public getHistory(): SentEmailRecord[] {
    return [...this.sentEmailsHistory];
  }
}

export const mailerService = new MailerService();
