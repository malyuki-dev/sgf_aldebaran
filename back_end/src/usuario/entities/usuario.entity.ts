import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  login: string;  // Ex: "admin"

  @Column()
  senha: string;  // Ex: "123456"

  @Column()
  nome: string;   // Ex: "fulano"
}