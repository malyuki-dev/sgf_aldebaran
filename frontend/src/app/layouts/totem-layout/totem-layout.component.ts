import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TotemConfigService } from '../../services/totem-config.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-totem-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './totem-layout.component.html',
  styleUrl: './totem-layout.component.scss'
})
export class TotemLayoutComponent implements OnInit {
  constructor(
    private configService: TotemConfigService,
    private api: ApiService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Se o totem não estiver mais com filial válida, redireciona para a tela de autenticação
    const isValid = await this.configService.validateConfig(this.api);
    if (
      !isValid &&
      !this.router.url.includes('/totem/configtot') &&
      !this.router.url.includes('/totem/setup')
    ) {
      this.router.navigate(['/totem/configtot']);
    }
  }
}
