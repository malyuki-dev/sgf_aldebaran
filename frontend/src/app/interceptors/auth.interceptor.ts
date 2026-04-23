import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  console.log('AuthInterceptor - Token:', token ? 'Encontrado' : 'Não encontrado');
  console.log('AuthInterceptor - Request URL:', req.url);

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('AuthInterceptor - Header de autorização adicionado');
    return next(cloned);
  }

  return next(req);
};
