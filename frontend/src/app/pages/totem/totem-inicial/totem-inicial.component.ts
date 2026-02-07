import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-totem-inicial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './totem-inicial.component.html',
  styleUrls: ['./totem-inicial.component.scss']
})
export class TotemInicialComponent {

  constructor(private router: Router) {}

  // Ação do botão "Tenho Agendamento"
  navegarParaCheckin() {
    console.log('Navegando para Check-in...');
    this.router.navigate(['/totem/checkin']);
  }

  // Ação do botão "Retirar Senha"
  navegarParaSenha() {
    console.log('Navegando para Retirada de Senha...');
    this.router.navigate(['/totem/tipo-atendimento']);
  }
}