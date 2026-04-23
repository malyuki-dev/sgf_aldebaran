import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertTriangle, LucideAngularModule, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-settings-danger-zone',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './settings-danger-zone.component.html',
  styleUrl: './settings-danger-zone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDangerZoneComponent {
  @Input() deleting = false;
  @Output() deleteRequested = new EventEmitter<void>();

  protected readonly icons = {
    alert: AlertTriangle,
    trash: Trash2,
  };
}
