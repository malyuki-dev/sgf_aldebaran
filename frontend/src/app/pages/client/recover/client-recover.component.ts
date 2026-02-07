import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Mail, Check, Star, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-client-recover',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './client-recover.component.html',
  styleUrls: ['./client-recover.component.scss']
})
export class ClientRecoverComponent {
  step: 'FORM' | 'SUCCESS' = 'FORM';
  email: string = '';
  carregando: boolean = false;
  readonly icons = { mail: Mail, check: Check, star: Star, arrow: ArrowLeft };

  constructor(private router: Router) {}

  enviar() {
    if(!this.email) return;
    this.carregando = true;
    setTimeout(() => { this.carregando = false; this.step = 'SUCCESS'; }, 1500);
  }
}