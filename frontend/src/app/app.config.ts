import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// IMPORTANTE: Trazendo as ferramentas de HTTP
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()) // <--- ISSO HABILITA A CONEXÃO COM O BACKEND
  ]
};