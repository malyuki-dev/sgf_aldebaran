import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    OnModuleInit,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuicheDto } from './dto/create-guiche.dto';
import { UpdateGuicheDto } from './dto/update-guiche.dto';
import { SelectGuicheDto } from './dto/select-guiche.dto';
import { ToggleGuicheStatusDto } from './dto/toggle-guiche-status.dto';

type AuthUser = {
    userId: number;
    tipo?: string;
};

@Injectable()
export class GuicheService implements OnModuleInit {
    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        await this.ensureDefaultGuiches();
    }

    private async ensureDefaultGuiches() {
        const total = await this.prisma.guiche.count();
        if (total > 0) {
            return;
        }

        const guichesDefault = Array.from({ length: 6 }, (_, index) => ({
            numero: index + 1,
            ativo: true,
            status: 'DISPONIVEL' as const,
        }));

        await this.prisma.guiche.createMany({
            data: guichesDefault,
        });
    }

    async listOperatorView(user: AuthUser) {
        this.ensureOperador(user);

        const guiches = await this.prisma.guiche.findMany({
            where: { ativo: true },
            include: {
                operadorAtual: {
                    select: { id: true, nome: true },
                },
            },
            orderBy: { numero: 'asc' },
        });

        return guiches.map((guiche) => this.toOperatorCard(guiche));
    }

    async getCurrentOperatorGuiche(user: AuthUser) {
        this.ensureOperador(user);

        const guiche = await this.prisma.guiche.findFirst({
            where: {
                operadorAtualId: user.userId,
                ativo: true,
            },
            include: {
                operadorAtual: {
                    select: { id: true, nome: true },
                },
            },
        });

        if (!guiche) {
            return null;
        }

        return this.toOperatorCard(guiche);
    }

    async selectGuiche(user: AuthUser, dto: SelectGuicheDto) {
        this.ensureOperador(user);

        const guicheFiltro = dto.guicheId
            ? { id: dto.guicheId }
            : dto.numero
                ? { numero: dto.numero }
                : null;

        if (!guicheFiltro) {
            throw new BadRequestException('Informe guicheId ou numero para selecionar.');
        }

        const guiche = await this.prisma.guiche.findFirst({
            where: {
                ...guicheFiltro,
                ativo: true,
            },
        });

        if (!guiche) {
            throw new NotFoundException('Guichê não encontrado.');
        }

        const now = new Date();

        const selectedGuiche = await this.prisma.$transaction(async (tx) => {
            const operador = await tx.usuario.findFirst({
                where: {
                    id: user.userId,
                    ativo: true,
                    deletadoEm: null,
                },
            });

            if (!operador) {
                throw new UnauthorizedException('Operador inválido ou inativo.');
            }

            const alreadyAssigned = await tx.guiche.findFirst({
                where: {
                    operadorAtualId: user.userId,
                    ativo: true,
                },
            });

            if (alreadyAssigned) {
                throw new ConflictException(`Você já está no guichê ${alreadyAssigned.numero}.`);
            }

            const updated = await tx.guiche.updateMany({
                where: {
                    id: guiche.id,
                    ativo: true,
                    status: 'DISPONIVEL',
                    operadorAtualId: null,
                },
                data: {
                    status: 'OCUPADO',
                    operadorAtualId: user.userId,
                    loginOperadorEm: now,
                    atualizadoEm: now,
                },
            });

            if (updated.count === 0) {
                throw new ConflictException('Guichê em Uso. Selecione Outro Guichê Disponível.');
            }

            await tx.operador_sessao.create({
                data: {
                    operador_id: user.userId,
                    guiche_id: guiche.id,
                    loginEm: now,
                    ativo: true,
                },
            });

            const selected = await tx.guiche.findUnique({
                where: { id: guiche.id },
                include: {
                    operadorAtual: {
                        select: { id: true, nome: true },
                    },
                },
            });

            if (!selected) {
                throw new NotFoundException('Guichê não encontrado após seleção.');
            }

            return selected;
        });

        return this.toOperatorCard(selectedGuiche);
    }

    async releaseCurrentGuiche(user: AuthUser) {
        this.ensureOperador(user);

        const now = new Date();

        const result = await this.prisma.$transaction(async (tx) => {
            const current = await tx.guiche.findFirst({
                where: {
                    operadorAtualId: user.userId,
                    ativo: true,
                },
            });

            if (!current) {
                return null;
            }

            await tx.guiche.update({
                where: { id: current.id },
                data: {
                    status: 'DISPONIVEL',
                    operadorAtualId: null,
                    loginOperadorEm: null,
                    atendimentoAtualCodigo: null,
                    atualizadoEm: now,
                },
            });

            await tx.operador_sessao.updateMany({
                where: {
                    operador_id: user.userId,
                    guiche_id: current.id,
                    ativo: true,
                    logoutEm: null,
                },
                data: {
                    ativo: false,
                    logoutEm: now,
                },
            });

            return current;
        });

        if (!result) {
            return {
                message: 'Nenhum guichê ativo para liberar.',
                guiche: null,
            };
        }

        return {
            message: `Guichê ${result.numero} liberado com sucesso.`,
            guiche: {
                id: result.id,
                numero: result.numero,
            },
        };
    }

    async listAdminView(user: AuthUser) {
        this.ensureAdminOrSupervisor(user);

        return this.prisma.guiche.findMany({
            include: {
                operadorAtual: {
                    select: { id: true, nome: true },
                },
            },
            orderBy: { numero: 'asc' },
        });
    }

    async createGuiche(user: AuthUser, dto: CreateGuicheDto) {
        this.ensureAdminOrSupervisor(user);

        const existing = await this.prisma.guiche.findUnique({
            where: { numero: dto.numero },
        });

        if (existing) {
            throw new ConflictException('Já existe um guichê com esse número.');
        }

        return this.prisma.guiche.create({
            data: {
                numero: dto.numero,
                descricao: dto.descricao,
                ativo: dto.ativo ?? true,
                status: 'DISPONIVEL',
            },
        });
    }

    async updateGuiche(user: AuthUser, guicheId: number, dto: UpdateGuicheDto) {
        this.ensureAdminOrSupervisor(user);

        const current = await this.prisma.guiche.findUnique({ where: { id: guicheId } });
        if (!current) {
            throw new NotFoundException('Guichê não encontrado.');
        }

        if (dto.ativo === false && current.operadorAtualId) {
            throw new ConflictException('Não é possível desativar um guichê ocupado.');
        }

        if (dto.numero && dto.numero !== current.numero) {
            const existsWithNumber = await this.prisma.guiche.findUnique({
                where: { numero: dto.numero },
            });
            if (existsWithNumber) {
                throw new ConflictException('Já existe um guichê com esse número.');
            }
        }

        const data: any = {
            atualizadoEm: new Date(),
        };

        if (dto.numero !== undefined) data.numero = dto.numero;
        if (dto.descricao !== undefined) data.descricao = dto.descricao;
        if (dto.ativo !== undefined) {
            data.ativo = dto.ativo;
            if (!dto.ativo && current.status === 'DISPONIVEL') {
                data.status = 'INATIVO';
            }
            if (dto.ativo && current.status === 'INATIVO') {
                data.status = 'DISPONIVEL';
            }
        }

        return this.prisma.guiche.update({
            where: { id: guicheId },
            data,
        });
    }

    async toggleGuicheStatus(user: AuthUser, guicheId: number, dto: ToggleGuicheStatusDto) {
        return this.updateGuiche(user, guicheId, { ativo: dto.ativo });
    }

    private ensureOperador(user: AuthUser) {
        if (!user || user.tipo !== 'OPERADOR') {
            throw new ForbiddenException('Acesso permitido apenas para operador.');
        }
    }

    private ensureAdminOrSupervisor(user: AuthUser) {
        if (!user || (user.tipo !== 'ADMIN' && user.tipo !== 'SUPERVISOR')) {
            throw new ForbiddenException('Acesso permitido apenas para admin/supervisor.');
        }
    }

    private toOperatorCard(guiche: any) {
        const loginHorario = guiche.loginOperadorEm
            ? new Date(guiche.loginOperadorEm).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            })
            : null;

        const ocupado = guiche.status === 'OCUPADO' && !!guiche.operadorAtualId;

        return {
            id: guiche.id,
            numero: String(guiche.numero).padStart(2, '0'),
            ocupado,
            status: ocupado ? 'OCUPADO' : 'DISPONIVEL',
            operador: ocupado ? guiche.operadorAtual?.nome ?? null : null,
            logado: loginHorario,
            codigoAtendimento: ocupado ? guiche.atendimentoAtualCodigo ?? null : null,
        };
    }
}
