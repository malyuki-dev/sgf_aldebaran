import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userJson = localStorage.getItem('usuario_sgf');

  if (!userJson) {
    router.navigate(['/login']);
    return false;
  }

  const user = JSON.parse(userJson);
  const role = user.perfil || user.tipo;

  // 1. ADMIN - Acesso Livre a tudo
  if (role === 'ADMIN') {
    return true;
  }

  const url = state.url;

  // 2. SUPERVISOR - Somente /supervisor ou /totem
  if (role === 'SUPERVISOR') {
    if (url.startsWith('/supervisor') || url.startsWith('/totem')) {
      return true;
    }
    // Tentou acessar url proibida (ex: /admin)
    router.navigate(['/supervisor/dashboard']);
    return false;
  }

  // 3. OPERADOR - Somente /operador ou /totem
  if (role === 'OPERADOR') {
    if (url.startsWith('/operador') || url.startsWith('/totem')) {
      return true;
    }
    router.navigate(['/operador/painel']);
    return false;
  }

  // 4. CLIENTE - Somente /client
  if (role === 'CLIENTE') {
    if (url.startsWith('/client')) {
      return true;
    }
    router.navigate(['/client/home']);
    return false;
  }

  // Se nao tiver Role ou for invalida
  router.navigate(['/login']);
  return false;
};
