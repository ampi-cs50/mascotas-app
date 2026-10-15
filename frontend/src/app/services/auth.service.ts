import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'http://localhost:3000/api/v1/auth';
  private readonly TOKEN_KEY = 'pet_care_token';
  private readonly USER_KEY = 'pet_care_user';

  public currentUser = signal<AuthUser | null>(this.getStoredUser());
  public token = signal<string | null>(this.getStoredToken());
  public isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  constructor(private http: HttpClient) {
    if (this.token()) {
      this.verifySession();
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setSession(token: string, user: AuthUser) {
    this.token.set(token);
    this.currentUser.set(user);
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Could not persist session in localStorage', e);
    }
  }

  public login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  public register(
    name: string,
    email: string,
    password: string,
    petName?: string,
    petSpecies?: 'CAT' | 'DOG',
    petWeight?: number
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
      name,
      email,
      password,
      petName,
      petSpecies,
      petWeight
    }).pipe(
      tap(res => {
        if (res && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  public verifySession() {
    this.http.get<AuthUser>(`${this.baseUrl}/me`).pipe(
      tap(user => {
        if (user) {
          this.currentUser.set(user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
      }),
      catchError(() => {
        // Token expired or invalid
        this.logout();
        return of(null);
      })
    ).subscribe();
  }

  public logout() {
    this.token.set(null);
    this.currentUser.set(null);
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (e) {
      console.warn('Error clearing localStorage', e);
    }
  }
}
