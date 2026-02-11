import { Component, OnInit } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Menu, Bell, Calendar, Plus, List, HelpCircle, ChevronRight, LayoutGrid } from 'lucide-angular';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss']
})
export class ClientHomeComponent implements OnInit {

  usuario = { nome: 'Visitante' };
  hoje: number = Date.now(); // Pega a data de hoje

  readonly icons = {
    menu: Menu, bell: Bell, calendar: Calendar, plus: Plus, 
    list: List, help: HelpCircle, chevron: ChevronRight, grid: LayoutGrid
  };

  ngOnInit() {
    const nomeSalvo = localStorage.getItem('usuario_nome');
    if (nomeSalvo) {
      this.usuario.nome = nomeSalvo;
    }
  }
}