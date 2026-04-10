export type PersonType = 'PF' | 'PJ';

export interface MobileProfile {
  id: string;
  tipo: PersonType;
  nome: string | null;
  razaoSocial: string | null;
  email: string;
  telefone: string | null;
  cpf: string | null;
  cnpj: string | null;
}

export interface UpdateMobileProfilePayload {
  nome?: string;
  razaoSocial?: string;
  email: string;
  telefone?: string | null;
}

export interface ChangeMobilePasswordPayload {
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
}
