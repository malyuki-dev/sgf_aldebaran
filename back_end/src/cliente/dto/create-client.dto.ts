export class CreateClienteDto {
  nome: string;
  documento: string;
  email: string;
  telefone?: string;
  dataNascimento?: string;
  endereco?: string;
  ativo?: boolean;
}