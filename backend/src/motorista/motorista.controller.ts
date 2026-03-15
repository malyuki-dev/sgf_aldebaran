import { Controller, Get, Post, Body, Put, Param, Delete, Query, ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { MotoristaService } from './motorista.service';
import { Prisma } from '@prisma/client';

@Controller('motoristas')
export class MotoristaController {
    constructor(private readonly motoristaService: MotoristaService) { }

    @Post()
    async create(@Body() createMotoristaDto: Prisma.motoristaCreateInput) {
        try {
            return await this.motoristaService.create(createMotoristaDto);
        } catch (error: any) {
            throw new HttpException(error.message || 'Erro Interno', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get()
    findAll(@Query('q') q?: string) {
        return this.motoristaService.findAll(q);
    }

    @Get('check')
    check(@Query('cpf') cpf: string, @Query('cnh') cnh: string) {
        return this.motoristaService.checkExists(cpf, cnh);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.motoristaService.findOne(id);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateMotoristaDto: Prisma.motoristaUpdateInput) {
        return this.motoristaService.update(id, updateMotoristaDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.motoristaService.softDelete(id);
    }
}
