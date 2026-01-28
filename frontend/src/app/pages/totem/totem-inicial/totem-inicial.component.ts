import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Ticket } from 'lucide-angular'; 

@Component({
  selector: 'app-totem-inicial',
  standalone: true,
  imports: [LucideAngularModule], 
  templateUrl: './totem-inicial.component.html',
  styleUrl: './totem-inicial.component.scss'
})
export class TotemInicialComponent {
  // Registra o ícone para usar no HTML
  readonly ticketIcon = Ticket;

  constructor(private router: Router) {}

  navegar() {
    // Navega para a próxima tela (que criaremos depois)
    this.router.navigate(['/totem/categoria']);
  }
}