import { useEffect, useState } from 'react';

const services = [
  ['01', 'Desarrollo de software a medida', 'Aplicaciones web y móviles construidas para el proceso real del negocio, no para una plantilla genérica.', ['Análisis funcional y técnico', 'Web, móvil y portales internos', 'Pruebas automatizadas y documentación']],
  ['02', 'Implementación de ERP', 'Análisis, parametrización, migración de datos y puesta en marcha con tu equipo capacitado y operando.', ['Relevamiento de procesos y gap analysis', 'Parametrización y módulos propios', 'Migración de datos y capacitación']],
  ['03', 'Automatización de procesos', 'Eliminamos las tareas manuales y repetitivas y las reemplazamos por reglas, aprobaciones y robots que corren solos.', ['Auditoría de tareas y tiempos', 'Bots para carga repetitiva de datos', 'Flujos de aprobación y alertas']],
  ['04', 'Integración de sistemas y APIs', 'Conectamos ERP, CRM, e-commerce y sistemas legados para que los datos dejen de recargarse a mano entre ellos.', ['APIs REST y middleware', 'Conectores legacy y on-premise', 'Trazabilidad y monitoreo de errores']],
  ['05', 'Business Intelligence y analítica', 'Tableros y reportes sobre una única fuente de verdad, para que cada área decida con los mismos números.', ['Data warehouse y ETL', 'KPIs operativos y de gestión', 'Reportes automáticos por correo']],
  ['06', 'Soporte, mantenimiento y cloud', 'Infraestructura, monitoreo y mejora continua para que el sistema siga funcionando mientras el negocio crece.', ['SLA con tiempos de respuesta acordados', 'Migración a cloud y backups', 'Monitoreo y alertas 24/7']],
];

const steps = [
  ['01', 'Diagnóstico', 'Relevamos el proceso en terreno, medimos tiempos y acordamos prioridades.'],
  ['02', 'Diseño de la solución', 'Arquitectura, alcance, plazos y presupuesto documentados antes de escribir código.'],
  ['03', 'Desarrollo', 'Ciclos de dos semanas con demos, para que veas el avance y puedas ajustar.'],
  ['04', 'Implementación y capacitación', 'Go-live controlado, migración de datos y capacitación práctica por rol.'],
  ['05', 'Soporte y evolución', 'SLA, monitoreo y una hoja de ruta trimestral de mejoras.'],
];

const nav = [['#inicio', 'Inicio'], ['#nosotros', 'Nosotros'], ['#servicios', 'Servicios'], ['#proceso', 'Proceso'], ['#contacto', 'Contacto']];
const initialForm = { name: '', company: '', email: '', phone: '', service: '', message: '', consent: false, website: '' };

function Logo({ light = false }) {
  return <a className="logo" href="#inicio" aria-label="NUVYRA — inicio"><span className="logo-mark">N</span><span><b className={light ? 'light' : ''}>NUVYRA</b><small>SOFTWARE · SYSTEMS · SOLUTIONS</small></span></a>;
}

function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ type: '', text: '' });
  const [sending, setSending] = useState(false);

  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.type === 'checkbox' ? target.checked : target.value }));
  const validate = () => {
    const next = {
      name: form.name.trim().length < 2 ? 'Ingresá tu nombre.' : '',
      email: !/^\S+@\S+\.\S+$/.test(form.email) ? 'Ingresá un correo válido.' : '',
      service: !form.service ? 'Elegí un servicio.' : '',
      message: form.message.trim().length < 10 ? 'Contanos un poco sobre tu proyecto.' : '',
      consent: !form.consent ? 'Necesitás aceptar para continuar.' : '',
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };
  const submit = async (event) => {
    event.preventDefault();
    setState({ type: '', text: '' });
    if (!validate()) return;
    setSending(true);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No pudimos enviar tu consulta.');
      setForm(initialForm);
      setState({ type: 'success', text: 'Gracias por escribir. Recibimos tu consulta y te respondemos dentro de un día hábil.' });
    } catch (error) {
      setState({ type: 'error', text: error.message });
    } finally { setSending(false); }
  };
  const field = (name) => ({ name, value: form[name], onChange: update, 'aria-invalid': Boolean(errors[name]) });

  return <form className="contact-form" onSubmit={submit} noValidate>
    <div className="form-grid">
      <Field label="Nombre *" error={errors.name}><input {...field('name')} id="name" placeholder="Tu nombre completo" /></Field>
      <Field label="Empresa"><input {...field('company')} id="company" placeholder="Nombre de la empresa" /></Field>
      <Field label="Correo *" error={errors.email}><input {...field('email')} id="email" type="email" placeholder="tu@empresa.com" /></Field>
      <Field label="Teléfono"><input {...field('phone')} id="phone" type="tel" placeholder="+00 000 000 0000" /></Field>
    </div>
    <Field label="Servicio de interés *" error={errors.service}><select {...field('service')} id="service"><option value="">Seleccioná un servicio</option>{services.map(([, title]) => <option key={title} value={title}>{title}</option>)}</select></Field>
    <Field label="Mensaje *" error={errors.message}><textarea {...field('message')} id="message" rows="5" placeholder="Contanos brevemente el proceso o sistema que necesitás." /></Field>
    <input className="honeypot" tabIndex="-1" autoComplete="off" {...field('website')} aria-hidden="true" />
    <label className="consent"><input {...field('consent')} id="consent" type="checkbox" /><span>Acepto que NUVYRA guarde estos datos para contactarme por mi consulta.</span></label>
    {errors.consent && <p className="error">{errors.consent}</p>}
    <button className="button full" disabled={sending}>{sending ? 'Enviando…' : 'Enviar consulta'}</button>
    {state.text && <p className={`notice ${state.type}`} role="status">{state.text}</p>}
  </form>;
}

function Field({ label, error, children }) { return <label className="field"><span>{label}</span>{children}{error && <em className="error">{error}</em>}</label>; }

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [language, setLanguage] = useState('es');
  useEffect(() => { const listener = () => setScrolled(window.scrollY > 24); window.addEventListener('scroll', listener, { passive: true }); return () => window.removeEventListener('scroll', listener); }, []);
  const closeMenu = () => setMenuOpen(false);

  return <>
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner"><Logo /><nav className="desktop-nav">{nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav><div className="header-actions"><div className="language"><button className={language === 'es' ? 'active' : ''} onClick={() => setLanguage('es')}>ES</button><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button></div><a className="button small cta" href="#contacto">Agendar una reunión</a><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">☰</button></div></div>
      {menuOpen && <nav className="mobile-nav">{nav.map(([href, label]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}<a className="button" href="#contacto" onClick={closeMenu}>Agendar una reunión</a></nav>}
    </header>

    <main>
      <section id="inicio" className="hero"><div className="hero-grid"><div><p className="eyebrow on-dark">SOFTWARE · SYSTEMS · SOLUTIONS</p><h1>Ingeniería que convierte operaciones manuales en sistemas automáticos</h1><p className="lead">Diseñamos, desarrollamos e implementamos software a medida, sistemas ERP y automatización de procesos para empresas medianas y grandes que necesitan operar sin fricción.</p><div className="button-row"><a className="button" href="#contacto">Agendar una reunión</a><a className="text-link" href="#servicios">Ver servicios <span>→</span></a></div></div><div className="system-panel" aria-label="Panel de sistemas"><div className="panel-top"><span>NUVYRA / OPERATIONS</span><i>● LIVE</i></div><div className="panel-lines"><span /><span /><span /></div><div className="system-metrics"><Metric name="ERP" value="1.284" /><Metric name="RPA" value="96%" /><Metric name="API" value="42ms" /></div></div></div><div className="metrics"><Metric value="+50" name="proyectos entregados"/><Metric value="99.9%" name="uptime en sistemas gestionados"/><Metric value="+10" name="años de experiencia"/><Metric value="24/7" name="monitoreo y soporte"/></div></section>
      <section className="techs"><span>TECNOLOGÍAS QUE DOMINAMOS</span>{['SAP','Odoo','Microsoft Dynamics','Power BI','Python','.NET','React','PostgreSQL','AWS','Docker'].map((tech) => <b key={tech}>{tech}</b>)}</section>
      <section id="nosotros" className="section about"><div className="section-heading"><p className="eyebrow">QUIÉNES SOMOS</p><h2>Un equipo de ingeniería, no un vendedor de software</h2></div><div className="about-copy"><p>NUVYRA nació dentro de la operación: plantas, depósitos, administración y equipos de servicio donde la información vivía en planillas y las decisiones llegaban tarde. Construimos los sistemas que esos equipos realmente necesitan — dimensionados al proceso, no a un catálogo de licencias.</p><p>Cada proyecto empieza con un diagnóstico en terreno: relevamos el flujo, medimos dónde se pierde tiempo y definimos qué conviene automatizar primero. Después implementamos en ciclos cortos, con una versión funcionando en producción temprano y sin sorpresas en el presupuesto.</p><p>Trabajamos como una extensión de tu equipo de TI y operaciones: código documentado, usuarios capacitados y una hoja de ruta clara después de la puesta en marcha.</p></div><div className="value-grid">{[['Ingeniería a medida','Soluciones modeladas sobre tu proceso real, sin forzarlo dentro de una plantilla.'],['Metodología ágil','Ciclos de dos semanas, avance visible y prioridades que podés ajustar.'],['Acompañamiento continuo','Un equipo asignado después del go-live, con tiempos de respuesta acordados por escrito.'],['Tecnología escalable','Arquitectura cloud y estándares abiertos para que el sistema crezca con la empresa.']].map(([title,text]) => <article className="mini-card" key={title}><span>✦</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="section mission"><div><p className="eyebrow on-dark">MISIÓN Y VISIÓN</p><h2>Hacia dónde vamos y cómo llegamos</h2></div><div className="mission-grid"><article><span>01</span><h3>Misión</h3><p>Dar a las empresas medianas y grandes software en el que puedan confiar: sistemas que eliminen tareas manuales, conecten la información que ya existe en el negocio y permitan a cada equipo decidir con datos el mismo día, no a fin de mes.</p></article><article><span>02</span><h3>Visión</h3><p>Ser el partner tecnológico de referencia en la región para empresas industriales, comerciales y de servicios — reconocidos no por el tamaño de nuestras propuestas, sino por cuántos clientes renuevan y amplían sus sistemas con nosotros.</p></article></div><div className="values"><p className="eyebrow on-dark">VALORES</p>{[['Excelencia técnica','Código revisado, probado y documentado.'],['Transparencia','Alcance claro, plazos reales y sin costos ocultos.'],['Compromiso','Nos quedamos hasta que el sistema está en producción y en uso.'],['Innovación','Tecnología nueva cuando resuelve un problema, no para el folleto.']].map(([title,text]) => <div key={title}><b>{title}</b><span>{text}</span></div>)}</div></section>
      <section id="servicios" className="section"><div className="section-heading centered"><p className="eyebrow">QUÉ HACEMOS</p><h2>Seis servicios que cubren toda la vida de un sistema</h2><p>Desde el primer diagnóstico hasta la operación diaria de la plataforma. Podés empezar por uno y crecer desde ahí.</p></div><div className="service-grid">{services.map(([number,title,text,items]) => <article className="service-card" key={number}><span className="number">{number}</span><h3>{title}</h3><p>{text}</p><ul>{items.map((item) => <li key={item}>✓ {item}</li>)}</ul></article>)}</div></section>
      <section id="proceso" className="section process"><div className="section-heading centered"><p className="eyebrow">CÓMO TRABAJAMOS</p><h2>Un proceso de cinco pasos, sin cajas negras</h2></div><div className="steps">{steps.map(([number,title,text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="consulting"><div><p className="eyebrow">CONSULTORÍA</p><h2>Contanos qué proceso te está costando más tiempo</h2><p>Con una llamada de 45 minutos alcanza para decirte si conviene automatizarlo, qué implicaría y cuánto costaría aproximadamente.</p></div><a className="button" href="#contacto">Solicitar una consultoría gratuita</a></section>
      <section id="contacto" className="section contact"><div className="contact-grid"><div><p className="eyebrow">CONTÁCTANOS</p><h2>Hablemos de tu operación</h2><p className="lead muted">Escribinos con una descripción breve del proceso y respondemos dentro de un día hábil.</p><ul className="contact-list"><li><b>CORREO</b><a href="mailto:contacto@nuvyra.com">contacto@nuvyra.com</a></li><li><b>TELÉFONO / WHATSAPP</b><span>+00 000 000 0000</span></li><li><b>DIRECCIÓN</b><span>[Calle y número] · [Ciudad, País]</span></li><li><b>HORARIO DE ATENCIÓN</b><span>Lunes a viernes · 9:00–18:00 [zona horaria]</span></li></ul></div><ContactForm /></div></section>
    </main>
    <footer><div className="footer-grid"><div><Logo light /><p>Ingeniería de software, implementación de ERP y automatización de procesos para empresas que necesitan operar sin fricción.</p></div><FooterLinks title="SERVICIOS" links={services.map(([, title]) => title)} /><FooterLinks title="EMPRESA" links={['Quiénes somos','Misión y visión','Proceso','Contacto']} /><div><p className="eyebrow on-dark">CONTACTO</p><a href="mailto:contacto@nuvyra.com">contacto@nuvyra.com</a><span>+00 000 000 0000</span><span>[Calle y número] · [Ciudad, País]</span><span>Lunes a viernes · 9:00–18:00</span></div></div><div className="copyright"><span>© 2026 NUVYRA. Todos los derechos reservados.</span><span>Política de privacidad · Términos</span></div></footer>
  </>;
}

function Metric({ value, name }) { return <div className="metric"><b>{value}</b><span>{name}</span></div>; }
function FooterLinks({ title, links }) { return <div><p className="eyebrow on-dark">{title}</p>{links.map((link) => <a key={link} href="#contacto">{link}</a>)}</div>; }
