import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, MessageCircle, Ticket, BookOpen, Clock, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-suporte',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './suporte.html',
  styleUrls: ['./suporte.scss'],
})
export class SuporteComponent {
  readonly icons = {
    search: Search,
    whatsapp: MessageCircle,
    chamado: Ticket,
    tutoriais: BookOpen,
    historico: Clock,
    chevron: ChevronRight
  };
}
