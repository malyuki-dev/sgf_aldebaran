import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, CheckCircle, Printer } from 'lucide-angular';

@Component({
  selector: 'app-totem-senha',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './totem-senha.component.html',
  styleUrl: './totem-senha.component.scss'
})
export class TotemSenhaComponent implements OnInit {
  senhaNumero: string = '';
  senhaId: string = '';
  qrCodeUrl: string = ''; // A URL da imagem do QR Code
  
  readonly icons = {
    check: CheckCircle,
    print: Printer
  };

  dataHoje = new Date();

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.senhaId = params['id'];
      this.senhaNumero = params['numero'];
      
      // 1. O Link que o celular vai abrir
      const linkParaCelular = `http://${window.location.hostname}:4200/mobile/${this.senhaId}`;
      
      // 2. A URL que gera a IMAGEM do QR Code (Usando API do QRServer)
      // Isso cria uma imagem png apontando para o link acima
      this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(linkParaCelular)}`;
    });

    // Volta para o início em 10s
    setTimeout(() => {
      this.router.navigate(['/totem']);
    }, 10000);
  }

  imprimir() {
    window.print();
  }
}