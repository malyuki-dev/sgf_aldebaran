import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Check, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-cliente-success-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './cliente-success-modal.component.html',
  styleUrl: './cliente-success-modal.component.scss',
})
export class ClienteSuccessModalComponent {
  @Input({ required: true }) message = '';
  @Input() title = 'Sucesso!';
  @Output() closed = new EventEmitter<void>();

  protected readonly icon = Check;
}
