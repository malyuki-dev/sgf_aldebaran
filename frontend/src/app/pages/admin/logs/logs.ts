import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, FileText, Search, Download } from 'lucide-angular';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [DatePipe],
  templateUrl: './logs.html',
  styleUrls: ['./logs.scss']
})
export class Logs implements OnInit {
  logs: any[] = [];
  filteredLogs: any[] = [];
  loading = false;
  searchQuery = '';

  readonly icons = { fileText: FileText, search: Search, download: Download };

  constructor(private api: ApiService, private datePipe: DatePipe) { }

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.loading = true;
    this.api.get<any[]>('/logs').subscribe({
      next: (data) => {
        this.logs = data;
        this.filteredLogs = data;
      },
      error: (err) => console.error(err),
      complete: () => {
        this.loading = false;
      }
    });
  }

  filtrar() {
    if (!this.searchQuery) {
      this.filteredLogs = this.logs;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredLogs = this.logs.filter(l =>
      l.acao.toLowerCase().includes(q) ||
      l.descricao.toLowerCase().includes(q)
    );
  }

  exportData() {
    alert("Função de exportação CSV será implementada em atualizações futuras.");
  }
}
