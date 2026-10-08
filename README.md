# FixCore — Frontend Sprint 2

Aplicación Angular de demostración para la gestión de mantenimiento industrial del proyecto TechMakers.

## Alcance de esta entrega

- Navegación por tres perfiles **de demostración**: jefe de planta, gerente de operaciones y técnico.
- Pantallas de plantas, máquinas, órdenes de trabajo, fallas, inventario, mantenimiento preventivo e indicadores.
- Datos ficticios. No incluye autenticación real, usuarios administrables como IAM, API REST de producción ni base de datos de servidor. Esas integraciones corresponden a un sprint posterior.

## Ejecutar en desarrollo

```powershell
npm ci
npm start
```

La versión de desarrollo utiliza una Fake API de JSON Server en `http://localhost:3000`. Si se dispone del archivo original `fixcore-web/server/db.json`, iniciarla por separado:

```powershell
npx --yes json-server "RUTA_COMPLETA_AL_ARCHIVO\db.json" --port 3000
```

Abrir `http://localhost:4200/demo` y elegir un perfil. La identidad del perfil es simulada; **no es autenticación**.

## Compilar para producción

```powershell
npm run build
```

La compilación de producción utiliza el archivo público de datos de ejemplo en `public/mock/db.json` y un adaptador HTTP que simula GET/POST/PUT/DELETE **solo en el navegador**. No necesita JSON Server en la computadora del visitante. Los cambios hechos por un visitante se conservan únicamente en `localStorage` de su propio navegador y **no se comparten** ni constituyen persistencia real del negocio.

Para reiniciar los datos de prueba de la versión desplegada, eliminar la clave `fixcore.sprint2.demo-data.v1` del almacenamiento local del sitio y actualizar la página.

## Vercel

El archivo `vercel.json` configura el build, la carpeta `dist/fixcore-frontend/browser` y la recarga de rutas de Angular. Revisar el sitio desplegado en sus principales rutas, incluidos `/demo`, `/dashboard`, `/assets`, `/work-orders` y `/inventory`.

## Pruebas previas al Pull Request

1. Ejecutar `npm run build` y `npm test`.
2. Verificar el perfil de jefe de planta: registrar máquina y repuesto, crear orden, guardar edición y recargar.
3. Verificar el perfil de técnico: consultar **sus órdenes asignadas**, iniciar una orden y registrar una falla.
4. Verificar el perfil de gerente: consultar indicadores, plantas, técnicos y órdenes.
5. Comprobar responsive en 390/400/440/768/1440 px; no debe haber desbordamiento horizontal de página.
6. Validar ambos idiomas, enlaces directos y el funcionamiento sin `localhost:3000` tras el despliegue.

## Nota sobre el alcance

La Fake API de producción es intencionalmente local. El adaptador no autentica, no aplica permisos del lado de un servidor y no debería utilizarse como solución de producción con información real o sensible.
