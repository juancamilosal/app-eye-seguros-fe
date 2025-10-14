import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, BehaviorSubject } from 'rxjs';
import { filter, take, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {DirectusLoginResponse, DirectusUserMe} from '../models/Login';

@Injectable({ providedIn: 'root' })

export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly TOKEN_REFRESH_KEY = 'refresh_token';
  private refreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);
  private refreshTimerId: number | null = null;
  private readonly REFRESH_SKEW_MS = 60_000;

  constructor(private http: HttpClient) {
    const existingToken = localStorage.getItem(this.TOKEN_KEY);
    if (existingToken) {
      this.scheduleProactiveRefresh(existingToken);
    }
  }

  login(email: string, password: string): Observable<DirectusLoginResponse> {
    return this.http.post<DirectusLoginResponse>(environment.seguridad.login, { email, password }).pipe(
      tap((resp) => {
        const token = resp?.data?.access_token;
        const refresh = resp?.data?.refresh_token;
        const expires = resp?.data?.expires;
        if (token) {
          localStorage.setItem(this.TOKEN_KEY, token);
        }
        if (refresh) {
          localStorage.setItem(this.TOKEN_REFRESH_KEY, refresh);
        }
        if (token) {
          this.scheduleProactiveRefresh(token, expires);
        }
      })
    );
  }

  me(): Observable<DirectusUserMe> {
    return this.http.get<DirectusUserMe>(environment.seguridad.me);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private setRefreshToken(token: string | undefined): void {
    if (token) {
      localStorage.setItem(this.TOKEN_REFRESH_KEY, token);
    }
  }

  // Decodifica el JWT y retorna tiempo de expiración en ms (epoch), si existe
  private decodeJwtExpMs(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const payload = JSON.parse(atob(padded));
      const expSec = payload?.exp;
      if (typeof expSec === 'number') {
        return expSec * 1000;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Programa un refresco proactivo antes de la expiración
  private scheduleProactiveRefresh(token: string, expiresSeconds?: number): void {
    // Limpiar cualquier temporizador previo
    if (this.refreshTimerId !== null) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }

    const nowMs = Date.now();
    let expMs: number | null = this.decodeJwtExpMs(token);

    // Si no hay exp en el JWT, usar "expires" del backend (segundos hasta expirar)
    if (expMs === null && typeof expiresSeconds === 'number' && expiresSeconds > 0) {
      expMs = nowMs + expiresSeconds * 1000;
    }

    if (expMs === null) {
      return; // No podemos programar sin conocer expiración
    }

    // Calcular momento de refresco, con margen (skew)
    let delayMs = expMs - nowMs - this.REFRESH_SKEW_MS;
    if (delayMs <= 0) {
      delayMs = 5000; // si ya está cerca/expirado, refrescar pronto
    }

    // Proteger contra valores demasiado grandes para setTimeout
    const MAX_TIMEOUT = 2_147_483_647; // ~24.8 días
    delayMs = Math.min(delayMs, MAX_TIMEOUT);

    this.refreshTimerId = window.setTimeout(() => {
      // Evitar múltiples refresh simultáneos; el método refresh ya controla concurrencia
      this.refresh().subscribe();
    }, delayMs);
  }

  // Refresca el token usando el refresh_token almacenado
  refresh(): Observable<string | null> {
    const refresh = localStorage.getItem(this.TOKEN_REFRESH_KEY);
    if (!refresh) {
      return of(null);
    }

    if (this.refreshing) {
      return this.refreshSubject.pipe(filter((t) => t !== null), take(1));
    }

    this.refreshing = true;
    return this.http
      .post<DirectusLoginResponse>(environment.seguridad.refresh, { refresh_token: refresh })
      .pipe(
        tap((resp) => {
          const token = resp?.data?.access_token ?? null;
          const refreshNew = resp?.data?.refresh_token;
          const expires = resp?.data?.expires;
          this.setToken(token);
          this.setRefreshToken(refreshNew);
          this.refreshSubject.next(token);
          this.refreshing = false;
          if (token) {
            this.scheduleProactiveRefresh(token, expires);
          }
        }),
        map((resp) => resp?.data?.access_token ?? null),
        catchError(() => {
          this.refreshSubject.next(null);
          this.refreshing = false;
          return of(null);
        })
      );
  }

  logout(): Observable<void> {
    const refresh = localStorage.getItem(this.TOKEN_REFRESH_KEY);
    const cleanup = () => {
      try {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_REFRESH_KEY);
        sessionStorage.clear();
        if (this.refreshTimerId !== null) {
          clearTimeout(this.refreshTimerId);
          this.refreshTimerId = null;
        }
      } catch {}
    };

    if (refresh) {
      return this.http.post<void>(environment.seguridad.logout, { refresh_token: refresh }).pipe(
        tap(() => cleanup()),
        catchError(() => {
          cleanup();
          return of<void>(void 0);
        })
      );
    }
    cleanup();
    return of<void>(void 0);
  }
}
