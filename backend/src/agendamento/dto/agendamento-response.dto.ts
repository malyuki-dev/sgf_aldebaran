export class AgendamentoResponseDto {
  id!: number;
  categoriaNome!: string;
  filialNome!: string;
  data!: string;
  horaInicio!: string;
  horaFim!: string;
  status!: string;
  podeCancelar!: boolean;
  podeReagendar!: boolean;
  senha?: string | null;
  senhaStatus?: string | null;
  posicao?: number | null;
  estimativa?: number | null;
}
