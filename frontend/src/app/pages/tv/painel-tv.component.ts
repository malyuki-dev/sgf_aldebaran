import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-painel-tv',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './painel-tv.component.html',
  styleUrls: ['./painel-tv.component.scss']
})
export class PainelTvComponent implements OnInit, OnDestroy {
  dataAtual = new Date();
  senhaAtual: any = null;
  ultimasChamadas: any[] = [];
  private subs: Subscription[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.subs.push(
      interval(1000).subscribe(() => this.dataAtual = new Date()),
      interval(5000).subscribe(() => this.atualizar())
    );
    this.atualizar();
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  atualizar() {
    this.apiService.get<any[]>('/fila/painel').subscribe({
      next: (dados) => {
        if (dados && dados.length > 0) {
          this.senhaAtual = dados[0];
          this.ultimasChamadas = dados.slice(1, 5);
        }
      }
    });
  }
}