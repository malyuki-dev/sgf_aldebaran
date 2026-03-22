import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterOutlet } from '@angular/router';
import { LucideAngularModule, Building2, Layers, Layout, Settings } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-estrutura-filiais',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LucideAngularModule, FormsModule],
  templateUrl: './estrutura-filiais.component.html',
  styleUrls: ['./estrutura-filiais.component.scss']
})
export class EstruturaFiliaisComponent implements OnInit {
  currentTab = 'filiais';
  filiais: any[] = [];
  selectedFilialId: number | null = null;
  loading = false;

  readonly icons = { 
    building: Building2, 
    layers: Layers, 
    layout: Layout, 
    settings: Settings 
  };

  tabs = [
    { id: 'filiais', label: 'Filiais', icon: this.icons.building, route: '/admin/servicos/filiais' },
    { id: 'categorias', label: 'Categorias de Fila', icon: this.icons.layers, route: '/admin/servicos/categorias' },
    { id: 'guiches', label: 'Guichês / Baias', icon: this.icons.layout, route: '/admin/servicos/guiches' },
    { id: 'regras', label: 'Regras de Fila', icon: this.icons.settings, route: '/admin/servicos/regras' }
  ];

  constructor(
    private router: Router,
    private api: ApiService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentTab(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit(): void {
    this.updateCurrentTab(this.router.url);
    this.carregarFiliais();
    
    // Inicializar filial selecionada a partir da URL se existir
    const urlTree = this.router.parseUrl(this.router.url);
    const fid = urlTree.queryParams['filialId'];
    if (fid) {
      this.selectedFilialId = Number(fid);
    }
  }

  carregarFiliais() {
    this.loading = true;
    this.api.get<any[]>('/filiais').subscribe({
      next: (res: any[]) => {
        this.filiais = res.filter((f: any) => f.ativo);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar filiais:', err);
        this.loading = false;
      }
    });
  }

  onFilialChange() {
    // Atualiza a URL com o novo filialId sem recarregar a página
    this.router.navigate([], {
      relativeTo: this.router.routerState.root, // Use root for better stability
      queryParams: { filialId: this.selectedFilialId },
      queryParamsHandling: 'merge'
    });
  }

  updateCurrentTab(url: string) {
    if (url.includes('/categorias')) this.currentTab = 'categorias';
    else if (url.includes('/guiches')) this.currentTab = 'guiches';
    else if (url.includes('/regras')) this.currentTab = 'regras';
    else this.currentTab = 'filiais';
  }
}
