import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    LucideAngularModule, User, Phone, Briefcase, Hash,
    Play, CheckCircle, XCircle, RotateCcw, AlertTriangle, Users
} from 'lucide-angular';

@Component({
    selector: 'app-painel-operador',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './painel.component.html',
    styleUrls: ['./painel.component.scss']
})
export class PainelOperadorComponent implements OnInit {
    nomeOperador = 'Operador (Carregando...)';
    numeroGuiche = 0;

    // Ícones do sistema
    icons = {
        user: User, phone: Phone, briefcase: Briefcase, hash: Hash,
        play: Play, check: CheckCircle, close: XCircle, recall: RotateCcw,
        alert: AlertTriangle, users: Users
    };

    // Status de fila
    filaAguardando = 12;
    tempoMedio = '14 min';

    // Ticket Atual
    ticketAtual: any = null; // null significa que o guichê está livre

    constructor(private router: Router) { }

    ngOnInit() {
        this.nomeOperador = localStorage.getItem('usuario_nome') || 'Atendente Padrão';
        const guicheStr = localStorage.getItem('guicheAtual');
        if (!guicheStr) {
            // Se não escolheu o guichê na tela anterior, força a escolha
            this.router.navigate(['/operador/escolha-guiches']);
            return;
        }
        this.numeroGuiche = parseInt(guicheStr, 10);
    }

    chamarProximo() {
        this.ticketAtual = {
            senha: 'RP-042',
            cliente: 'João Alberto Soares',
            documento: '043.***.***-45',
            servico: 'Retirada Pesada (Caminhão)',
            status: 'CHAMADO'
        };
        this.filaAguardando = Math.max(0, this.filaAguardando - 1);
    }

    iniciarAtendimento() {
        if (this.ticketAtual) {
            this.ticketAtual.status = 'EM_ATENDIMENTO';
        }
    }

    finalizarAtendimento() {
        this.ticketAtual = null; // Libera o guichê
    }

    naoCompareceu() {
        if (confirm('Marcar o cliente (No-Show) como Ausente? A senha será descartada.')) {
            this.ticketAtual = null; // Libera o guichê para chamar o próximo
        }
    }

    rechamar() {
        console.log('Rechamando senha atual no painel e no áudio...');
    }
}
