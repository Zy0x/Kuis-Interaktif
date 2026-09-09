@echo off
chcp 65001 >nul
title Kuis SD Seru 🌟
cls
echo ========================================================
echo         MEMULAI APLIKASI: KUIS SD SERU 🌟
echo ========================================================
echo.
echo Sedang menyiapkan server dan membuka peramban...
echo Alamat: http://localhost:5173
echo.
echo (Jendela ini jangan ditutup selama bermain kuis ya!)
echo ========================================================

:: Buka browser otomatis setelah 1 detik
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

:: Jalankan Vite Dev Server
call npm run dev -- --host
pause
