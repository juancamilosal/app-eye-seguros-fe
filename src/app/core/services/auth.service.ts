import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

interface DirectusLoginResponse {
  data: {
    access_token: string;
    refresh_token?: string;
    expires?: number;
  };
}

interface DirectusUserMe {
  data: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly TOKEN_REFRESH_KEY = 'refresh_token';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<DirectusLoginResponse> {
    return this.http.post<DirectusLoginResponse>(environment.seguridad.login, { email, password }).pipe(
      tap((resp) => {
        const token = resp?.data?.access_token;
        const refresh = resp?.data?.refresh_token;
        if (token) {
          localStorage.setItem(this.TOKEN_KEY, token);
        }
        if (refresh) {
          localStorage.setItem(this.TOKEN_REFRESH_KEY, refresh);
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

  logout(): Observable<void> {
    const refresh = localStorage.getItem(this.TOKEN_REFRESH_KEY);
    const cleanup = () => {
      try {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_REFRESH_KEY);
        sessionStorage.clear();
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