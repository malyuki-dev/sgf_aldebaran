import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GuicheOperador, GuicheService } from '../../../services/guiche.service';
import { AuthService } from '../../../services/auth.service';
import { FilialService, Filial } from '../../../services/filial.service';
import { finalize, takeUntil, switchMap, catchError } from 'rxjs/operators';
import { Subject, of, interval } from 'rxjs';

@Component({
  selector: 'app-escolha-guiches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './escolha-guiches.html',
  styleUrls: ['./escolha-guiches.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EscolhaGuiches implements OnInit, OnDestroy {
  operadorNome = 'Operador';
  operadorPerfil = 'Operador';
  operadorAvatar = 'OP';

  // Configurações
  filialSelecionada = '';
  idiomaAtivo = 'PT';
  carregando = false;
  mensagemErro = '';
  selecaoEmAndamentoId: number | null = null;

  guiches: GuicheOperador[] = [];
  filiais: Filial[] = [];

  // Polling de sincronização
  private destroy$ = new Subject<void>();
  private pollingAtivo = false;

  constructor(
    private router: Router,
    private guicheService: GuicheService,
    private authService: AuthService,
    private filialService: FilialService,
    private cdr: ChangeDetectorRef,
  ) {
    this.carregarOperador();
  }

  ngOnInit() {
    this.carregarFiliais();
    this.verificarGuicheAtual();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private iniciarPolling() {
    if (this.pollingAtivo) {
      return;
    }

    this.pollingAtivo = true;
    this.atualizarGuichesEmTempoReal();
  }

  private atualizarGuichesEmTempoReal() {
    interval(2000) // Atualiza a cada 2 segundos
      .pipe(
        switchMap(() => {
          const fid = this.filialSelecionada ? parseInt(this.filialSelecionada, 10) : undefined;
          return this.guicheService.listOperatorGuiches(fid);
        }),
        takeUntil(this.destroy$),
        catchError(() => of(this.guiches)) // Mantém lista antiga em caso de erro
      )
      .subscribe({
        next: (lista: GuicheOperador[]) => {
          this.guiches = lista;
          this.cdr.markForCheck();
        },
      });
  }

  private carregarOperador() {
    const usuarioRaw = localStorage.getItem('usuario_sgf');
    if (!usuarioRaw) {
      return;
    }

    try {
      const usuario = JSON.parse(usuarioRaw);
      this.operadorNome = usuario?.nome || 'Operador';

      const partes = this.operadorNome.trim().split(' ').filter(Boolean);
      if (partes.length > 1) {
        this.operadorAvatar = `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
      } else if (partes.length === 1) {
        this.operadorAvatar = partes[0].slice(0, 2).toUpperCase();
      }
    } catch {
      this.operadorNome = localStorage.getItem('usuario_nome') || 'Operador';
    }
  }

  private verificarGuicheAtual() {
    this.carregando = true;
    this.cdr.markForCheck();

    this.guicheService.getCurrentOperatorGuiche()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (guicheAtual) => {
          if (guicheAtual) {
            localStorage.setItem('guicheAtual', guicheAtual.numero);
            this.router.navigate(['/operador/painel']);
            return;
          }
          this.carregarGuiches();
        },
        error: (erro) => {
          if (erro?.status === 401 || erro?.status === 403) {
            this.authService.clearSession();
            this.router.navigate(['/login']);
            return;
          }
          this.carregarGuiches();
        },
      });
  }

  private carregarFiliais() {
    this.filialService.getFiliais().subscribe({
      next: (data) => {
        this.filiais = data;
        
        // Inicializa com a filial salva se existir
        const savedId = this.filialService.getSelectedFilialId();
        if (savedId) {
          this.filialSelecionada = savedId.toString();
        }
        
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao listar filiais no operador:', err);
      }
    });
  }

  onFilialChange() {
    if (this.filialSelecionada) {
      this.filialService.setSelectedFilial(parseInt(this.filialSelecionada, 10));
    } else {
      this.filialService.setSelectedFilial(null);
    }
    this.carregarGuiches(); // Recarrega guichês da nova filial
  }

  private carregarGuiches() {
    this.carregando = true;
    this.mensagemErro = '';
    this.cdr.markForCheck();

    const fid = this.filialSelecionada ? parseInt(this.filialSelecionada, 10) : undefined;

    this.guicheService.listOperatorGuiches(fid)
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (lista) => {
          this.guiches = lista;
          this.cdr.markForCheck();
          this.iniciarPolling(); // ← Inicia polling após carregar
        },
        error: () => {
          this.mensagemErro = 'Não foi possível carregar os guichês. Tente novamente.';
          this.cdr.markForCheck();
        },
      });
  }

  selecionar(guiche: GuicheOperador) {
    if (guiche.ocupado || this.selecaoEmAndamentoId !== null) {
      return;
    }

    this.mensagemErro = '';
    this.selecaoEmAndamentoId = guiche.id;
    this.cdr.markForCheck();

    this.guicheService.selectGuiche(guiche.id)
      .pipe(
        finalize(() => {
          if (this.selecaoEmAndamentoId === guiche.id) {
            this.selecaoEmAndamentoId = null;
          }
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (guicheSelecionado) => {
          localStorage.setItem('guicheAtual', guicheSelecionado.numero);
          this.router.navigate(['/operador/painel']);
        },
        error: (erro) => {
          const mensagemBackend = erro?.error?.message;
          this.mensagemErro =
            typeof mensagemBackend === 'string'
              ? mensagemBackend
              : 'Guichê em Uso. Selecione Outro Guichê Disponível.';
          this.cdr.markForCheck();

          // Recarrega imediatamente para mostrar que guichê foi ocupado
          setTimeout(() => {
            this.atualizarListaGuichesAgora();
          }, 300);
        },
      });
  }

  private atualizarListaGuichesAgora() {
    const fid = this.filialSelecionada ? parseInt(this.filialSelecionada, 10) : undefined;
    this.guicheService.listOperatorGuiches(fid)
      .pipe(
        catchError(() => of(this.guiches))
      )
      .subscribe({
        next: (lista: GuicheOperador[]) => {
          this.guiches = lista;
          this.cdr.markForCheck();
        },
      });
  }

  trocarIdioma(idioma: string) {
    this.idiomaAtivo = idioma;
    console.log('Idioma alterado para:', idioma);
  }

  logout() {
    this.carregando = true;
    this.cdr.markForCheck();

    this.guicheService.releaseCurrentGuiche()
      .pipe(
        finalize(() => {
          this.carregando = false;
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
        },
      });
  }
}
