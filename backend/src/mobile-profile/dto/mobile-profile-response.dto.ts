export class MobileProfileResponseDto {
  id: string;
  tipo: 'PF' | 'PJ';
  nome: string | null;
  razaoSocial: string | null;
  email: string;
  telefone: string | null;
  cpf: string | null;
  cnpj: string | null;
}
