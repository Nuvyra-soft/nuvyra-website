import { Resend } from 'resend';

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

/**
 * Validates a contact submission and asks Resend to deliver it.
 * This function is shared by the local Express server and the Vercel Function.
 */
export async function processContact(body) {
  const { name, email, company = '', phone = '', service, message, consent, website = '' } = body ?? {};

  // Honeypot: bots receive a successful response, but no email is sent.
  if (website) return { status: 202, body: { accepted: true } };

  const valid = typeof name === 'string' && name.trim().length >= 2 && name.length <= 100
    && typeof email === 'string' && email.length <= 254 && emailPattern.test(email)
    && typeof company === 'string' && company.length <= 120
    && typeof phone === 'string' && phone.length <= 50
    && typeof service === 'string' && allowedServices.has(service)
    && typeof message === 'string' && message.trim().length >= 10 && message.length <= 1000
    && consent === true;

  if (!valid) return { status: 400, body: { error: 'Datos de contacto inválidos.' } };

  const resendApiKey = process.env.RESEND_API_KEY || '';
  if (!resendApiKey) {
    return { status: 503, body: { error: 'Resend todavía no está configurado.' } };
  }

  const clean = {
    name: name.trim(), email: email.trim(), company: company.trim(), phone: phone.trim(),
    service, message: message.trim(),
  };
  const resend = new Resend(resendApiKey);

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'NUVYRA Web <onboarding@resend.dev>',
      to: [process.env.CONTACT_TO || 'nuvyra.solutions@gmail.com'],
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
    return { status: 202, body: { accepted: true } };
  } catch (error) {
    console.error('Resend delivery failed:', error?.name || 'ResendError');
    return { status: 502, body: { error: 'No pudimos enviar el correo. Inténtalo nuevamente más tarde.' } };
  }
}
