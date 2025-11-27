import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';

// 1. Tabela de Serviços
@Entity()
export class Servico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;       // Ex: "Pagamento"

  @Column()
  sigla: string;      // Ex: "PAG"

  @Column({ default: 1 })
  prioridadePeso: number;
}

// 2. Tabela de Senhas
@Entity()
export class Senha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numeroDisplay: string; // Ex: "PAG-001"

  @Column({ default: 'AGUARDANDO' })
  status: string;

  @CreateDateColumn()
  dataCriacao: Date;

  // Relacionamento: Uma Senha pertence a um Serviço
  @ManyToOne(() => Servico)
  @JoinColumn({ name: 'servico_id' })
  servico: Servico;

  @Column()
  servico_id: number; // Coluna auxiliar para facilitar leitura
}

// 3. Tabela de Atendimentos
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