import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Resend } from 'resend';

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const allowedOrigins = new Set((process.env.ALLOWED_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()));
const resendApiKey = process.env.RESEND_API_KEY || '';
const resendFrom = process.env.RESEND_FROM || 'NUVYRA Web <onboarding@resend.dev>';
const contactTo = process.env.CONTACT_TO || 'nuvyra.solutions@gmail.com';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido.'));
  },
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
  maxAge: 600,
}));
app.use(express.json({ limit: '16kb', strict: true, type: 'application/json' }));

// Count every attempt before validation. For multi-instance production deployments,
// configure express-rate-limit with a shared store (for example Redis).
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiadas consultas. Inténtalo nuevamente en 15 minutos.' },
});
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedServices = new Set([
  'Desarrollo de software a medida', 'Implementación de ERP', 'Automatización de procesos',
  'Integración de sistemas y APIs',
  'Creación de aplicaciones web y móviles', 'Diseño y desarrollo de websites',
  'Custom software development', 'ERP implementation', 'Process automation',
  'Systems and API integration',
  'Web and mobile app creation', 'Website design and development',
]);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character]));

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, company = '', phone = '', service, message, consent, website = '' } = req.body ?? {};
  // Honeypot: automated submissions receive no useful signal and are not processed.
  if (website) return res.status(202).json({ accepted: true });
  const valid = typeof name === 'string' && name.trim().length >= 2 && name.length <= 100
    && typeof email === 'string' && email.length <= 254 && emailPattern.test(email)
    && typeof company === 'string' && company.length <= 120
    && typeof phone === 'string' && phone.length <= 50
    && typeof service === 'string' && allowedServices.has(service)
    && typeof message === 'string' && message.trim().length >= 10 && message.length <= 1000
    && consent === true;
  if (!valid) return res.status(400).json({ error: 'Datos de contacto inválidos.' });

  if (!resend) return res.status(503).json({ error: 'Resend todavía no está configurado.' });

  const clean = {
    name: name.trim(), email: email.trim(), company: company.trim(), phone: phone.trim(),
    service, message: message.trim(),
  };
  try {
    const { error } = await resend.emails.send({
      from: resendFrom,
      to: [contactTo],
      replyTo: clean.email,
      subject: `Nueva consulta web: ${clean.service}`,
      text: [
        `Nombre: ${clean.name}`, `Correo: ${clean.email}`,
        `Empresa: ${clean.company || 'No indicada'}`, `Teléfono: ${clean.phone || 'No indicado'}`,
        `Servicio: ${clean.service}`, '', clean.message,
      ].join('\n'),
      html: `<h2>Nueva consulta desde NUVYRA</h2><p><strong>Nombre:</strong> ${escapeHtml(clean.name)}</p><p><strong>Correo:</strong> ${escapeHtml(clean.email)}</p><p><strong>Empresa:</strong> ${escapeHtml(clean.company || 'No indicada')}</p><p><strong>Teléfono:</strong> ${escapeHtml(clean.phone || 'No indicado')}</p><p><strong>Servicio:</strong> ${escapeHtml(clean.service)}</p><p><strong>Mensaje:</strong></p><p>${escapeHtml(clean.message).replace(/\n/g, '<br>')}</p>`,
    });
    if (error) throw error;
    return res.status(202).json({ accepted: true });
  } catch (error) {
    console.error('Resend delivery failed:', error.name || 'ResendError');
    return res.status(502).json({ error: 'No pudimos enviar el correo. Inténtalo nuevamente más tarde.' });
  }
});

app.all('/api/contact', (_req, res) => res.status(405).json({ error: 'Método no permitido.' }));

app.listen(port, host, () => console.log(`Contact API listening on http://${host}:${port}`));
