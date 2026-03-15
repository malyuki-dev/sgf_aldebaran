import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  X, ChevronDown, Calendar, FileText, Eye, CheckCircle, Clock, Star,
  ArrowLeft, Download, AlertTriangle, User, TrendingUp, TrendingDown
} from 'lucide-angular';

@Component({
  selector: 'app-supervisor-relatorios',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, ReactiveFormsModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.scss']
})
export class SupervisorRelatoriosComponent implements OnInit {
  
  icons = {
    x: X,
    chevronDown: ChevronDown,
    calendar: Calendar,
    fileText: FileText,
    eye: Eye,
    check: CheckCircle,
    clock: Clock,
    star: Star,
    arrowLeft: ArrowLeft,
    download: Download,
    alert: AlertTriangle,
    user: User,
    trendingUp: TrendingUp,
    trendingDown: TrendingDown
  };

  activeModal: string | null = null; // 'detalhes', 'justificativa'
  successModal: boolean = false;
  justificativaForm: FormGroup;
  selectedTicket: any = null;

  constructor(private fb: FormBuilder) {
    this.justificativaForm = this.fb.group({
      motivo: ['', Validators.required],
      observacoes: ['']
    });
  }

  atendimentosMock = [
    {
      senha: 'RP-A045', originIcon: this.icons.calendar,
      clienteNome: 'João Silva', clienteSub: 'Transp. ABC',
      categoria: 'Retirada Pesada', categoriaClass: 'cat-orange',
      operador: 'Maria S.',
      espera: '5 min', esperaAlerta: false, atendimento: '12 min',
      avaliacao: 'Excelente', avaliacaoEmoji: '😁', avaliacaoClass: 'eval-green',
      status: 'CONCLUÍDO', statusBoxClass: 'status-green', statusType: '',
      acaoTipo: 'view', acaoClass: 'btn-blue-light'
    },
    {
      senha: 'C-035', originIcon: this.icons.fileText,
      clienteNome: 'Roberto Almeida', clienteSub: 'Avulso',
      categoria: 'Caminhão', categoriaClass: 'cat-green',
      operador: 'Ana Costa',
      espera: '84 min', esperaAlerta: true, atendimento: '7 min',
      avaliacao: 'Péssimo', avaliacaoEmoji: '😡', avaliacaoClass: 'eval-red',
      status: 'CONCLUÍDO', statusBoxClass: 'status-green', statusType: 'alert-row',
      acaoTipo: 'view', acaoClass: 'btn-teal'
    },
    {
      senha: 'CR-036', originIcon: this.icons.calendar,
      clienteNome: 'Lucas Ferreira', clienteSub: '',
      categoria: 'Cliente Rápido', categoriaClass: 'cat-gray',
      operador: '-',
      espera: '15 min', esperaAlerta: false, atendimento: '-',
      avaliacao: '-', avaliacaoEmoji: '', avaliacaoClass: '',
      status: 'NÃO COMPARECEU', statusBoxClass: 'status-red-text', statusType: 'missed-row',
      acaoTipo: 'resgatar', acaoClass: ''
    }
  ];

  ngOnInit() {
    // Inicialização do mockup pixel-perfect
  }

  abrirModal(tipo: string, ticket?: any) {
    this.activeModal = tipo;
    if (ticket) {
      this.selectedTicket = ticket;
    }
  }

  fecharModal() {
    this.activeModal = null;
    this.successModal = false;
    this.justificativaForm.reset({ motivo: '' });
  }

  salvarJustificativa() {
    if (this.justificativaForm.invalid) {
      alert('Selecione um motivo!');
      return;
    }
    this.activeModal = null;
    this.successModal = true;
    setTimeout(() => {
      this.fecharModal();
    }, 5000);
  }

}
