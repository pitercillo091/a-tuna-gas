@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 para ejecutar la clasificacion local.
  pause
  exit /b 1
)
echo Abre http://127.0.0.1:8783/ y deja abierta esta ventana mientras juegas.
node servidor/servidor.mjs
if errorlevel 1 pause
