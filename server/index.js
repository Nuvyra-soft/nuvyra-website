import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const allowedOrigins = new Set((process.env.ALLOWED_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()));

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
  'Integración de sistemas y APIs', 'Business Intelligence y analítica', 'Soporte, mantenimiento y cloud',
  'Custom software development', 'ERP implementation', 'Process automation',
  'Systems and API integration', 'Business Intelligence and analytics', 'Support, maintenance and cloud',
]);

app.post('/api/contact', contactLimiter, (req, res) => {
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

  // Connect the approved email or CRM service here. Avoid logging personal data.
  return res.status(202).json({ accepted: true });
});

app.all('/api/contact', (_req, res) => res.status(405).json({ error: 'Método no permitido.' }));

app.listen(port, host, () => console.log(`Contact API listening on http://${host}:${port}`));
