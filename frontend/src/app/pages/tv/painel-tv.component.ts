import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Droplets, Volume2 } from 'lucide-angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-painel-tv',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './painel-tv.component.html',
  styleUrl: './painel-tv.component.scss'
})
export class PainelTvComponent implements OnInit, OnDestroy {
  senha: any = null;
  history: any[] = [];
  private interval: any;
  private lastId: number | null = null;
  private audio = new Audio('/ding.mp3'); // Certifique-se de ter este arquivo na pasta 'public'

  readonly icons = { droplets: Droplets, volume: Volume2 };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetch();
    this.interval = setInterval(() => this.fetch(), 2000);
  }

  ngOnDestroy() { clearInterval(this.interval); }

  fetch() {
    this.api.get<any[]>('/fila/painel').subscribe(res => {
      if (res.length > 0) {
        this.history = res.slice(1, 6);
        const atual = res[0];
        if (this.lastId !== atual.id) {
          this.senha = atual;
          this.tocarSom();
          this.lastId = atual.id;
        }
      }
    });
  }

  tocarSom() {
    this.audio.play().catch(() => {});
    if ('speechSynthesis' in window) {
      const texto = `Senha ${this.senha.numeroDisplay.split('').join(' ')} Guichê 1`;
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      setTimeout(() => window.speechSynthesis.speak(u), 1000);
    }
  }
}