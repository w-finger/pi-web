@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo [1/3] 停止正在运行的 pi-web（端口 30141）...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":30141" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo [2/3] 重新构建 pi-web...
call npm run build
if errorlevel 1 (
    echo.
    echo ===== 构建失败，请检查上方错误信息 =====
    pause
    exit /b 1
)

echo [3/3] 启动 pi-web...
start "pi-web" cmd /k "pi-web --no-open"

echo.
echo ===== 完成！到浏览器按 Ctrl+F5 强制刷新即可看到改动 =====
ping -n 6 127.0.0.1 >nul
