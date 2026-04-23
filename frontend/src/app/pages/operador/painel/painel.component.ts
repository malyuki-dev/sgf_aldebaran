import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    LucideAngularModule, User, Phone, Briefcase, Hash,
    Play, CheckCircle, XCircle, RotateCcw, AlertTriangle, Users, Clock, Search, Truck, CreditCard, Calendar, LogOut
} from 'lucide-angular';
import { GuicheService, GuicheOperador } from '../../../services/guiche.service';
import { AuthService } from '../../../services/auth.service';
import { finalize, switchMap, takeUntil, catchError } from 'rxjs/operators';
import { Subject, of, interval } from 'rxjs';
import { FilialService, Filial } from '../../../services/filial.service';
import { ApiService } from '../../../services/api.service';
@Component({
    selector: 'app-painel-operador',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './painel.component.html',
    styleUrls: ['./painel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PainelOperadorComponent implements OnInit, OnDestroy {
    nomeOperador = 'Operador (Carregando...)';
    numeroGuiche: string | number = 0;
    guicheAtualId: number | null = null;
    idiomaAtivo = 'PT';
    filialSelecionada = '';
    filiais: Filial[] = [];

    tempoOciosoText = '00:00';
    ociosoIniciadoEm: number | null = null;
    ociosoTimer: any;

    // Ícones do sistema
    icons = {
        user: User, phone: Phone, briefcase: Briefcase, hash: Hash,
        play: Play, check: CheckCircle, close: XCircle, recall: RotateCcw,
        alert: AlertTriangle, users: Users, clock: Clock,
        search: Search, truck: Truck, creditCard: CreditCard,
        calendar: Calendar, logout: LogOut, queue: Users, phoneCall: Phone
    };

    // Status de fila
    filaAguardando = 12;
    tempoMedio = '14 min';

    // Lista de próximas senhas
    filaProximas: any[] = [];

    // Ticket Atual
    ticketAtual: any = null;
    modalAberto: string | null = null;
    mostrarToastRechamar: boolean = false;
    mostrarToastTimeout: any;
    guicheTransferenciaSelecionado: string | null = null;
    guicheTransferenciaDestino: { guiche: string; nome: string } | null = null;
    quantidadeGarrafoes = 27;
    tempoAtendimento = '00:00';
    atendimentoIniciadoEm: number | null = null;
    atendimentoTimer: any;

    termoBuscaCliente = '';
    mostrarSugestoesCliente = false;
    clientesFiltrados: Array<{ nome: string; documento: string }> = [];
    readonly clientesBase = [
        { nome: 'João Silva', documento: '123.456.789-00' },
        { nome: 'José Oliveira', documento: '456.789.123-00' },
        { nome: 'Maria Santos', documento: '987.654.321-00' },
    ];

    classificacaoSelecionada = '';
    readonly classificacoesAtendimento = [
        'Compra',
        'Carga',
        'Descarga',
        'Devolução',
        'Documentação',
        'Pagamento',
        'Problema Operacional',
        'Dúvida / Orientação',
    ];

    tipoClienteCadastro: 'PF' | 'PJ' = 'PF';
    formCaminhao = {
        placa: '',
        modelo: '',
        transportadora: '',
        capacidade: '',
        observacoes: '',
    };
    formCliente = {
        nomeEmpresa: '',
        nome: '',
        documento: '',
        telefone: '',
        email: '',
    };
    formPagamento = {
        valor: '',
        formaPagamento: '',
        motivo: '',
        documento: '',
        observacoes: '',
    };

    guichesLista = [
        { id: "1", nome: "João Santos", guiche: "01", status: "OCUPADO", atendimento: "C039" },
        { id: "2", nome: "Ana Costa", guiche: "02", status: "OCUPADO", atendimento: "RP041" },
        { id: "4", nome: "Pedro Lima", guiche: "04", status: "DISPONÍVEL", atendimento: "" },
        { id: "5", nome: "Gustavo C.", guiche: "05", status: "DISPONÍVEL", atendimento: "" },
        { id: "6", nome: "", guiche: "06", status: "FECHADO", atendimento: "" }
    ];

    // Polling de sincronização
    private destroy$ = new Subject<void>();

    constructor(
        private router: Router,
        private guicheService: GuicheService,
        private authService: AuthService,
        private filialService: FilialService,
        private cdr: ChangeDetectorRef,
        private api: ApiService
    ) { }

    ngOnInit() {
        this.nomeOperador = localStorage.getItem('usuario_nome') || 'Atendente Padrão';
        
        this.carregarFiliais();
        
        this.guicheService.getCurrentOperatorGuiche()
            .pipe(
                finalize(() => {
                    this.cdr.markForCheck();
                })
            )
            .subscribe({
                next: (guicheAtual) => {
                    if (!guicheAtual) {
                        this.router.navigate(['/operador/escolha-guiches']);
                        return;
                    }

                    localStorage.setItem('guicheAtual', guicheAtual.numero);
                    
                    // Ajusta para mostrar "Guichê 01" via string ou pegar o número sem parse incorreto
                    this.numeroGuiche = guicheAtual.numero.replace(/\D/g, '') || guicheAtual.numero;
                    
                    this.guicheAtualId = guicheAtual.id;
                    
                    // Inicia cronometro Ocioso (pois começou sem ticket)
                    this.iniciarCronometroOcioso();
                    this.cdr.markForCheck();

                    // Carrega fila real e resumos
                    this.carregarFila();
                    this.carregarResumos();

                    // Inicia polling para detectar perda de guichê e lista de fila
                    this.iniciarPollingGuiche();
                },
                error: (err) => {
                    console.error('Erro ao buscar guichê do operador:', err);
                    if (err.status === 401) {
                        this.authService.clearSession();
                        this.router.navigate(['/login']);
                    }
                }
            });
    }

    private carregarFiliais() {
        this.filialService.getFiliais().subscribe({
            next: (data) => {
                this.filiais = data;
                const savedId = this.filialService.getSelectedFilialId();
                if (savedId) {
                    this.filialSelecionada = savedId.toString();
                } else if (data.length > 0) {
                    this.filialSelecionada = data[0].id.toString();
                    this.filialService.setSelectedFilial(data[0].id);
                }
                this.cdr.markForCheck();
            }
        });
    }

    onFilialChange() {
        const id = this.filialSelecionada ? parseInt(this.filialSelecionada, 10) : null;
        this.filialService.setSelectedFilial(id);
        
        // Ao mudar a filial, recarrega a fila e os resumos (agendamentos daquela filial)
        this.carregarFila();
        this.carregarResumos();
        this.cdr.markForCheck();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        this.pararCronometroAtendimento();
        this.pararCronometroOcioso();
    }

    private iniciarPollingGuiche() {
        interval(5000) // Verifica a cada 5 segundos
            .pipe(
                switchMap(() => this.guicheService.getCurrentOperatorGuiche().pipe(
                    catchError(() => of(undefined))
                )),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (guicheSelecionado: GuicheOperador | null | undefined) => {
                    if (guicheSelecionado === undefined) return;

                    // Se não tem mais guichê, volta pra seleção
                    if (guicheSelecionado === null) {
                        this.router.navigate(['/operador/escolha-guiches']);
                        return;
                    }
                    // Atualiza a fila e resumos periodicamente
                    this.carregarFila();
                    this.carregarResumos();
                    this.cdr.markForCheck();
                },
            });
    }

    sair() {
        this.modalAberto = 'sair';
    }

    confirmarSair() {
        this.modalAberto = null;
        this.destroy$.next(); // Para o polling imediatamente
        this.guicheService.releaseCurrentGuiche()
            .pipe(
                finalize(() => {
                    this.cdr.markForCheck();
                })
            )
            .subscribe({
                next: () => {
                    this.authService.logout();
                    this.router.navigate(['/login']);
                },
                error: () => {
                    this.authService.logout();
                    this.router.navigate(['/login']);
                }
            });
    }

    carregarFila() {
        if (!this.guicheAtualId) return;
        this.api.get<any[]>('/fila/operador/proximas', {}, { 'x-guiche-id': this.guicheAtualId.toString() }).subscribe({
            next: (res) => {
                this.filaProximas = res.map((item, index) => ({
                    id: item.id,
                    codigo: item.numeroDisplay,
                    tempo: 'AGUARDE',
                    servico: item.servico?.nome || 'Serviço Geral',
                    posicao: index + 1
                }));
                this.filaAguardando = res.length;
                this.cdr.markForCheck();
            },
            error: () => {}
        });
    }

    chamarProximo() {
        if (!this.guicheAtualId) {
            this.router.navigate(['/operador/escolha-guiches']);
            return;
        }

        this.api.post<any>('/fila/chamar_proximo', { guiche: this.guicheAtualId }).subscribe({
            next: (senha) => {
                this.ticketAtual = {
                    id: senha.id,
                    senha: senha.numeroDisplay,
                    cliente: senha.agendamento?.nome || '',
                    documento: senha.agendamento?.cpf || '',
                    servico: senha.servico?.nome || 'Serviço',
                    status: 'CHAMADO',
                    clienteSelecionado: !!senha.agendamento?.nome
                };
                
                this.classificacaoSelecionada = '';
                this.quantidadeGarrafoes = 27;
                this.termoBuscaCliente = '';
                this.clientesFiltrados = [];
                this.mostrarSugestoesCliente = false;
                this.tempoAtendimento = '00:00';
                
                // Parar ocioso
                this.pararCronometroOcioso();
                this.pararCronometroAtendimento();
                this.carregarFila();
                this.cdr.markForCheck();
            },
            error: (err) => {
                const isMsg = err?.error?.message;
                alert(isMsg ? err.error.message : 'Nenhum cliente na fila no momento.');
            }
        });
    }

    iniciarAtendimento() {
        if (this.ticketAtual && this.ticketAtual.id) {
            this.api.post<any>('/fila/iniciar_atendimento', { senhaId: this.ticketAtual.id }).subscribe({
                next: () => {
                    this.ticketAtual.status = 'EM_ATENDIMENTO';
                    this.iniciarCronometroAtendimento();
                    this.cdr.markForCheck();
                },
                error: () => alert('Erro ao iniciar atendimento.')
            });
        }
    }

    finalizarAtendimento() {
        if (this.ticketAtual && this.ticketAtual.id) {
            this.api.post<any>('/fila/finalizar_atendimento', { senhaId: this.ticketAtual.id }).subscribe({
                next: () => {
                    this.ticketAtual = null; // Libera o guichê
                    this.pararCronometroAtendimento();
                    this.tempoAtendimento = '00:00';
                    this.termoBuscaCliente = '';
                    this.mostrarSugestoesCliente = false;
                    
                    // Iniciar Ocioso novamente
                    this.iniciarCronometroOcioso();
                    this.cdr.markForCheck();
                },
                error: () => alert('Erro ao finalizar atendimento.')
            });
        }
    }



    trocarIdioma(idioma: string) {
        this.idiomaAtivo = idioma;
        console.log('Idioma alterado para:', idioma);
    }

    abrirModalTransferir() {
        if (!this.ticketAtual) return;
        this.guicheTransferenciaSelecionado = null;
        this.guicheTransferenciaDestino = null;
        this.modalAberto = "transferir";
    }

    fecharModal() {
        this.modalAberto = null;
    }

    confirmarNaoCompareceu() {
        if (!this.ticketAtual || !this.ticketAtual.id) {
            this.modalAberto = null;
            return;
        }

        this.api.post<any>('/fila/nao_compareceu', { senhaId: this.ticketAtual.id }).subscribe({
            next: () => {
                this.ticketAtual = null;
                this.pararCronometroAtendimento();
                this.tempoAtendimento = '00:00';
                this.modalAberto = null;
                
                // Iniciar Ocioso novamente
                this.iniciarCronometroOcioso();
                this.cdr.markForCheck();
            },
            error: () => {
                alert('Erro ao marcar não comparecimento.');
                this.modalAberto = null;
            }
        });
    }

    naoCompareceu() {
        if (!this.ticketAtual) return;
        this.modalAberto = "nao-compareceu";
    }

    rechamar() {
        if (!this.ticketAtual) return;
        console.log("Rechamando senha atual no painel e no áudio...");
        this.mostrarToastRechamar = true;
        if (this.mostrarToastTimeout) clearTimeout(this.mostrarToastTimeout);
        this.mostrarToastTimeout = setTimeout(() => {
            this.mostrarToastRechamar = false;
            this.cdr.detectChanges();
        }, 3000);
    }

    selecionarGuicheTransferencia(id: string) {
        this.guicheTransferenciaSelecionado = id;
    }

    confirmarTransferencia() {
        if (!this.guicheTransferenciaSelecionado) return;
        const destino = this.guichesLista.find((g: any) => g.id === this.guicheTransferenciaSelecionado);
        if (destino) {
            this.guicheTransferenciaDestino = { guiche: destino.guiche, nome: destino.nome };
        }
        this.modalAberto = "transferir-sucesso";
    }

    encerrarTransferencia() {
        this.ticketAtual = null; // Libera o guichê atual
        this.pararCronometroAtendimento();
        this.tempoAtendimento = '00:00';
        this.guicheTransferenciaSelecionado = null;
        this.guicheTransferenciaDestino = null;
        this.modalAberto = null;
        
        // Iniciar Ocioso novamente
        this.iniciarCronometroOcioso();
    }

    incrementarGarrafoes() {
        this.quantidadeGarrafoes += 1;
    }

    decrementarGarrafoes() {
        this.quantidadeGarrafoes = Math.max(0, this.quantidadeGarrafoes - 1);
    }

    atualizarBuscaCliente() {
        const termo = this.termoBuscaCliente.trim().toLowerCase();
        if (!termo || !this.ticketAtual || this.ticketAtual.status !== 'EM_ATENDIMENTO') {
            this.clientesFiltrados = [];
            this.mostrarSugestoesCliente = false;
            return;
        }

        this.clientesFiltrados = this.clientesBase.filter((cliente) => {
            return cliente.nome.toLowerCase().includes(termo) || cliente.documento.toLowerCase().includes(termo);
        });
        this.mostrarSugestoesCliente = this.clientesFiltrados.length > 0;
    }

    selecionarCliente(cliente: { nome: string; documento: string }) {
        if (!this.ticketAtual) return;
        this.ticketAtual.cliente = cliente.nome;
        this.ticketAtual.documento = cliente.documento;
        this.ticketAtual.clienteSelecionado = true;
        this.termoBuscaCliente = cliente.nome;
        this.mostrarSugestoesCliente = false;
        this.cdr.markForCheck();
    }

    private iniciarCronometroAtendimento() {
        this.pararCronometroAtendimento();
        this.atendimentoIniciadoEm = Date.now();
        this.atualizarTempoAtendimento();
        this.atendimentoTimer = setInterval(() => {
            this.atualizarTempoAtendimento();
            this.cdr.markForCheck();
        }, 1000);
    }

    private pararCronometroAtendimento() {
        if (this.atendimentoTimer) {
            clearInterval(this.atendimentoTimer);
            this.atendimentoTimer = null;
        }
        this.atendimentoIniciadoEm = null;
    }

    private atualizarTempoAtendimento() {
        if (!this.atendimentoIniciadoEm) {
            this.tempoAtendimento = '00:00';
            return;
        }
        const segundos = Math.floor((Date.now() - this.atendimentoIniciadoEm) / 1000);
        const mm = String(Math.floor(segundos / 60)).padStart(2, '0');
        const ss = String(segundos % 60).padStart(2, '0');
        this.tempoAtendimento = `${mm}:${ss}`;
    }

    abrirModalCadastro(tipo: 'caminhao' | 'cliente' | 'pagamento') {
        if (tipo === 'caminhao') {
            this.modalAberto = 'cadastro-caminhao';
            return;
        }
        if (tipo === 'cliente') {
            this.modalAberto = 'cadastro-cliente';
            return;
        }
        this.modalAberto = 'cadastro-pagamento';
    }

    salvarCadastroCaminhao() {
        this.modalAberto = null;
    }

    salvarCadastroCliente() {
        this.modalAberto = null;
    }

    salvarPagamento() {
        this.modalAberto = null;
    }

    // -- Resumos de Badges (Meus Atendimentos e Agendamentos) --
    private carregarResumos() {
        if (!this.filialSelecionada) return;
        
        const fid = parseInt(this.filialSelecionada, 10);
        
        // Branch specific scheduling
        this.api.get<any[]>('/fila/agendamento', { filialId: fid.toString() }).subscribe({
            next: (list) => {
                // Filtra agendamentos de HOJE que ainda não foram realizados
                const hojeStr = new Date().toISOString().split('T')[0];
                const count = list.filter((a: any) => 
                    a.dataAgendamento.startsWith(hojeStr) && a.status === 'PENDENTE'
                ).length;
                this.badgeAgendamentosCount = count;
                this.cdr.markForCheck();
            }
        });

        // Operator session history
        // Mocking for now or querying history if available
        // Para fins de demonstração, vamos simular que o operador tem alguns atendimentos
        // Em um sistema real, haveria um endpoint /fila/operador/total-dia
        this.badgeMeusAtendimentosCount = 5; // Valor do design
    }

    badgeAgendamentosCount = 0;
    badgeMeusAtendimentosCount = 0;

    navegarPara(secao: string) {
        if (secao === 'agendamentos') {
             this.router.navigate(['/admin/agendamentos']);
        } else if (secao === 'meus-atendimentos') {
             this.router.navigate(['/admin/atendimento']); // Placeholder rotas de atendimentos
        }
    }
    
    // -- Cronômetro Ocioso --
    private iniciarCronometroOcioso() {
        this.pararCronometroOcioso();
        this.ociosoIniciadoEm = Date.now();
        this.atualizarTempoOcioso();
        this.ociosoTimer = setInterval(() => {
            this.atualizarTempoOcioso();
            this.cdr.markForCheck();
        }, 1000);
    }

    private pararCronometroOcioso() {
        if (this.ociosoTimer) {
            clearInterval(this.ociosoTimer);
            this.ociosoTimer = null;
        }
        this.ociosoIniciadoEm = null;
    }

    private atualizarTempoOcioso() {
        if (!this.ociosoIniciadoEm) {
            this.tempoOciosoText = '00:00';
            return;
        }
        const segundos = Math.floor((Date.now() - this.ociosoIniciadoEm) / 1000);
        const mm = String(Math.floor(segundos / 60)).padStart(2, '0');
        const ss = String(segundos % 60).padStart(2, '0');
        if (Math.floor(segundos / 3600) > 0) {
           const hh = String(Math.floor(segundos / 3600)).padStart(2, '0');
           this.tempoOciosoText = `${hh}:${mm}:${ss}`;
        } else {
           this.tempoOciosoText = `${mm}:${ss}`;
        }
    }
}
