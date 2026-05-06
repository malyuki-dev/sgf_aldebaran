import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { PainelConfigService } from '../../../services/painel-config.service';
import { LucideAngularModule, Monitor, Check, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-painel-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './painel-setup.component.html',
  styleUrls: ['./painel-setup.component.scss']
})
export class PainelSetupComponent implements OnInit {
  filiais: any[] = [];
  selectedFilialId: number | null = null;
  loading = false;

  readonly icons = {
    monitor: Monitor,
    check: Check,
    arrow: ArrowRight
  };

  constructor(
    private api: ApiService,
    private configService: PainelConfigService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarFiliais();
    this.selectedFilialId = this.configService.getFilialId();
  }

  carregarFiliais() {
    this.loading = true;
    this.api.get<any[]>('/filiais/public/list').subscribe({
      next: (res) => {
        this.filiais = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar filiais:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmarConfiguracao() {
    if (!this.selectedFilialId) return;

    const filial = this.filiais.find(f => f.id === this.selectedFilialId);
    if (filial) {
      this.configService.setFilial(filial.id, filial.nome);
      this.router.navigate(['/painel']);
    }
  }
}
