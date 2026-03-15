#!/bin/bash

# ====================================================
#      Push para Branch-maly - SGF Aldebaran
# ====================================================

# Sair imediatamente se um comando falhar
set -e

# Verificar se estamos no diretório correto
if [ ! -d ".git" ]; then
    echo "Erro: Este script deve ser executado na raiz do projeto (onde está a pasta .git)."
    exit 1
fi

# Mensagem de commit como argumento ou padrão
COMMIT_MSG=${1:-"Atualização automática via script (Linux)"}

echo "--- Iniciando processo de push para Branch-maly ---"

# 1. Garantir que estamos na branch correta
echo "[1/4] Verificando branch..."
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "Branch-maly" ]; then
    echo "Mudando para a branch Branch-maly..."
    git checkout Branch-maly
fi

# 2. Adicionar alterações
echo "[2/4] Preparando arquivos..."
git add .

# 3. Verificar se há mudanças para commit
if git diff --cached --quiet; then
    echo "Aviso: Nenhuma alteração encontrada para commit."
else
    # 4. Commit
    echo "[3/4] Criando commit: \"$COMMIT_MSG\"..."
    git commit -m "$COMMIT_MSG"
fi

# 5. Push
echo "[4/4] Enviando para GitHub..."
git push origin Branch-maly

echo ""
echo "--- Sucesso! Seu código está no GitHub na Branch-maly ---"

