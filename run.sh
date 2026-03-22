#!/bin/bash

# ====================================================
#      Iniciando SGF Aldebaran (Linux)
# ====================================================

# Carregar NVM se existir
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Verificar se Node está instalado
if ! command -v node &> /dev/null
then
    echo "Erro: Node.js não encontrado. Por favor, instale o Node.js."
    exit 1
fi

echo "Backend: Iniciando NestJS..."
(cd backend && npm run start:dev) &
BACKEND_PID=$!

echo "Frontend: Iniciando Angular..."
(cd frontend && npm start) &
FRONTEND_PID=$!

echo ""
echo "Serviços iniciados:"
echo "- Backend: http://localhost:3000"
echo "- Frontend: http://localhost:4200"
echo ""
echo "Pressione Ctrl+C para encerrar todos os processos."

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "Encerrando serviços..."
    kill $BACKEND_PID $FRONTEND_PID
    exit
}

trap cleanup SIGINT SIGTERM

# Manter o script rodando
wait
