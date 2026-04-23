import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChevronRight, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-settings-link-item',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './settings-link-item.component.html',
  styleUrl: './settings-link-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsLinkItemComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Output() itemClick = new EventEmitter<void>();

  protected readonly icons = {
    chevron: ChevronRight,
  };
}
