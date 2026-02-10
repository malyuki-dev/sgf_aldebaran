import { Component, ChangeDetectorRef } from '@angular/core'; // <--- 1. Importe isso
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Check, User, Hash, Building, Mail, Lock } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent { 
  
  step: 'FORM' | 'SUCCESS' = 'FORM';
  tipo: 'PF' | 'PJ' = 'PF'; 
  carregando: boolean = false;

  readonly icons = {
    check: Check,
    user: User,
    hash: Hash,
    building: Building,
    mail: Mail,
    lock: Lock
  };

  dados = {
    nome: '',
    email: '',
    cpf: '',
    cnpj: '',
    razao: '',
    senha: '',
    confirmarSenha: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef // <--- 2. Injete o detector aqui
  ) {}

  criar() {
    if (this.dados.senha !== this.dados.confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    this.carregando = true;

    const payload = {
      nome: this.dados.nome,
      email: this.dados.email,
      senha: this.dados.senha,
      tipo: this.tipo,
      documento: this.tipo === 'PF' ? this.dados.cpf : this.dados.cnpj,
      razaoSocial: this.tipo === 'PJ' ? this.dados.razao : null
    };

    this.authService.signup(payload).subscribe({
      next: (res) => {
        console.log('Sucesso:', res);
        
        // Atualiza as variáveis
        this.carregando = false;
        this.step = 'SUCCESS';
        
        // <--- 3. O PULO DO GATO: Força o Angular a atualizar a tela AGORA
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('Erro:', err);
        this.carregando = false;
        
        const mensagem = err.error?.message || 'Erro ao criar conta.';
        alert(mensagem);
        
        // Força atualização também no erro, para destravar o botão
        this.cd.detectChanges(); 
      }
    });
  }
}