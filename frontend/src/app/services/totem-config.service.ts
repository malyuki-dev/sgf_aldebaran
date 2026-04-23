import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TotemConfigService {
  private readonly STORAGE_KEY_ID = 'totem_filial_id';
  private readonly STORAGE_KEY_NOME = 'totem_filial_nome';

  constructor() {}

  /**
   * Retorna o ID da filial configurada no Totem.
   */
  getFilialId(): number | null {
    const id = localStorage.getItem(this.STORAGE_KEY_ID);
    return id ? Number(id) : null;
  }

  /**
   * Retorna o Nome da filial configurada para exibição visual.
   */
  getFilialNome(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_NOME);
  }

  /**
   * Salva a configuração da filial no navegador.
   */
  setFilial(id: number, nome: string): void {
    localStorage.setItem(this.STORAGE_KEY_ID, id.toString());
    localStorage.setItem(this.STORAGE_KEY_NOME, nome);
  }

  /**
   * Remove a configuração atual (ex: para reconfiguração).
   */
  clearConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY_ID);
    localStorage.removeItem(this.STORAGE_KEY_NOME);
  }

  /**
   * Verifica se o Totem já foi configurado.
   */
  isConfigurado(): boolean {
    return !!this.getFilialId();
  }

  /**
   * Valida se a filial configurada ainda existe e está ativa no backend.
   */
  async validateConfig(api: any): Promise<boolean> {
    const id = this.getFilialId();
    if (!id) return false;

    try {
      // Usamos o endpoint público para verificar se a filial ainda consta na lista de ativas
      const filiais = await api.get('/filiais/public/list').toPromise();
      const existe = filiais.some((f: any) => f.id === id);
      if (!existe) {
        this.clearConfig();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro ao validar config do Totem:', error);
      // Em caso de erro de rede, mantemos a config atual por precaução, 
      // ou retornamos true para não travar o totem se o servidor cair temporariamente.
      return true; 
    }
  }
}

