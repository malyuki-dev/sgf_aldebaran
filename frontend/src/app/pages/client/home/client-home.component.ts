import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Menu, Bell, Plus, ChevronRight, FileText, HelpCircle } from 'lucide-angular';

// --- CORREÇÃO DO CAMINHO (Apenas um ponto-ponto) ---
import { ClientMenuComponent } from '../components/client-menu/client-menu.component';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ClientMenuComponent],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss']
})
export class ClientHomeComponent implements OnInit {
  menuAberto: boolean = false;
  usuarioNome: string = 'Visitante';

  readonly icons = {
    menu: Menu,
    bell: Bell,
    plus: Plus,
    chevron: ChevronRight,
    file: FileText,
    help: HelpCircle
  };

  ngOnInit() {
    const userJson = localStorage.getItem('client_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.usuarioNome = user.nome.split(' ')[0];
      } catch (e) {
        console.error('Erro ao ler usuário', e);
      }
    }
  }
}