import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TotemService } from '../../../services/totem.service';

@Component({
  selector: 'app-totem-tipo-atendimento',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './totem-tipo-atendimento.component.html',
  styleUrls: ['./totem-tipo-atendimento.component.scss']
})
export class TotemTipoAtendimentoComponent {

  constructor(private totemService: TotemService) {}

  // CORREÇÃO: Criamos a função específica para o Convencional que o HTML pede
  selecionarConvencional() {
    this.totemService.escolherTipo('Convencional');
  }

  // CORREÇÃO: Criamos a função específica para o Preferencial que o HTML pede
  selecionarPreferencial() {
    this.totemService.escolherTipo('Preferencial');
  }
}