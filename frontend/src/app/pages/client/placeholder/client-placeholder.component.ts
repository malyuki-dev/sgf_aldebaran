import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowRight, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-client-placeholder',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './client-placeholder.component.html',
  styleUrl: './client-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientPlaceholderComponent {
  protected readonly icons = {
    arrow: ArrowRight,
    sparkles: Sparkles,
  };

  protected readonly title: string;
  protected readonly description: string;

  constructor(private readonly route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] ?? 'Em construção';
    this.description =
      this.route.snapshot.data['description'] ??
      'Esta área está preparada para a próxima etapa de integração.';
  }
}
