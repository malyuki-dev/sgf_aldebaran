import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  LucideAngularModule,
  Moon,
  Settings,
  Shield,
  Trash2,
  X,
} from 'lucide-angular';
import { finalize } from 'rxjs';
import { ClientSettings } from '../../../models/client-settings.model';
import { AuthService } from '../../../services/auth.service';
import { ClientSettingsService } from '../../../services/client-settings.service';
import { SettingsDangerZoneComponent } from './components/settings-danger-zone/settings-danger-zone.component';
import { SettingsLinkItemComponent } from './components/settings-link-item/settings-link-item.component';
import { SettingsSectionCardComponent } from './components/settings-section-card/settings-section-card.component';
import { SettingsToggleItemComponent } from './components/settings-toggle-item/settings-toggle-item.component';

type FeedbackType = 'success' | 'error';

interface SettingsFeedback {
  type: FeedbackType;
  message: string;
}

@Component({
  selector: 'app-client-configuracoes',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    SettingsSectionCardComponent,
    SettingsToggleItemComponent,
    SettingsLinkItemComponent,
    SettingsDangerZoneComponent,
  ],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientConfiguracoesComponent implements OnInit {
  protected readonly icons = {
    settings: Settings,
    moon: Moon,
    legal: FileText,
    shield: Shield,
    success: CheckCircle2,
    error: AlertCircle,
    loader: LoaderCircle,
    close: X,
    trash: Trash2,
  };

  protected settings: ClientSettings = {
    darkMode: false,
    notificationsEnabled: true,
  };

  protected loading = true;
  protected saving = false;
  protected deleting = false;
  protected showDeleteModal = false;
  protected feedback: SettingsFeedback | null = null;

  constructor(
    private readonly settingsService: ClientSettingsService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  protected updateDarkMode(enabled: boolean): void {
    this.persistSettings({
      ...this.settings,
      darkMode: enabled,
    });
  }

  protected updateNotifications(enabled: boolean): void {
    this.persistSettings({
      ...this.settings,
      notificationsEnabled: enabled,
    });
  }

  protected openLegalDocument(type: 'terms' | 'privacy'): void {
    this.feedback = {
      type: 'success',
      message:
        type === 'terms'
          ? 'Termos de Uso preparados para a próxima rota legal.'
          : 'Política de Privacidade preparada para a próxima rota legal.',
    };
  }

  protected requestDeleteAccount(): void {
    this.feedback = null;
    this.showDeleteModal = true;
  }

  protected closeDeleteModal(): void {
    if (this.deleting) {
      return;
    }

    this.showDeleteModal = false;
  }

  protected confirmDeleteAccount(): void {
    this.deleting = true;
    this.feedback = null;

    this.settingsService.deleteAccount().pipe(
      finalize(() => {
        this.deleting = false;
        this.changeDetectorRef.markForCheck();
      }),
    ).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.feedback = {
          type: 'error',
          message:
            error.error?.message ||
            'Não foi possível excluir a conta. Endpoint ainda pode estar pendente na API.',
        };
        this.showDeleteModal = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private loadSettings(): void {
    this.loading = true;
    this.feedback = null;

    this.settingsService.getSettings().pipe(
      finalize(() => {
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      }),
    ).subscribe({
      next: (settings) => {
        this.settings = settings;
      },
      error: () => {
        this.feedback = {
          type: 'error',
          message: 'Não foi possível carregar as preferências da conta.',
        };
      },
    });
  }

  private persistSettings(nextSettings: ClientSettings): void {
    const previousSettings = this.settings;
    this.settings = nextSettings;
    this.settingsService.applyTheme(nextSettings.darkMode);
    this.saving = true;
    this.feedback = null;

    this.settingsService.updateSettings(nextSettings).pipe(
      finalize(() => {
        this.saving = false;
        this.changeDetectorRef.markForCheck();
      }),
    ).subscribe({
      next: (result) => {
        this.settings = result.settings;
        this.feedback = null;
      },
      error: (error) => {
        this.settings = previousSettings;
        this.settingsService.applyTheme(previousSettings.darkMode);
        this.feedback = {
          type: 'error',
          message: error.error?.message || 'Não foi possível salvar as preferências.',
        };
      },
    });
  }

}
