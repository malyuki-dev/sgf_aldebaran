import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, ActivatedRoute } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, Users, Building, Truck, Fingerprint, Building2, ChevronDown } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-cadastros-gerais',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LucideAngularModule, FormsModule],
  templateUrl: './cadastros-gerais.html',
  styleUrls: ['./cadastros-gerais.scss']
})
export class CadastrosGerais implements OnInit {
  currentTab = 'usuarios';
  filiais: any[] = [];
  selectedFilialId: number | null = null;
  selectedFilialName: string = '';

  readonly icons = { 
    users: Users, 
    building: Building, 
    truck: Truck, 
    list: Fingerprint,
    buildingSelect: Building2,
    chevronDown: ChevronDown
  };

  tabs = [
    { id: 'usuarios', label: 'Usuários do Sistema', icon: this.icons.users, route: '/admin/cadastros/usuarios' },
    { id: 'clientes', label: 'Clientes', icon: this.icons.building, route: '/admin/cadastros/clientes' },
    { id: 'motoristas', label: 'Caminhoneiros', icon: this.icons.truck, route: '/admin/cadastros/motoristas' },
    { id: 'caminhoes', label: 'Caminhões', icon: this.icons.list, route: '/admin/cadastros/caminhoes' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService
  ) {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentTab(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit(): void {
    this.updateCurrentTab(this.router.url);
    this.carregarFiliais();
    
    // Pegar filial dos query params no carregamento inicial
    this.route.queryParams.subscribe(params => {
      if (params['filialId']) {
        this.selectedFilialId = +params['filialId'];
        this.updateSelectedFilialName();
      }
    });
  }

  carregarFiliais() {
    this.api.get<any[]>('/filiais').subscribe({
      next: (res) => {
        this.filiais = res.filter(f => f.ativo);
        this.updateSelectedFilialName();
      },
      error: (err) => console.error('Erro ao carregar filiais:', err)
    });
  }

  onFilialChange() {
    this.updateSelectedFilialName();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filialId: this.selectedFilialId },
      queryParamsHandling: 'merge'
    });
  }

  updateSelectedFilialName() {
    const filial = this.filiais.find(f => f.id === this.selectedFilialId);
    this.selectedFilialName = filial ? filial.nome : 'Todas as Unidades';
  }

  updateCurrentTab(url: string) {
    if (url.includes('/clientes')) this.currentTab = 'clientes';
    else if (url.includes('/motoristas')) this.currentTab = 'motoristas';
    else if (url.includes('/caminhoes')) this.currentTab = 'caminhoes';
    else this.currentTab = 'usuarios';
  }
}
