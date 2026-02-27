import { Controller, Get, Post, Body, Put, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { MotoristaService } from './motorista.service';
import { Prisma } from '@prisma/client';

@Controller('motoristas')
export class MotoristaController {
    constructor(private readonly motoristaService: MotoristaService) { }

    @Post()
    create(@Body() createMotoristaDto: Prisma.motoristaCreateInput) {
        return this.motoristaService.create(createMotoristaDto);
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
