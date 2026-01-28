import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
// Ajuste o caminho do import conforme a profundidade da sua pasta
// Se estiver em src/app/pages/mobile/comprovante/, são 3 níveis acima
import { ApiService } from '../../../services/api.service'; 
import { LucideAngularModule, Calendar, Clock, User, FileText, CheckCircle, MapPin } from 'lucide-angular';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-comprovante',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './comprovante.component.html',
  styleUrl: './comprovante.component.scss'
})
export class ComprovanteComponent implements OnInit {
  dados: any = null;
  loading = true;
  qrCodeImage: string = '';

  readonly icons = { 
    calendar: Calendar, 
    clock: Clock, 
    user: User, 
    file: FileText, 
    check: CheckCircle, 
    map: MapPin 
  };

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.get<any>(`/fila/agendamento/${id}`).subscribe({
        next: (res) => {
          this.dados = res;
          this.loading = false;
          // Gera o QR Code assim que os dados chegam
          this.gerarQR(`AGENDAMENTO:${res.id}`);
        },
        error: () => { this.loading = false; }
      });
    }
  }

  async gerarQR(texto: string) {
    try {
      this.qrCodeImage = await QRCode.toDataURL(texto, { width: 150, margin: 1 });
    } catch (err) {
      console.error(err);
    }
  }
}