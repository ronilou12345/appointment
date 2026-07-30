@echo off
setlocal enabledelayedexpansion
cd /d c:\xampp\htdocs\next

REM Create input file with multiple Enter presses
(
echo.
echo.
echo.
echo.
) | npx shadcn@latest add dashboard-01
