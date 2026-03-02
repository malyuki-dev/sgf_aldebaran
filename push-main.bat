@echo off
chcp 65001 >nul
echo ===================================================
echo   ENVIANDO ATUALIZACOES PARA A BRANCH PRINCIPAL (MAIN)
echo ===================================================
echo.

git status
echo.

set /p desc="Digite a descricao do commit (ex: 'Correcoes no admin'): "

echo.
echo Adicionando arquivos...
git add .

echo.
echo Criando commit...
git commit -m "%desc%"

echo.
echo Enviando para o GitHub (https://github.com/malyuki-dev/sgf_aldebaran)...
git push origin main

echo.
echo ===================================================
echo   CONCLUIDO! AS ALTERACOES ESTAO NA MAIN!
echo ===================================================
pause
