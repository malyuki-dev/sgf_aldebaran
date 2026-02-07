import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
// Importamos TODOS os ícones que o HTML pede
import { LucideAngularModule, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Check, Plus, Minus, Milk } from 'lucide-angular';

@Component({
  selector: 'app-client-schedule',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './client-schedule.component.html',
  styleUrls: ['./client-schedule.component.scss']
})
export class ClientScheduleComponent {
  qty: number = 25;
  showModal: boolean = false;

  // Definição dos ícones usados no HTML
  readonly icons = { 
    arrowLeft: ArrowLeft, 
    chevronDown: ChevronDown, 
    chevronLeft: ChevronLeft, 
    chevronRight: ChevronRight, 
    check: Check, 
    plus: Plus, 
    minus: Minus, 
    jug: Milk 
  };

  incrementarQty() { this.qty++; }
  
  decrementarQty() { 
    if (this.qty > 1) this.qty--; 
  }
  
  confirmar() { 
    this.showModal = true; 
  }
}