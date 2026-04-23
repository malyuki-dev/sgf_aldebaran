import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  ClientSettings,
  ClientSettingsSaveResult,
  DeleteClientAccountResponse,
  UpdateClientSettingsPayload,
} from '../models/client-settings.model';
import { ApiService } from './api.service';

interface MobileProfileSettingsResponse {
  settings?: Partial<ClientSettings>;
  preferences?: Partial<ClientSettings>;
  darkMode?: boolean;
  notificationsEnabled?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ClientSettingsService {
  private readonly storageKey = 'client_settings_sgf';
  private readonly themeStorageKey = 'theme_sgf';

  constructor(private readonly apiService: ApiService) {}

  getSettings(): Observable<ClientSettings> {
    return this.apiService.get<MobileProfileSettingsResponse>('/mobile/profile').pipe(
      map((response) => this.normalizeSettings(response)),
      tap((settings) => this.persistLocalSettings(settings)),
      catchError(() => of(this.getLocalSettings())),
    );
  }

  updateSettings(
    payload: UpdateClientSettingsPayload,
  ): Observable<ClientSettingsSaveResult> {
    const settings = this.normalizeSettings(payload);

    return this.apiService.put<ClientSettings>('/mobile/settings', settings).pipe(
      map((response) => ({
        settings: this.normalizeSettings(response),
        persistedRemotely: true,
      })),
      tap((result) => this.persistLocalSettings(result.settings)),
      catchError(() => {
        this.persistLocalSettings(settings);
        return of({
          settings,
          persistedRemotely: false,
        });
      }),
    );
  }

  deleteAccount(): Observable<DeleteClientAccountResponse> {
    return this.apiService.delete<DeleteClientAccountResponse>('/mobile/account');
  }

  applyTheme(isDarkMode: boolean): void {
    localStorage.setItem(this.themeStorageKey, isDarkMode ? 'dark' : 'light');

    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  private normalizeSettings(
    source?: Partial<ClientSettings> | MobileProfileSettingsResponse | null,
  ): ClientSettings {
    const nested = source && 'settings' in source ? source.settings : null;
    const preferences = source && 'preferences' in source ? source.preferences : null;
    const data = nested ?? preferences ?? source ?? {};
    const localSettings = this.getLocalSettings();

    return {
      darkMode: this.toBoolean(data.darkMode, localSettings.darkMode),
      notificationsEnabled: this.toBoolean(
        data.notificationsEnabled,
        localSettings.notificationsEnabled,
      ),
    };
  }

  private getLocalSettings(): ClientSettings {
    const raw = localStorage.getItem(this.storageKey);
    const darkMode = localStorage.getItem(this.themeStorageKey) === 'dark';

    if (!raw) {
      return {
        darkMode,
        notificationsEnabled: true,
      };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ClientSettings>;
      return {
        darkMode: this.toBoolean(parsed.darkMode, darkMode),
        notificationsEnabled: this.toBoolean(parsed.notificationsEnabled, true),
      };
    } catch {
      return {
        darkMode,
        notificationsEnabled: true,
      };
    }
  }

  private persistLocalSettings(settings: ClientSettings): void {
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
    this.applyTheme(settings.darkMode);
  }

  private toBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
  }
}
