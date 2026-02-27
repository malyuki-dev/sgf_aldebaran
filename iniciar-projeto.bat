@echo off
echo ====================================================
echo      Iniciando SGF Aldebaran (Desenvolvimento)
echo ====================================================
echo.

echo [1/2] Iniciando o Backend (NestJS) na porta 3000...
start "SGF Backend (NestJS)" cmd /k "cd backend && npm run start:dev"

echo [2/2] Iniciando o Frontend (Angular) na porta 4200...
start "SGF Frontend (Angular)" cmd /k "cd frontend && npm start"

echo.
echo Os serviços estao sendo iniciados em novas janelas!
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:4200
echo.
echo Pressione qualquer tecla para fechar esta janela (os servicos continuarao rodando nas outras janelas).
pause > nul
