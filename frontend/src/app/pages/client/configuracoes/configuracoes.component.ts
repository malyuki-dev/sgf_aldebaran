import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  LucideAngularModule,
  Moon,
  Settings,
  Shield,
} from 'lucide-angular';
import { finalize } from 'rxjs';
import { ClientSettings } from '../../../models/client-settings.model';
import { ClientSettingsService } from '../../../services/client-settings.service';
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
  };

  protected settings: ClientSettings = {
    darkMode: false,
    notificationsEnabled: true,
  };

  protected loading = true;
  protected saving = false;
  protected feedback: SettingsFeedback | null = null;

  constructor(
    private readonly settingsService: ClientSettingsService,
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
