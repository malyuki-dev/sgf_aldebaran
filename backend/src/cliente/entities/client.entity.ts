import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('clientes') // <--- Confirme se o nome da tabela é esse
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  senha: string;

  @Column({ nullable: true, unique: true })
  cpf: string;

  @Column({ nullable: true, unique: true })
  cnpj: string;

  // CORREÇÃO CRÍTICA:
  // Como seu formulário NÃO tem telefone, esse campo TEM que aceitar nulo.
  @Column({ nullable: true }) 
  telefone: string;

  @Column({ default: 'CLIENT' })
  tipo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}