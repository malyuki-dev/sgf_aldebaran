import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  ChangeMobilePasswordPayload,
  MobileProfile,
  UpdateMobileProfilePayload,
} from '../models/mobile-profile.model';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  getProfile(): Observable<MobileProfile> {
    return this.apiService.get<MobileProfile>('/mobile/profile').pipe(
      tap((profile) => this.authService.setCurrentUser(this.mapProfileToSession(profile))),
    );
  }

  updateProfile(payload: UpdateMobileProfilePayload): Observable<MobileProfile> {
    return this.apiService.put<MobileProfile>('/mobile/profile', payload).pipe(
      tap((profile) => this.authService.setCurrentUser(this.mapProfileToSession(profile))),
    );
  }

  changePassword(payload: ChangeMobilePasswordPayload): Observable<{ message: string }> {
    return this.apiService.put<{ message: string }>(
      '/mobile/profile/password',
      payload,
    );
  }

  private mapProfileToSession(profile: MobileProfile) {
    return {
      id: profile.id,
      nome: profile.tipo === 'PJ' ? profile.razaoSocial : profile.nome,
      email: profile.email,
      telefone: profile.telefone,
      tipo: 'CLIENTE',
      perfil: 'CLIENTE',
      cpf: profile.cpf,
      cnpj: profile.cnpj,
      tipoPessoa: profile.tipo,
    };
  }
}
