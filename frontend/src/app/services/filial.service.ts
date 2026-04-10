import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

export interface Filial {
  id: number;
  nome: string;
  ativo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FilialService {
  
  private selectedFilialSubject = new BehaviorSubject<number | null>(null);
  selectedFilial$ = this.selectedFilialSubject.asObservable();

  private filiaisSubject = new BehaviorSubject<Filial[]>([]);
  filiais$ = this.filiaisSubject.asObservable();

  constructor(private apiService: ApiService) {
    const saved = localStorage.getItem('selected_filial_id');
    if (saved) {
      this.selectedFilialSubject.next(parseInt(saved, 10));
    } else {
      const userStr = localStorage.getItem('usuario_sgf');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.filial_id) {
            this.selectedFilialSubject.next(user.filial_id);
          }
        } catch (e) {}
      }
    }
  }

  getFiliais(): Observable<Filial[]> {
    if (this.filiaisSubject.value.length > 0) {
      return of(this.filiaisSubject.value);
    }
    
    return this.apiService.get<Filial[]>('/filiais').pipe(
      tap(data => this.filiaisSubject.next(data))
    );
  }

  // Permite forçar recarregamento se necessário
  fetchFiliais(): Observable<Filial[]> {
    return this.apiService.get<Filial[]>('/filiais').pipe(
      tap(data => this.filiaisSubject.next(data))
    );
  }

  setSelectedFilial(id: number | null) {
    this.selectedFilialSubject.next(id);
    if (id) {
      localStorage.setItem('selected_filial_id', id.toString());
    } else {
      localStorage.removeItem('selected_filial_id');
    }
  }

  getSelectedFilialId(): number | null {
    return this.selectedFilialSubject.value;
  }
}
