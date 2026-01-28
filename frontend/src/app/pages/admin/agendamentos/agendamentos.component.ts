import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Calendar, Clock, User, MapPin, Phone, FileText } from 'lucide-angular';

@Component({
  selector: 'app-agendamentos',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './agendamentos.component.html',
  styleUrl: './agendamentos.component.scss'
})
export class AgendamentosComponent implements OnInit {
  agendamentos: any[] = [];
  loading = true;

  readonly icons = { calendar: Calendar, clock: Clock, user: User, map: MapPin, phone: Phone, file: FileText };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/fila/agendamento').subscribe({
      next: (res) => { this.agendamentos = res; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  formatarData(dataStr: string) {
    if (!dataStr) return "-";
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}