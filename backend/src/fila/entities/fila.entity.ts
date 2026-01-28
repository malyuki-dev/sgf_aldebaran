import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, DeleteDateColumn } from 'typeorm'; // <--- Adicione DeleteDateColumn

@Entity()
export class Servico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  sigla: string;

  @Column({ default: 1 })
  prioridadePeso: number;
  
  @Column({ default: true })
  ativo: boolean;

  @DeleteDateColumn() // <--- NOVO: Isso ativa o Soft Delete
  deletadoEm: Date;
}

@Entity()
export class Senha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numeroDisplay: string;

  @Column({ default: 'AGUARDANDO' })
  status: string;

  @CreateDateColumn()
  dataCriacao: Date;

  @ManyToOne(() => Servico)
  @JoinColumn({ name: 'servico_id' })
  servico: Servico;

  @Column()
  servico_id: number;
}

@Entity()
export class Atendimento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Senha)
  @JoinColumn({ name: 'senha_id' })
  senha: Senha;

  @Column()
  guiche: number;

  @CreateDateColumn()
  inicioAtendimento: Date;

  @Column({ nullable: true })
  fimAtendimento: Date;

  @Column({ nullable: true })
  notaAvaliacao: number;
}

@Entity()
export class Agendamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nomeCliente: string;

  @Column({ nullable: true })
  documento: string;

  @Column()
  data: string;

  @Column()
  hora: string;

  @ManyToOne(() => Servico)
  @JoinColumn({ name: 'servico_id' })
  servico: Servico;

  @Column()
  servico_id: number;

  @Column({ default: 'PENDENTE' })
  status: string;
}