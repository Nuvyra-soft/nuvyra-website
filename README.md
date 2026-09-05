# NUVYRA website

Migración del documento HTML a React con Vite. La página se divide en componentes de navegación, contenido, servicios, proceso y formulario de contacto en `src/App.jsx`; los estilos están centralizados en `src/styles.css`.

## Desarrollo

1. Copia `.env.example` como `.env` si necesitas cambiar el puerto u origen permitido.
2. Ejecuta `npm install`.
3. En una terminal ejecuta `npm start` para la API de contacto.
4. En otra, ejecuta `npm run dev` para la interfaz. Vite reenvía `/api` al puerto 3001 durante el desarrollo.

## Protección del formulario

`POST /api/contact` limita a cada IP a cinco intentos por 15 minutos y devuelve `429` al superar ese límite. También valida el cuerpo, restringe el JSON a 16 KB y usa un campo honeypot. El límite se aplica antes de validar, por lo que los intentos inválidos también consumen cuota.

El almacenamiento del limitador de Express es local al proceso. Antes de desplegar varias instancias, configura un store compartido compatible con `express-rate-limit` (por ejemplo Redis); de otro modo cada instancia tendría su propio contador.

## Envío por correo con Resend

El controlador usa la SDK oficial de Resend y solo devuelve `202` después de que Resend acepta el mensaje. Crea una API key en Resend y colócala en `RESEND_API_KEY` dentro de `.env`; nunca subas ese archivo al repositorio.

Mientras se use `onboarding@resend.dev`, Resend solo permite enviar al correo asociado con la cuenta de Resend. Para enviar a otras direcciones será necesario verificar un dominio propio y cambiar `RESEND_FROM`.

Si falta la API key, la API responde `503` en vez de mostrar un éxito falso. Los mensajes no se guardan en archivos ni bases de datos y los errores del servidor no registran datos personales.
