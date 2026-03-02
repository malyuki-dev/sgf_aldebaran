@echo off
chcp 65001 >nul
echo ===================================================
echo   ENVIANDO ATUALIZACOES PARA A BRANCH-MALY
echo ===================================================
echo.

:: Tenta mudar para a branch maly se ja nao estiver nela
git checkout Branch-maly 2>nul || git checkout -b Branch-maly

git status
echo.

set /p desc="Digite a descricao do commit (ex: 'Corrigindo totem'): "

echo.
echo Adicionando arquivos...
git add .

echo.
echo Criando commit...
git commit -m "%desc%"

echo.
echo Enviando para o GitHub (https://github.com/malyuki-dev/sgf_aldebaran/tree/Branch-maly)...
git push origin Branch-maly

echo.
echo ===================================================
echo   CONCLUIDO! AS ALTERACOES ESTAO NA BRANCH-MALY!
echo ===================================================
pause
