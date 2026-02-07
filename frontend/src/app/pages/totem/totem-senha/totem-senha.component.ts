import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
// Importação dos ícones necessários
import { LucideAngularModule, Check, CheckCircle } from 'lucide-angular';
import { Ticket } from '../../../services/totem.service';

@Component({
  selector: 'app-totem-senha',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './totem-senha.component.html',
  styleUrls: ['./totem-senha.component.scss']
})
export class TotemSenhaComponent implements OnInit {

  ticket: Ticket | null = null;
  qrCodeUrl: string = '';
  
  // Ícones para o HTML
  readonly icons = { check: Check };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const state = history.state;
    
    // 1. Tenta pegar dados do estado (Navegação interna)
    if (state && state.ticket) {
      this.ticket = state.ticket;
      this.gerarQrCode();
    } else {
      // 2. Fallback: Pega da URL (se deu refresh)
      this.route.params.subscribe(params => {
        if (params['senha']) {
          this.ticket = {
            id: +params['id'],
            senha: params['senha'],
            tipo: 'Atendimento',
            categoria: 'Geral', // Será substituído pelo backend se possível
            dataHora: new Date().toLocaleString('pt-BR')
          };
          this.gerarQrCode();
        } else {
          this.router.navigate(['/totem']);
        }
      });
    }

    // Fluxo Automático: Imprime e Volta
    if (this.ticket) {
      // Espera 1s para carregar o visual e imprime
      setTimeout(() => {
        window.print();
      }, 1000);

      // Espera 6s e volta para o início
      setTimeout(() => {
        this.router.navigate(['/totem']);
      }, 6000);
    }
  }

  gerarQrCode() {
    if (!this.ticket) return;
    // Gera link para acompanhar pelo celular
    const linkMobile = `http://${window.location.hostname}:4200/mobile/${this.ticket.id}`;
    // API pública de QR Code (Rápida e Grátis)
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(linkMobile)}`;
  }
}