import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  is_verified?: boolean;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  status: 'pending_verification';
  requiresVerification: boolean;
  message: string;
  email: string;
  expiresInMinutes?: number;
}

export interface EmailValidationResponse {
  valid: boolean;
  error?: string;
  suggestion?: string;
  domain?: string;
  mxRecords?: string[];
  isTaken?: boolean;
  warning?: string;
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

  public validateEmail(email: string): Observable<EmailValidationResponse> {
    return this.http.post<EmailValidationResponse>(`${this.baseUrl}/validate-email`, { email });
  }

  public register(
    name: string,
    email: string,
    password: string,
    petName?: string,
    petSpecies?: 'CAT' | 'DOG',
    petWeight?: number
  ): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, {
      name,
      email,
      password,
      petName,
      petSpecies,
      petWeight
    });
  }

  public verifyCode(email: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/verify-code`, { email, code }).pipe(
      tap(res => {
        if (res && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  public verifyToken(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/verify-token`, { token }).pipe(
      tap(res => {
        if (res && res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  public resendCode(email: string): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(`${this.baseUrl}/resend-code`, { email });
  }

  public forgotPassword(email: string): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(`${this.baseUrl}/forgot-password`, { email });
  }

  public resetPassword(payload: {
    email?: string;
    code?: string;
    token?: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, payload);
  }

  public deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/me`).pipe(
      tap(() => {
        this.logout();
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
