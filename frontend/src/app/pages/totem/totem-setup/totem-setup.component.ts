import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { TotemConfigService } from '../../../services/totem-config.service';
import { LucideAngularModule, Building2, Check, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-totem-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './totem-setup.component.html',
  styleUrls: ['./totem-setup.component.scss']
})
export class TotemSetupComponent implements OnInit {
  filiais: any[] = [];
  selectedFilialId: number | null = null;
  loading = false;

  readonly icons = {
    building: Building2,
    check: Check,
    arrow: ArrowRight
  };

  constructor(
    private api: ApiService,
    private configService: TotemConfigService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarFiliais();
    // Se já estiver configurado, podemos mostrar a opção de reconfigurar ou apenas avisar
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
      console.log('Totem configurado para:', filial.nome);
      this.router.navigate(['/totem']);
    }
  }
}
