import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Menu, Bell, ChevronLeft, ChevronRight, Minus, Plus, Check, MapPin, Package } from 'lucide-angular';

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './agendamento.component.html',
  styleUrls: ['./agendamento.component.scss']
})
export class AgendamentoComponent {

  form = {
    filial: 'Filial Norte',
    categoria: 'Caminhão',
    quantidade: 25,
    data: 15,
    hora: '10:00',
    obs: ''
  };

  filiais = ['Filial Norte', 'Filial Sul', 'Matriz Centro'];
  categorias = ['Caminhão', 'Carro Utilitário', 'Retirada Manual'];

  // --- CORREÇÃO AQUI ---
  // Trocamos os objetos vazios por 'null'. Assim o HTML não imprime nada.
  diasCalendario: any[] = [
    null, null, null, // Dias vazios antes do dia 1º (Qua)
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 
    15, // Selecionado
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31
  ];

  horarios = [
    '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  readonly icons = {
    menu: Menu, bell: Bell, left: ChevronLeft, right: ChevronRight,
    minus: Minus, plus: Plus, check: Check, map: MapPin, box: Package
  };

  inc() { this.form.quantidade++; }
  dec() { if (this.form.quantidade > 1) this.form.quantidade--; }

  selecionarDia(dia: any) { 
    if (dia) this.form.data = dia; 
  }
  
  selecionarHora(hora: string) { 
    this.form.hora = hora; 
  }

  confirmar() {
    alert(`Agendamento Confirmado!\nDia: ${this.form.data}/01/2025\nHora: ${this.form.hora}\nQtd: ${this.form.quantidade}`);
  }
}