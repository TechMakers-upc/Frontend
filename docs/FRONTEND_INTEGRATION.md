# Integración de FixCore Frontend

Angular se comunica con Spring Boot por HTTP usando JWT para las sesiones reales.
La navegación `/demo` funciona con datos locales. Nunca debe confundirse con
una cuenta autenticada ni con persistencia PostgreSQL.

## Servicios utilizados

- `POST /api/v1/maintenance-plans/{planId}/completions`: finalización manual.
- `DELETE /api/v1/maintenance-plans/{planId}`: eliminación de planes.
- `GET /api/v1/analytics/summary`: indicadores del tablero.
- `GET /api/v1/analytics/downtime-ranking`: horas de parada por máquina.
- `GET /api/v1/analytics/technicians/{id}/performance`: rendimiento técnico.
- `GET /api/v1/alerts`: alertas según el usuario autenticado.

La finalización de una orden preventiva ya registra su resultado en el backend;
el frontend **no** vuelve a llamar al endpoint de finalización de planes.
La acción manual está disponible solo cuando no hay una orden abierta vinculada.

## Verificación

```powershell
npm ci
npm run build
npm test -- --watch=false
npm start
```

Iniciar sesión con usuarios reales y verificar la pestaña Network del navegador.
Las pruebas automatizadas HTTP usan dobles de prueba: no sustituyen una prueba
completa contra Spring Boot y PostgreSQL.
