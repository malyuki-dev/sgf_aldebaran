import { Component, ChangeDetectorRef } from '@angular/core'; // <--- 1. Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Building2, Mail, Lock, Hash, Check } from 'lucide-angular';
import { ClientAuthService } from '../../../services/client-auth.service';

@Component({
  selector: 'app-client-signup',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './client-signup.component.html',
  styleUrls: ['./client-signup.component.scss']
})
export class ClientSignupComponent {
  step: 'FORM' | 'SUCCESS' = 'FORM';
  tipo: 'PF' | 'PJ' = 'PF';
  carregando: boolean = false;
  
  dados = { nome: '', cpf: '', razao: '', cnpj: '', email: '', senha: '' };
  
  readonly icons = { user: User, building: Building2, mail: Mail, lock: Lock, hash: Hash, check: Check };

  constructor(
    private authService: ClientAuthService,
    private cd: ChangeDetectorRef // <--- 2. Injetar o detector de mudanças
  ) {}

  criar() {
    this.carregando = true;

    const payload = {
      tipo: this.tipo,
      email: this.dados.email,
      senha: this.dados.senha,
      ...(this.tipo === 'PF' 
          ? { nome: this.dados.nome, cpf: this.dados.cpf } 
          : { razao: this.dados.razao, cnpj: this.dados.cnpj }
      )
    };

    this.authService.signup(payload).subscribe({
      next: (res: any) => {
        console.log('Sucesso:', res);
        this.carregando = false;
        
        // Atualiza a variável
        this.step = 'SUCCESS';
        
        // <--- 3. O PULO DO GATO: Obriga o Angular a atualizar a tela AGORA
        this.cd.detectChanges(); 
      },
      error: (err: any) => {
        console.error('Erro:', err);
        this.carregando = false;
        alert(err.error?.message || 'Erro ao conectar no servidor.');
        
        // Também é bom forçar aqui caso o loading trave
        this.cd.detectChanges(); 
      }
    });
  }
}