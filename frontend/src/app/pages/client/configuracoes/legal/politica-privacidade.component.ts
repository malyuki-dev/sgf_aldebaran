import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalDocumentComponent } from './legal-document.component';
import { PRIVACY_POLICY_CONTENT } from './legal-content';

@Component({
  selector: 'app-politica-privacidade',
  standalone: true,
  imports: [LegalDocumentComponent],
  template: '<app-legal-document [content]="content"></app-legal-document>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliticaPrivacidadeComponent {
  protected readonly content = PRIVACY_POLICY_CONTENT;
}
