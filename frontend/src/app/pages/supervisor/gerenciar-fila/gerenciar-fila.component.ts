import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Clock, User, AlertCircle, ArrowUpCircle, CheckCircle, Users, ArrowLeft } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-supervisor-gerenciar-fila',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, ReactiveFormsModule],
  templateUrl: './gerenciar-fila.component.html',
  styleUrls: ['./gerenciar-fila.component.scss']
})
export class SupervisorGerenciarFilaComponent implements OnInit {
  icons = { search: Search, clock: Clock, user: User, alert: AlertCircle, up: ArrowUpCircle, check: CheckCircle, users: Users, arrowLeft: ArrowLeft };
  currentTab = 'espera';

  configForm!: FormGroup;
  showSuccessModal = false;


  filaEspera = [
    { ticket: 'RP045', prioridade: 'alta', prioridadeLabel: 'Preferencial', motorista: 'Carlos Souza', placa: 'XYZ-9876', servico: 'Retirada Pesada', tempoEspera: 45 },
    { ticket: 'C042', prioridade: 'normal', prioridadeLabel: 'Normal', motorista: 'Pedro Almeida', placa: 'ABC-1234', servico: 'Caminhão', tempoEspera: 20 },
    { ticket: 'CR039', prioridade: 'alta', prioridadeLabel: 'Urgente', motorista: 'Lucas Lima', placa: 'DEF-5678', servico: 'Carga Rápida', tempoEspera: 32 }
  ];

  baias = [
    { numero: 1, status: 'ocupada', statusLabel: 'Ocupada', operador: 'João Santos', ticket: 'RP044', placa: 'GHI-9012', progresso: 65, tempoOcupado: 12 },
    { numero: 2, status: 'livre', statusLabel: 'Livre', operador: 'Ana Costa' },
    { numero: 3, status: 'ocupada', statusLabel: 'Ocupada', operador: 'Maria Silva', ticket: 'C041', placa: 'JKL-3456', progresso: 20, tempoOcupado: 4 },
    { numero: 4, status: 'manutencao', statusLabel: 'Manutenção' },
  ];

  ngOnInit() {
    this.configForm = new FormGroup({
      tempoTolerancia: new FormControl(15),
      limiteAtendimentos: new FormControl(200),
      prioridadePcdIdoso: new FormControl(true),
      redirecionarAusentes: new FormControl(false)
    });
  }

  chamar(item: any) {
    alert(`Chamando ticket ${item.ticket} neste instante.`);
  }

  chamarProximo(baia: any) {
    alert(`Chamando próximo cliente para a Baia ${baia.numero}.`);
  }

  encerrar(baia: any) {
    if (confirm(`Deseja encerrar o atendimento ${baia.ticket} na Baia ${baia.numero}?`)) {
      baia.status = 'livre';
      baia.statusLabel = 'Livre';
      baia.ticket = null;
      baia.placa = null;
    }
  }

  salvarConfiguracoes() {
    this.showSuccessModal = true;
  }

  fecharSuccessModal() {
    this.showSuccessModal = false;
  }
}
