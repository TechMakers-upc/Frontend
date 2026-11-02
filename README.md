# FixCore — Frontend Angular conectado a Spring Boot

Aplicación de mantenimiento industrial TechMakers. **La interfaz normal usa autenticación JWT del backend real**; el antiguo modo de demostración no está disponible desde la navegación.

## Requisitos

- Node.js, npm y Angular según `package.json`.
- Backend Spring Boot en `http://localhost:8080` con JDK 21.
- PostgreSQL con base `fixcore` y usuario `fixcore_user`; Flyway administra las migraciones.

## Iniciar en desarrollo

En el repositorio del backend, configurar la variable `DB_PASSWORD` y ejecutar `./mvnw.cmd spring-boot:run` (Windows). El perfil `dev` carga datos de prueba **en PostgreSQL**, no en almacenamiento simulado del navegador.

En el frontend:

```powershell
npm ci
npm start -- --host 127.0.0.1 --port 4300
```

Abrir `http://127.0.0.1:4300/login`.

Credenciales predeterminadas del backend **solo en desarrollo**, si los seeders están activados y `DEMO_USERS_PASSWORD` no se ha modificado:

| Correo | Contraseña | Rol |
| --- | --- | --- |
| `carla.garcia@fixcore.demo` | `FixCore2026` | Jefa de planta |
| `victor.salazar@fixcore.demo` | `FixCore2026` | Gerente de operaciones |
| `jose.ramirez@fixcore.demo` | `FixCore2026` | Técnico |

Estas son cuentas reales guardadas en PostgreSQL en modo dev, con autenticación mediante JWT. No deben utilizarse como credenciales de producción.

## Integración y API

- Backend local: `src/environments/environment.development.ts` (`http://localhost:8080/api/v1`).
- Backend de despliegue: `src/environments/environment.ts` (Render; debe estar disponible y tener CORS apropiado).
- `POST /authentication/sign-in` devuelve `account` y `token`.
- Las demás rutas autentican mediante Bearer JWT; los permisos finales se validan en Spring Security.
- Plantas, máquinas, fallas, órdenes, repuestos, movimientos, planes, indicadores y alertas se consultan a los endpoints de Spring Boot.

Para cambiar el origen del frontend en desarrollo, configurar `CORS_ALLOWED_ORIGINS` en el backend y reiniciarlo. Este paquete incluye orígenes locales `127.0.0.1`/`localhost` en puertos `4200` y `4300`.

## Validación

```powershell
npm run build
npm test -- --watch=false
```

Las pruebas automáticas no certifican la integración de extremo a extremo. Después hay que comprobar `GET /actuator/health`, hacer login con cada rol y ejecutar escenarios reales: registrar máquina, reportar falla, abrir/completar OT, registrar repuestos, programar un plan y revisar métricas/alertas. Hay scripts de comprobación en el ZIP de instalación.

## Despliegue

El proyecto mantiene `vercel.json` y la URL de backend de producción configurada actualmente. Verifica que Render esté funcionando, que las variables de la base de datos estén configuradas en el servidor y que `CORS_ALLOWED_ORIGINS` incluya la URL real de Vercel. No expongas credenciales ni secretos JWT en archivos Angular.
