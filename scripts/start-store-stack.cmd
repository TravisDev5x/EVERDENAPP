@echo off
REM Punto de venta: cola Laravel + agente HTTP de impresión (scripts\print-agent).
REM Previo: npm install dentro de scripts\print-agent
set "ROOT=%~dp0.."
cd /d "%ROOT%"

echo Iniciando php artisan queue:work...
start "Laravel queue:work" cmd /k php artisan queue:work

cd /d "%ROOT%\scripts\print-agent"
if exist node_modules (
    echo Iniciando agente ESC/POS HTTP ^(puerto 9911^)...
    start "Print agent HTTP" cmd /k npm run http
) else (
    echo Opcional: ejecute npm install en scripts\print-agent
)

cd /d "%ROOT%"
echo.
echo Variables útiles: QUEUE_CONNECTION=database, PRINT_NOTIFY_AGENT=true,
echo PRINT_AGENT_URL=http://127.0.0.1:9911/print, PRINT_AFTER_PAY=true
pause
