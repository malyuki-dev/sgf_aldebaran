import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-totem-tipo-atendimento',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './totem-tipo-atendimento.component.html',
  styleUrls: ['./totem-tipo-atendimento.component.scss']
})
export class TotemTipoAtendimentoComponent {

  constructor(private router: Router) {}

  selecionarConvencional() {
    console.log('Selecionou: Convencional');
    
    // CORREÇÃO: O nome da propriedade agora é 'tipoAtendimento'
    this.router.navigate(['/totem/categoria'], { 
      state: { tipoAtendimento: 'convencional' } 
    });
  }

  selecionarPreferencial() {
    console.log('Selecionou: Preferencial');
    
    // CORREÇÃO: O nome da propriedade agora é 'tipoAtendimento'
    this.router.navigate(['/totem/categoria'], { 
      state: { tipoAtendimento: 'preferencial' } 
    });
  }
}