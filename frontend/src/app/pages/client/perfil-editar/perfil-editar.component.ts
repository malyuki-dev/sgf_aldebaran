import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LucideAngularModule,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-angular';
import {
  ChangeMobilePasswordPayload,
  MobileProfile,
  UpdateMobileProfilePayload,
} from '../../../models/mobile-profile.model';
import { AuthService, AuthenticatedUser } from '../../../services/auth.service';
import { ProfileService } from '../../../services/profile.service';
import { ClienteSuccessModalComponent } from '../components/cliente-success-modal/cliente-success-modal.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-perfil-editar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, ClienteSuccessModalComponent],
  templateUrl: './perfil-editar.component.html',
  styleUrl: './perfil-editar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilEditarComponent implements OnInit {
  protected readonly icons = {
    user: UserRound,
    mail: Mail,
    phone: Phone,
    save: Save,
    security: ShieldCheck,
    key: KeyRound,
    success: CheckCircle2,
    error: AlertCircle,
    loader: LoaderCircle,
  };

  protected readonly profileForm: FormGroup;
  protected readonly passwordForm: FormGroup;
  protected profile: MobileProfile | null = null;
  protected loadingProfile = true;
  protected savingProfile = false;
  protected savingPassword = false;
  protected profileFeedback: { type: 'success' | 'error'; message: string } | null =
    null;
  protected passwordFeedback: { type: 'success' | 'error'; message: string } | null =
    null;
  protected successMessage: string | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {
    this.profileForm = this.formBuilder.nonNullable.group({
      nomeExibicao: ['', [Validators.required, Validators.maxLength(150)]],
      documento: [{ value: '', disabled: true }],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
    });

    this.passwordForm = this.formBuilder.nonNullable.group(
      {
        senhaAtual: ['', [Validators.required]],
        novaSenha: ['', [Validators.required, Validators.minLength(8)]],
        confirmarNovaSenha: ['', [Validators.required]],
      },
      {
        validators: [
          this.passwordsMatchValidator(),
          this.newPasswordDiffersValidator(),
        ],
      },
    );
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  protected get isPessoaJuridica(): boolean {
    return this.profile?.tipo === 'PJ';
  }

  protected get nameLabel(): string {
    return this.isPessoaJuridica ? 'Razão social' : 'Nome completo';
  }

  protected get documentLabel(): string {
    return this.isPessoaJuridica ? 'CNPJ' : 'CPF';
  }

  protected get profileSubmitLabel(): string {
    return this.savingProfile ? 'Salvando...' : 'Salvar alterações';
  }

  protected get passwordSubmitLabel(): string {
    return this.savingPassword ? 'Atualizando...' : 'Atualizar senha';
  }

  protected saveProfile(): void {
    this.profileFeedback = null;
    this.successMessage = null;
    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid || !this.profile) {
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.savingProfile = true;
    this.changeDetectorRef.markForCheck();

    const formValue = this.profileForm.getRawValue();
    const nomeExibicao = formValue.nomeExibicao.trim();
    const email = formValue.email.trim();

    const payload: UpdateMobileProfilePayload = {
      email,
      telefone: this.normalizeOptional(formValue.telefone),
      ...(this.isPessoaJuridica
        ? { razaoSocial: nomeExibicao }
        : { nome: nomeExibicao }),
    };

    this.profileService.updateProfile(payload).pipe(
      finalize(() => {
        this.savingProfile = false;
        this.changeDetectorRef.markForCheck();
      }),
    ).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.patchProfileForm(profile);
        this.successMessage = 'As informações foram atualizadas com sucesso.';
        this.changeDetectorRef.markForCheck();
      },
      error: (error) => {
        this.profileFeedback = {
          type: 'error',
          message: error.error?.message || 'Não foi possível atualizar os dados.',
        };
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  protected changePassword(): void {
    this.passwordFeedback = null;
    this.successMessage = null;
    this.passwordForm.markAllAsTouched();

    if (this.passwordForm.invalid) {
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.savingPassword = true;
    this.changeDetectorRef.markForCheck();

    const formValue = this.passwordForm.getRawValue();
    const payload: ChangeMobilePasswordPayload = {
      senhaAtual: formValue.senhaAtual,
      novaSenha: formValue.novaSenha,
      confirmarNovaSenha: formValue.confirmarNovaSenha,
    };

    this.profileService.changePassword(payload).pipe(
      finalize(() => {
        this.savingPassword = false;
        this.changeDetectorRef.markForCheck();
      }),
    ).subscribe({
      next: (response) => {
        this.passwordForm.reset();
        this.successMessage = response.message || 'As informações foram atualizadas com sucesso.';
        this.changeDetectorRef.markForCheck();
      },
      error: (error) => {
        this.passwordFeedback = {
          type: 'error',
          message: error.error?.message || 'Não foi possível alterar a senha.',
        };
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  protected fieldInvalid(
    formName: 'profile' | 'password',
    controlName: string,
  ): boolean {
    const control =
      formName === 'profile'
        ? this.profileForm.get(controlName)
        : this.passwordForm.get(controlName);

    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected getFieldError(
    formName: 'profile' | 'password',
    controlName: string,
  ): string | null {
    const control =
      formName === 'profile'
        ? this.profileForm.get(controlName)
        : this.passwordForm.get(controlName);

    if (!control?.errors || !(control.dirty || control.touched)) {
      return null;
    }

    if (control.errors['required']) {
      return 'Campo obrigatório.';
    }
    if (control.errors['email']) {
      return 'Informe um e-mail válido.';
    }
    if (control.errors['minlength']) {
      return 'A senha deve ter no mínimo 8 caracteres.';
    }
    if (control.errors['pattern']) {
      return 'Use o formato (00) 00000-0000.';
    }

    return null;
  }

  protected get passwordGroupError(): string | null {
    const errors = this.passwordForm.errors;
    if (!errors || !(this.passwordForm.dirty || this.passwordForm.touched)) {
      return null;
    }

    if (errors['passwordMismatch']) {
      return 'A confirmação da nova senha não confere.';
    }

    if (errors['samePassword']) {
      return 'A nova senha deve ser diferente da senha atual.';
    }

    return null;
  }

  private loadProfile(): void {
    const sessionUser = this.authService.getCurrentUser();
    this.loadingProfile = !sessionUser;

    if (sessionUser) {
      this.profile = this.mapSessionToProfile(sessionUser);
      this.patchProfileForm(this.profile);
    }

    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.patchProfileForm(profile);
        this.loadingProfile = false;
      },
      error: () => {
        this.profileFeedback = {
          type: 'error',
          message: 'Não foi possível sincronizar os dados mais recentes do perfil.',
        };
        this.loadingProfile = false;
      },
    });
  }

  private patchProfileForm(profile: MobileProfile): void {
    this.profileForm.patchValue({
      nomeExibicao:
        profile.tipo === 'PJ' ? profile.razaoSocial || '' : profile.nome || '',
      documento: profile.tipo === 'PJ' ? profile.cnpj || '' : profile.cpf || '',
      email: profile.email || '',
      telefone: profile.telefone || '',
    });
  }

  private normalizeOptional(value: string | null | undefined): string | null {
    const normalized = value?.trim() || '';
    return normalized.length > 0 ? normalized : null;
  }

  private mapSessionToProfile(user: AuthenticatedUser): MobileProfile {
    const tipo = user.cnpj ? 'PJ' : 'PF';
    const nome = user.nome?.trim() || 'Cliente';

    return {
      id: String(user.id || ''),
      tipo,
      nome: tipo === 'PF' ? nome : null,
      razaoSocial: tipo === 'PJ' ? nome : null,
      email: user.email?.trim() || '',
      telefone: user.telefone?.trim() || null,
      cpf: user.cpf?.trim() || null,
      cnpj: user.cnpj?.trim() || null,
    };
  }

  private passwordsMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const novaSenha = control.get('novaSenha')?.value;
      const confirmarNovaSenha = control.get('confirmarNovaSenha')?.value;

      if (!novaSenha || !confirmarNovaSenha) {
        return null;
      }

      return novaSenha === confirmarNovaSenha
        ? null
        : { passwordMismatch: true };
    };
  }

  private newPasswordDiffersValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const senhaAtual = control.get('senhaAtual')?.value;
      const novaSenha = control.get('novaSenha')?.value;

      if (!senhaAtual || !novaSenha) {
        return null;
      }

      return senhaAtual !== novaSenha ? null : { samePassword: true };
    };
  }

  protected closeSuccessModal(): void {
    this.successMessage = null;
    this.changeDetectorRef.markForCheck();
  }
}
