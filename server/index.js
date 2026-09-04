import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: allowedOrigin, methods: ['POST'] }));
app.use(express.json({ limit: '16kb' }));

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

app.post('/api/contact', contactLimiter, (req, res) => {
  const { name, email, company = '', phone = '', service, message, consent, website = '' } = req.body ?? {};
  // Honeypot: automated submissions receive no useful signal and are not processed.
  if (website) return res.status(202).json({ accepted: true });
  const valid = typeof name === 'string' && name.trim().length >= 2
    && typeof email === 'string' && emailPattern.test(email)
    && typeof service === 'string' && service.length > 0
    && typeof message === 'string' && message.trim().length >= 10
    && consent === true && company.length <= 120 && phone.length <= 50;
  if (!valid) return res.status(400).json({ error: 'Datos de contacto inválidos.' });

  // Connect the approved email or CRM service here. Avoid logging personal data.
  return res.status(202).json({ accepted: true });
});

app.listen(port, () => console.log(`Contact API listening on :${port}`));
