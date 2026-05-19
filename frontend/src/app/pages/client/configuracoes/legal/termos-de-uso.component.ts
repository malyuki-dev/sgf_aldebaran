import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalDocumentComponent } from './legal-document.component';
import { TERMS_OF_USE_CONTENT } from './legal-content';

@Component({
  selector: 'app-termos-de-uso',
  standalone: true,
  imports: [LegalDocumentComponent],
  template: '<app-legal-document [content]="content"></app-legal-document>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermosDeUsoComponent {
  protected readonly content = TERMS_OF_USE_CONTENT;
}
