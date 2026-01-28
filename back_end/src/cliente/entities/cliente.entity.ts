import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity()
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nome: string;

  @Column({ unique: true, length: 18 }) // RN01: CPF/CNPJ único
  documento: string;

  @Column({ length: 100 })
  email: string;

  @Column({ nullable: true, length: 15 })
  telefone: string;

  @Column({ type: 'date', nullable: true })
  dataNascimento: string;

  @Column({ nullable: true, length: 200 })
  endereco: string;

  @Column({ default: true }) // RN02: Status Ativo
  ativo: boolean;

  // RN07: Auditoria
  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @DeleteDateColumn() // RN06: Exclusão Lógica
  deletadoEm: Date; 
}