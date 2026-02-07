import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, X, Home, Calendar, FileText, UserCircle, HelpCircle, LogOut } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './client-menu.component.html',
  styleUrls: ['./client-menu.component.scss']
})
export class ClientMenuComponent {
  @Output() close = new EventEmitter<void>();

  readonly icons = {
    close: X,
    home: Home,
    calendar: Calendar,
    file: FileText,
    user: UserCircle,
    help: HelpCircle,
    logout: LogOut
  };

  constructor(private router: Router) {}

  fechar() {
    this.close.emit();
  }

  logout() {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_user');
    this.router.navigate(['/client/login']);
  }
}