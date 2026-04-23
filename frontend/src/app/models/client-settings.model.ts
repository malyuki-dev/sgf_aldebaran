export interface ClientSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export interface UpdateClientSettingsPayload {
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export interface ClientSettingsSaveResult {
  settings: ClientSettings;
  persistedRemotely: boolean;
}

export interface DeleteClientAccountResponse {
  message?: string;
}
