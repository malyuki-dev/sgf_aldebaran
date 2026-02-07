import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Menu, Bell, FileText, ChevronRight, HelpCircle, Plus } from 'lucide-angular';

// --- CORREÇÃO DO CAMINHO ---
import { ClientMenuComponent } from '../components/client-menu/client-menu.component';

@Component({
  selector: 'app-client-appointments',
  standalone: true,
  // RouterLink está aqui. Se o HTML usar routerLink, o aviso amarelo some.
  imports: [CommonModule, RouterLink, LucideAngularModule, ClientMenuComponent],
  templateUrl: './client-appointments.component.html',
  styleUrls: ['./client-appointments.component.scss']
})
export class ClientAppointmentsComponent implements OnInit {
  menuAberto: boolean = false;
  usuarioNome: string = 'Visitante';

  readonly icons = { 
    menu: Menu, 
    bell: Bell, 
    file: FileText,
    chevron: ChevronRight,
    help: HelpCircle,
    plus: Plus
  };

  ngOnInit() {
    const userJson = localStorage.getItem('client_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.usuarioNome = user.nome.split(' ')[0]; 
      } catch (e) {
        console.error('Erro', e);
      }
    }
  }
}