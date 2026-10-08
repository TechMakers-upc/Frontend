import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { from, map, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

// Datos exclusivamente locales al navegador. No constituyen un backend ni un servicio IAM.
type DemoRecord = Record<string, unknown> & { id: string };
type DemoDatabase = Record<string, DemoRecord[]>;
const STORAGE_KEY = 'fixcore.sprint2.demo-data.v1';
const COLLECTIONS = new Set([
  'users', 'plants', 'assets', 'maintenance-plans', 'failures',
  'work-orders', 'spare-parts', 'stock-movements',
]);
let databasePromise: Promise<DemoDatabase> | null = null;

async function database(): Promise<DemoDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as DemoDatabase;
          if (parsed && COLLECTIONS.size === [...COLLECTIONS].filter((key) => Array.isArray(parsed[key])).length) {
            return parsed;
          }
        }
      } catch {
        // Navegación privada o datos locales no válidos: continuar con el archivo demo.
      }
      const url = new URL('mock/db.json', document.baseURI).toString();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`No se pudieron cargar los datos de demostración (${response.status}).`);
      return (await response.json()) as DemoDatabase;
    })();
  }
  return databasePromise;
}

function persist(db: DemoDatabase): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* Demo sin persistencia si el almacenamiento está bloqueado. */ }
}

async function execute(request: HttpRequest<unknown>): Promise<unknown> {
  const route = request.url.split('?')[0].slice('/demo-api/'.length);
  const [collection, recordId] = route.split('/').map(decodeURIComponent);
  if (!COLLECTIONS.has(collection) || route.split('/').length > 2) {
    throw new HttpErrorResponse({ status: 404, statusText: 'Recurso de demostración no encontrado', url: request.url });
  }
  const db = await database();
  const items = db[collection];
  if (!Array.isArray(items)) throw new Error(`Colección demo inválida: ${collection}`);
  switch (request.method) {
    case 'GET': {
      if (recordId) {
        const item = items.find((entry) => entry.id === recordId);
        if (!item) throw new HttpErrorResponse({ status: 404, statusText: 'No encontrado', url: request.url });
        return item;
      }
      const params = request.params.keys();
      return params.length ? items.filter((entry) => params.every((key) => String(entry[key] ?? '') === request.params.get(key))) : [...items];
    }
    case 'POST': {
      const payload = request.body as DemoRecord;
      if (!payload || typeof payload.id !== 'string') throw new HttpErrorResponse({ status: 400, statusText: 'Registro inválido', url: request.url });
      if (items.some((entry) => entry.id === payload.id)) throw new HttpErrorResponse({ status: 409, statusText: 'ID duplicado', url: request.url });
      items.push(payload);
      persist(db);
      return payload;
    }
    case 'PUT': {
      const index = items.findIndex((entry) => entry.id === recordId);
      if (index < 0) throw new HttpErrorResponse({ status: 404, statusText: 'No encontrado', url: request.url });
      const payload = request.body as DemoRecord;
      if (!payload || payload.id !== recordId) throw new HttpErrorResponse({ status: 400, statusText: 'Registro inválido', url: request.url });
      items[index] = payload;
      persist(db);
      return payload;
    }
    case 'DELETE': {
      const index = items.findIndex((entry) => entry.id === recordId);
      if (index < 0) throw new HttpErrorResponse({ status: 404, statusText: 'No encontrado', url: request.url });
      items.splice(index, 1);
      persist(db);
      return null;
    }
    default:
      throw new HttpErrorResponse({ status: 405, statusText: 'Método no permitido', url: request.url });
  }
}

export const demoApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!environment.production || !request.url.startsWith('/demo-api/')) return next(request);
  return from(execute(request)).pipe(
    map((body) => new HttpResponse({ status: 200, body, url: request.url })),
    catchError((error: unknown) => throwError(() => error instanceof HttpErrorResponse
      ? error
      : new HttpErrorResponse({ status: 503, statusText: 'Datos demo no disponibles', error, url: request.url }))),
  );
};
