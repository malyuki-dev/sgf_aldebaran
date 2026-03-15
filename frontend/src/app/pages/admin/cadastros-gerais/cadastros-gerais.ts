import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, Users, Building, Truck, Fingerprint } from 'lucide-angular';

@Component({
  selector: 'app-cadastros-gerais',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LucideAngularModule],
  templateUrl: './cadastros-gerais.html',
  styleUrls: ['./cadastros-gerais.scss']
})
export class CadastrosGerais implements OnInit {
  currentTab = 'usuarios';

  readonly icons = { users: Users, building: Building, truck: Truck, list: Fingerprint };

  tabs = [
    { id: 'usuarios', label: 'Usuários (Operadores)', icon: this.icons.users, route: '/admin/cadastros/usuarios' },
    { id: 'clientes', label: 'Clientes', icon: this.icons.building, route: '/admin/cadastros/clientes' },
    { id: 'motoristas', label: 'Motoristas', icon: this.icons.truck, route: '/admin/cadastros/motoristas' },
    { id: 'caminhoes', label: 'Caminhões', icon: this.icons.list, route: '/admin/cadastros/caminhoes' }
  ];

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentTab(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit(): void {
    this.updateCurrentTab(this.router.url);
  }

  updateCurrentTab(url: string) {
    if (url.includes('/clientes')) this.currentTab = 'clientes';
    else if (url.includes('/motoristas')) this.currentTab = 'motoristas';
    else if (url.includes('/caminhoes')) this.currentTab = 'caminhoes';
    else this.currentTab = 'usuarios';
  }
}
