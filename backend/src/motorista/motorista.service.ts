import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MotoristaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.motoristaCreateInput) {
        const existingCpf = await this.prisma.motorista.findUnique({
            where: { cpf: data.cpf },
        });
        if (existingCpf) {
            throw new ConflictException('CPF já cadastrado');
        }

        const existingCnh = await this.prisma.motorista.findUnique({
            where: { cnh: data.cnh },
        });
        if (existingCnh) {
            throw new ConflictException('CNH já cadastrada');
        }

        return this.prisma.motorista.create({
            data,
        });
    }

    async findAll(query?: string) {
        if (query) {
            return this.prisma.motorista.findMany({
                where: {
                    deletadoEm: null,
                    OR: [
                        { nome: { contains: query, mode: 'insensitive' } },
                        { cpf: { contains: query, mode: 'insensitive' } },
                        { transportadora: { contains: query, mode: 'insensitive' } },
                    ],
                },
                orderBy: { nome: 'asc' },
            });
        }

        return this.prisma.motorista.findMany({
            where: { deletadoEm: null },
            orderBy: { nome: 'asc' },
        });
    }

    async findOne(id: number) {
        const motorista = await this.prisma.motorista.findFirst({
            where: { id, deletadoEm: null },
        });
        if (!motorista) {
            throw new NotFoundException('Motorista não encontrado');
        }
        return motorista;
    }

    async update(id: number, data: Prisma.motoristaUpdateInput) {
        await this.findOne(id); // Ensure it exists and is not logically deleted

        // RN03: Imutabilidade de chave. Ensure CPF isn't being modified 
        if (data.cpf) {
            // Only allow it if it's the same CPF or remove the field completely
            delete data.cpf;
        }

        return this.prisma.motorista.update({
            where: { id },
            data: {
                ...data,
                atualizadoEm: new Date(),
            },
        });
    }

    async checkExists(cpf: string, cnh: string) {
        const existingCpf = await this.prisma.motorista.findUnique({
            where: { cpf },
        });
        const existingCnh = await this.prisma.motorista.findUnique({
            where: { cnh },
        });

        return {
            cpfExists: !!existingCpf,
            cnhExists: !!existingCnh
        };
    }

    async softDelete(id: number) {
        await this.findOne(id);
        return this.prisma.motorista.update({
            where: { id },
            data: {
                deletadoEm: new Date(),
                ativo: false,
            },
        });
    }
}
