import { Component, ChangeDetectorRef } from '@angular/core'; // <--- Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Megaphone, UserCheck } from 'lucide-angular';

@Component({
  selector: 'app-atendimento',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './atendimento.component.html',
  styleUrl: './atendimento.component.scss'
})
export class AtendimentoComponent {
  senhaAtual: string | null = null;
  loading = false;
  
  readonly icons = { megaphone: Megaphone, check: UserCheck };

  // Injetar o cdr no construtor
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef 
  ) {}

  chamarProximo() {
    if (this.loading) return;

    this.loading = true;
    console.log("Iniciando chamada...");

    this.api.post<any>('/fila/chamar_proximo', { guiche: 1 }).subscribe({
      next: (res) => {
        console.log("Resposta do Backend:", res);
        
        if (res && res.numeroDisplay) {
          this.senhaAtual = res.numeroDisplay;
        } else {
          // Tenta procurar em propriedade aninhada por segurança
          this.senhaAtual = res?.senha?.numeroDisplay || res?.numeroDisplay;
        }
        
        this.loading = false;
        this.cdr.detectChanges(); // <--- O PULO DO GATO: Atualiza a tela AGORA
      },
      error: (err) => {
        console.error("Erro ao chamar:", err);
        
        if (err.status === 404) {
          alert("A fila está vazia! ☕");
        } else {
          alert("Erro ao chamar próximo.");
        }
        
        this.loading = false;
        this.cdr.detectChanges(); // Destrava o botão mesmo com erro
      }
    });
  }
}