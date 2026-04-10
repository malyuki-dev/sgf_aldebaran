export type Priority = 'BAIXA' | 'MEDIA' | 'ALTA';

export interface StatusItem {
  id: number;
  nome: string;
  cor?: string;
  icon?: string;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  tasks?: TaskItem[];
}

export interface TaskItem {
  id: number;
  titulo: string;
  descricao?: string;
  prioridade: Priority;
  statusId: number;
  status?: StatusItem;
  criadoPorId: number;
  responsavelId?: number;
  responsavel?: {
    id: number;
    nome: string;
    fotoPerfil?: string;
  };
  dataEntrega?: string;
  ordem: number;
  criadoEm: string;
}
