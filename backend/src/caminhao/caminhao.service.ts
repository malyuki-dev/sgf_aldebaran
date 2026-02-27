import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CaminhaoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.caminhaoCreateInput) {
        const existingPlaca = await this.prisma.caminhao.findUnique({
            where: { placa: data.placa },
        });

        if (existingPlaca) {
            throw new ConflictException('Placa já cadastrada');
        }

        return this.prisma.caminhao.create({
            data,
        });
    }

    async findAll(query?: string) {
        if (query) {
            return this.prisma.caminhao.findMany({
                where: {
                    deletadoEm: null,
                    OR: [
                        { placa: { contains: query, mode: 'insensitive' } },
                        { modelo: { contains: query, mode: 'insensitive' } },
                        { transportadora: { contains: query, mode: 'insensitive' } },
                    ],
                },
                include: { motorista: true },
                orderBy: { placa: 'asc' },
            });
        }

        return this.prisma.caminhao.findMany({
            where: { deletadoEm: null },
            include: { motorista: true },
            orderBy: { placa: 'asc' },
        });
    }

    async findOne(id: number) {
        const caminhao = await this.prisma.caminhao.findFirst({
            where: { id, deletadoEm: null },
            include: { motorista: true }
        });
        if (!caminhao) {
            throw new NotFoundException('Caminhão não encontrado');
        }
        return caminhao;
    }

    async update(id: number, data: Prisma.caminhaoUpdateInput) {
        await this.findOne(id);

        if (data.placa) {
            delete data.placa; // RN01: Placa única; Placa não pode ser alterada após cadastro.
        }

        return this.prisma.caminhao.update({
            where: { id },
            data: {
                ...data,
                atualizadoEm: new Date(),
            },
            include: { motorista: true }
        });
    }

    async checkExists(placa: string) {
        const existingPlaca = await this.prisma.caminhao.findUnique({
            where: { placa },
        });
        return { placaExists: !!existingPlaca };
    }

    async softDelete(id: number) {
        await this.findOne(id);
        return this.prisma.caminhao.update({
            where: { id },
            data: {
                deletadoEm: new Date(),
                status: 'INATIVO',
            },
        });
    }

    async vincularMotorista(id: number, motoristaId: number | null) {
        await this.findOne(id);

        // We accept null to unbind
        return this.prisma.caminhao.update({
            where: { id },
            data: {
                motorista: motoristaId
                    ? { connect: { id: motoristaId } }
                    : { disconnect: true },
                atualizadoEm: new Date()
            },
            include: { motorista: true }
        });
    }
}
