import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';

@Injectable()
export class GuicheService {
    constructor(
        private prisma: PrismaService,
        private notificacaoService: NotificacaoService,
    ) { }

    async create(data: any) {
        const guiche = await this.prisma.guiche.create({
            data: {
                numero: data.numero,
                nome: data.nome,
                status: data.status || 'Offline',
                ativo: data.ativo ?? true,
                filial_id: +data.filial_id,
            },
            include: { filial: true },
        });

        // Notificação de novo guichê
        await this.notificacaoService.criar({
            titulo: 'Novo Guichê',
            mensagem: `Guichê ${guiche.numero} - ${guiche.nome} cadastrado na filial ${guiche.filial?.nome}.`,
            icon: 'monitor',
            rota: '/admin/servicos',
        });

        return guiche;
    }

    async findAll() {
        return await this.prisma.guiche.findMany({
            where: {
                deletadoEm: null,
                filial: { ativo: true }, // Apenas guichês de filiais ativas
            },
            include: { filial: true },
            orderBy: [{ filial: { nome: 'asc' } }, { numero: 'asc' }],
        });
    }

    async findOne(id: number) {
        const g = await this.prisma.guiche.findUnique({
            where: { id },
            include: { filial: true },
        });
        if (!g || g.deletadoEm)
            throw new NotFoundException('Guichê não encontrado');
        return g;
    }

    async update(id: number, data: any) {
        const { id: _, filial, criadoEm, deletadoEm, ...updateData } = data;

        // Ensure filial_id is numeric if provided
        if (updateData.filial_id) updateData.filial_id = +updateData.filial_id;

        const guiche = await this.prisma.guiche.update({
            where: { id },
            data: {
                ...updateData,
                atualizadoEm: new Date(),
            },
            include: { filial: true },
        });

        // Notificação de atualização
        await this.notificacaoService.criar({
            titulo: 'Guichê Atualizado',
            mensagem: `Dados do guichê ${guiche.numero} (${guiche.filial?.nome}) foram alterados.`,
            icon: 'monitor',
            rota: '/admin/servicos',
        });

        return guiche;
    }

    async remove(id: number) {
        return await this.prisma.guiche.update({
            where: { id },
            data: { deletadoEm: new Date() },
        });
    }
}
