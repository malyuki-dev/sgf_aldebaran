import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Building2, Monitor, UserCheck, Clock, ChevronDown } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = {
    filiais: 0,
    guiches: 0,
    atendimentos: 0,
    esperaMedio: 0
  };

  atividadesRecentes: any[] = [];
  loading = true;
  filiais: any[] = [];
  selectedFilialId: number | null = null;
  selectedFilialName: string = '';

  private intervalId: any;

  readonly icons = {
    building: Building2,
    monitor: Monitor,
    userCheck: UserCheck,
    clock: Clock,
    chevronDown: ChevronDown
  };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.carregarFiliais();
    this.fetchData();
    this.intervalId = setInterval(() => this.fetchData(), 15000);
  }

  carregarFiliais() {
    this.api.get<any[]>('/filiais').subscribe({
      next: (res) => {
        this.filiais = res.filter(f => f.ativo);
        this.updateSelectedFilialName(); // Call after filiais are loaded
      },
      error: (err) => console.error('Erro ao carregar filiais:', err)
    });
  }

  updateSelectedFilialName() {
    const filial = this.filiais.find(f => f.id === this.selectedFilialId);
    this.selectedFilialName = filial ? filial.nome : 'Todas as Unidades';
  }

  onFilialChange() {
    this.updateSelectedFilialName();
    this.fetchData();
  }

  fetchData() {
    const query = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
    this.api.get<any>(`/dashboard/metrics${query}`).subscribe({
      next: (res) => {
        this.stats = {
          filiais: res.cards.filiaisAtivas,
          guiches: res.cards.guichesAtivos,
          atendimentos: res.cards.atendimentosHoje,
          esperaMedio: res.cards.tempoMedioEspera
        };
        this.atividadesRecentes = res.atividadeRecente;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erro ao buscar métricas:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}