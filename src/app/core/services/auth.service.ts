import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<DirectusLoginResponse> {
    return this.http.post<DirectusLoginResponse>(environment.authLogin, { email, password }).pipe(
      tap((resp) => {
        const token = resp?.data?.access_token;
        if (token) {
          localStorage.setItem(this.TOKEN_KEY, token);
        }
      })
    );
  }

  me(): Observable<DirectusUserMe> {
    return this.http.get<DirectusUserMe>(environment.authMe);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}