import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Clock, Users, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.scss'
})
export class TicketComponent implements OnInit, OnDestroy {
  dados: any = null;
  interval: any;
  
  readonly icons = { clock: Clock, users: Users, pin: MapPin };

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if(id) {
      this.fetch(id);
      this.interval = setInterval(() => this.fetch(id), 5000);
    }
  }

  ngOnDestroy() { clearInterval(this.interval); }

  fetch(id: string) {
    this.api.get<any>(`/fila/status/${id}`).subscribe(res => this.dados = res);
  }
}