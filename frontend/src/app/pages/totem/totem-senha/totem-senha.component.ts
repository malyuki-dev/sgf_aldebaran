import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TotemService, Ticket } from '../../../services/totem.service';

@Component({
  selector: 'app-totem-senha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './totem-senha.component.html',
  // --- AQUI ESTÁ A MÁGICA: O ESTILO DENTRO DO COMPONENTE ---
  styles: [`
    /* ESTILO GERAL */
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .totem-container {
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      font-family: 'Roboto', sans-serif;
      text-align: center;
    }

    .ticket-card {
      background: white;
      width: 380px;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }

    .brand-logo {
      width: 180px;  /* Força o logo a ficar pequeno */
      height: auto;
      margin-bottom: 20px;
      display: block;
    }

    .success-msg {
      color: #00796b;
      font-size: 1.2rem;
      font-weight: 500;
      margin-bottom: 15px;
    }

    .senha-big {
      font-size: 4.5rem;
      font-weight: 900;
      color: #000;
      margin: 10px 0;
      letter-spacing: -2px;
      line-height: 1;
    }

    .info-box {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 10px;
      margin: 20px 0;
      width: 100%;
      box-sizing: border-box;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      border-bottom: 1px dashed #ccc;
      padding-bottom: 4px;
      font-size: 0.95rem;
      color: #555;
    }

    .info-row strong { color: #000; }

    .qr-section {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .qr-img {
      width: 120px;
      height: 120px;
    }

    .status-print {
      margin-top: 20px;
      color: #004d40;
      font-weight: bold;
      animation: piscar 1.5s infinite;
    }

    @keyframes piscar {
      0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; }
    }

    /* --- MODO IMPRESSÃO (Térmica) --- */
    @media print {
      body * { visibility: hidden; }
      
      .totem-container, .totem-container * {
        visibility: visible;
      }

      .totem-container {
        background: white !important;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        min-height: auto;
        display: block;
      }

      .ticket-card {
        box-shadow: none;
        width: 100%;
        max-width: 100%;
        padding: 0;
        margin: 0;
      }

      .brand-logo { max-width: 150px; margin: 0 auto 10px auto; }
      .senha-big { font-size: 3.5rem; }
      .status-print { display: none; }
      
      /* Oculta QR Code na impressão se quiser economizar tinta, ou deixa */
      /* .qr-section { display: none; } */
    }
  `]
})
export class TotemSenhaComponent implements OnInit {
  
  ticket: Ticket | null = null;
  qrCodeUrl: string = '';

  constructor(
    private totemService: TotemService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.ticket = this.totemService.getSenhaGerada();

    if (!this.ticket) {
      this.router.navigate(['/totem']);
      return;
    }

    const dadosParaQr = `SENHA:${this.ticket.numeroDisplay}|ID:${this.ticket.id}`;
    this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(dadosParaQr)}`;

    this.playAudio();

    // Delay para garantir que o estilo carregou antes de imprimir
    setTimeout(() => {
      window.print();
    }, 1000);

    setTimeout(() => {
      this.router.navigate(['/totem']);
    }, 10000);
  }

  playAudio(){
    const audio = new Audio();
    audio.src = "assets/ding.mp3"; 
    audio.load();
    audio.play().catch(e => console.log('Audio error:', e));
  }
}