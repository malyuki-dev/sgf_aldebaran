import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ArrowLeft, FileText, LucideAngularModule } from 'lucide-angular';
import { LegalDocumentContent } from './legal-content';

@Component({
  selector: 'app-legal-document',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './legal-document.component.html',
  styleUrl: './legal-document.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalDocumentComponent {
  @Input({ required: true }) content!: LegalDocumentContent;

  protected readonly icons = {
    back: ArrowLeft,
    document: FileText,
  };

  constructor(private readonly router: Router) {}

  protected back(): void {
    this.router.navigate(['/client/configuracoes']);
  }
}
