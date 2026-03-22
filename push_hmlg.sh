#!/bin/bash
# Script para subir o código para a branch hmlg

echo "Configurando repositório e enviando para hmlg..."

# Garante que as credenciais estão no remote temporariamente
if [ -z "$GIT_TOKEN" ]; then
    echo "Erro: Variável GIT_TOKEN não definida."
    exit 1
fi
git remote set-url origin https://malyuki-dev:"$GIT_TOKEN"@github.com/malyuki-dev/sgf_aldebaran.git

# Envia o estado atual do master/main local para a branch remota
git push origin master:hmlg --force

# Restaura o remote original por segurança
git remote set-url origin https://github.com/malyuki-dev/sgf_aldebaran.git

echo "--- Sucesso! Código enviado para a branch hmlg ---"
