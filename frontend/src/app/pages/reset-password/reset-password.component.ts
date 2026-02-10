import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <--- 1. Importe ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Lock, Check, AlertCircle } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  
  step: 'FORM' | 'SUCCESS' = 'FORM';
  token: string = '';
  novaSenha: string = '';
  confirmarSenha: string = '';
  carregando: boolean = false;

  readonly icons = { lock: Lock, check: Check, alert: AlertCircle };

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef // <--- 2. Injete o detector aqui
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      // Se não tiver token, volta pro recover
      if (!this.token) {
        this.router.navigate(['/recover']);
      }
    });
  }

  redefinir() {
    if (this.novaSenha !== this.confirmarSenha) {
      alert('As senhas não coincidem.');
      return;
    }

    this.carregando = true;

    this.authService.resetPassword(this.token, this.novaSenha).subscribe({
      next: (res) => {
        console.log('Senha alterada:', res);
        
        // Atualiza o estado
        this.carregando = false;
        this.step = 'SUCCESS';
        
        // <--- 3. O PULO DO GATO: Força a tela a atualizar AGORA
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Erro:', err);
        this.carregando = false;
        alert('Erro ao redefinir senha. O link pode ter expirado.');
        
        // Força a tela a atualizar (para destravar o botão)
        this.cd.detectChanges();
      }
    });
  }
}