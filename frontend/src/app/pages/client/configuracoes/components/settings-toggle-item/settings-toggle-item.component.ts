import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-toggle-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-toggle-item.component.html',
  styleUrl: './settings-toggle-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsToggleItemComponent {
  @Input({ required: true }) label = '';
  @Input() description = '';
  @Input() checked = false;
  @Input() disabled = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  protected toggle(): void {
    if (this.disabled) {
      return;
    }

    this.checkedChange.emit(!this.checked);
  }
}
