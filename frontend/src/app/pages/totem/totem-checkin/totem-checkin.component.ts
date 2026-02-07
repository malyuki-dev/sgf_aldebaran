import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Necessário para o [(ngModel)]

@Component({
  selector: 'app-totem-checkin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './totem-checkin.component.html',
  styleUrls: ['./totem-checkin.component.scss']
})
export class TotemCheckinComponent {

  // Controle de Visibilidade dos Modais
  mostrarModalCodigo: boolean = false;
  mostrarAjuda: boolean = false;

  // Armazena o código digitado no input
  codigoDigitado: string = '';

  constructor(private router: Router) {}

  // --- MODAL DE CÓDIGO ---
  
  abrirModalCodigo() {
    this.mostrarModalCodigo = true;
    this.codigoDigitado = ''; // Limpa o campo ao abrir
    
    // Opcional: Dar foco no input automaticamente (requer ViewChild, mas o usuário pode clicar)
  }

  fecharModalCodigo() {
    this.mostrarModalCodigo = false;
  }

  confirmarCodigo() {
    if (this.codigoDigitado.trim().length > 0) {
      console.log('Código confirmado:', this.codigoDigitado);
      
      // Simulação de sucesso
      // this.router.navigate(['/totem/confirmacao-agendamento']);
      
      this.fecharModalCodigo();
    }
  }

  // --- MODAL DE AJUDA ---

  abrirAjuda() {
    this.mostrarAjuda = true;
  }

  fecharAjuda() {
    this.mostrarAjuda = false;
  }

  // CORREÇÃO AQUI: Mudamos 'KeyboardEvent' para 'any' para evitar o erro do TypeScript
  @HostListener('window:keydown.enter', ['$event'])
  handleEnter(event: any) {
    // Se o modal de código estiver aberto, o Enter confirma
    if (this.mostrarModalCodigo) {
      this.confirmarCodigo();
    }
  }
}