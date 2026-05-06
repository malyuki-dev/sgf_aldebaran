import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PainelConfigService {
  private readonly STORAGE_KEY_ID = 'painel_filial_id';
  private readonly STORAGE_KEY_NOME = 'painel_filial_nome';

  constructor() {}

  getFilialId(): number | null {
    const id = localStorage.getItem(this.STORAGE_KEY_ID);
    return id ? Number(id) : null;
  }

  getFilialNome(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_NOME);
  }

  setFilial(id: number, nome: string): void {
    localStorage.setItem(this.STORAGE_KEY_ID, id.toString());
    localStorage.setItem(this.STORAGE_KEY_NOME, nome || '');
  }

  clearConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY_ID);
    localStorage.removeItem(this.STORAGE_KEY_NOME);
  }

  isConfigurado(): boolean {
    return !!this.getFilialId();
  }

  async validateConfig(api: any): Promise<boolean> {
    const id = this.getFilialId();
    if (!id) return false;

    try {
      const filiais = await api.get('/filiais/public/list').toPromise();
      const existe = filiais.some((f: any) => f.id === id);
      if (!existe) {
        this.clearConfig();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro ao validar config do Painel:', error);
      return true;
    }
  }
}
