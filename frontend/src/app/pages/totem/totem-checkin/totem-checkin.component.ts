import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TotemService } from '../../../services/totem.service';

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

  constructor(
    private router: Router,
    private totemService: TotemService
  ) { }

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
    const codigoNormalizado = this.codigoDigitado.trim();
    if (codigoNormalizado.length > 0) {
      console.log('Código confirmado:', codigoNormalizado);
      this.totemService.validarCheckin(codigoNormalizado);
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