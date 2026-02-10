import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Mail, Check, ArrowLeft, AlertCircle } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss']
})
export class RecoverComponent {
  
  step: 'FORM' | 'SUCCESS' = 'FORM';
  email: string = '';
  carregando: boolean = false;
  erro: boolean = false;

  readonly icons = {
    mail: Mail,
    check: Check,
    arrow: ArrowLeft,
    alert: AlertCircle
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef // <--- O Segredo para atualizar a tela
  ) {}

  enviar() {
    if (!this.email || !this.email.includes('@')) {
      alert('Por favor, digite um e-mail válido.');
      return;
    }

    this.carregando = true;
    this.erro = false;

    this.authService.recover(this.email).subscribe({
      next: (res) => {
        console.log('Sucesso:', res);
        
        this.carregando = false;
        this.step = 'SUCCESS'; // Troca a tela
        
        this.cd.detectChanges(); // <--- Força a atualização visual
      },
      error: (err) => {
        console.error('Erro:', err);
        this.carregando = false;
        
        // Se for 404, mostramos erro na tela. Se for outro, alert.
        if (err.status === 404) {
          this.erro = true;
        } else {
          alert('Erro ao conectar com o servidor.');
        }
        
        this.cd.detectChanges(); // <--- Força a atualização visual
      }
    });
  }
}