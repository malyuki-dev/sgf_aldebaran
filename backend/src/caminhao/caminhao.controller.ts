import { Controller, Get, Post, Body, Put, Param, Delete, Query, ParseIntPipe, Patch, HttpException, HttpStatus } from '@nestjs/common';
import { CaminhaoService } from './caminhao.service';
import { Prisma } from '@prisma/client';

@Controller('caminhoes')
export class CaminhaoController {
    constructor(private readonly caminhaoService: CaminhaoService) { }
    @Post()
    async create(@Body() createCaminhaoDto: Prisma.caminhaoCreateInput) {
        try {
            return await this.caminhaoService.create(createCaminhaoDto);
        } catch (error: any) {
            throw new HttpException(error.message || 'Erro Interno', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('operacional')
    async createOperacional(@Body() createCaminhaoDto: Prisma.caminhaoCreateInput) {
        // RN02 — Cadastro Operacional Simplificado: Operador e Supervisor não vinculam motoristas.
        if (createCaminhaoDto.motorista) {
            delete createCaminhaoDto.motorista;
        }
        try {
            return await this.caminhaoService.create(createCaminhaoDto);
        } catch (error: any) {
            throw new HttpException(error.message || 'Erro Interno', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get()
    findAll(@Query('q') q?: string) {
        return this.caminhaoService.findAll(q);
    }

    @Get('check')
    check(@Query('placa') placa: string) {
        return this.caminhaoService.checkExists(placa);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.caminhaoService.findOne(id);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateCaminhaoDto: Prisma.caminhaoUpdateInput) {
        return this.caminhaoService.update(id, updateCaminhaoDto);
    }

    @Patch(':id/motorista')
    vincularMotorista(@Param('id', ParseIntPipe) id: number, @Body('motoristaId') motoristaId: number | null) {
        return this.caminhaoService.vincularMotorista(id, motoristaId);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.caminhaoService.softDelete(id);
    }
}
