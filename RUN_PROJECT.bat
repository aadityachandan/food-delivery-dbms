@echo off
rem One-click setup + start for the FoodHub DBMS project (Next.js + MySQL + MongoDB).
rem Right-click this file and choose "Run as administrator" (needed to start MongoDB).
title FoodHub - DBMS Level 3 Project
cd /d "%~dp0"
echo ==========================================================
echo   Smart Multi-Vendor Food Delivery - setup and start
echo ==========================================================
echo.

set "MYSQL=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if not exist "%MYSQL%" (
  echo MySQL was not found at "%MYSQL%".
  pause
  exit /b 1
)

rem The password is only kept in this window's memory (environment
rem variable). It is never written to any file.
set /p "MYSQL_PWD=Type your MySQL root password and press Enter: "
set "MYSQL_PASSWORD=%MYSQL_PWD%"
echo.

echo [1/5] Creating the MySQL database (CREATE, constraints, indexes)...
"%MYSQL%" -u root < "sql\01_create_schema.sql" >nul
if errorlevel 1 goto mysqlfail
echo [2/5] Applying ALTER TABLE changes, inserting data, creating views,
echo       procedures, functions and triggers...
"%MYSQL%" -u root < "sql\02_alter_schema.sql" >nul
if errorlevel 1 goto mysqlfail
"%MYSQL%" -u root < "sql\03_insert_data.sql" >nul
if errorlevel 1 goto mysqlfail
"%MYSQL%" -u root < "sql\04_views_procedures_triggers.sql" >nul
if errorlevel 1 goto mysqlfail
echo       MySQL is ready.

echo [3/5] Starting MongoDB and loading its data...
net start MongoDB >nul 2>&1
call mongosh --quiet "mongodb\mongo_setup.js" >nul 2>&1
if errorlevel 1 (
  echo       MongoDB is not running. The app will still work, but without
  echo       live tracking. Next time choose "Run as administrator".
) else (
  echo       MongoDB is ready.
)

cd web
echo [4/5] Preparing the web app...
if not exist ".env.local" (
  rem create .env.local with a random session secret (no password in it)
  node -e "const fs=require('fs');let s=fs.readFileSync('.env.example','utf8');s=s.replace(/^JWT_SECRET=.*$/m,'JWT_SECRET='+require('crypto').randomBytes(32).toString('hex'));fs.writeFileSync('.env.local',s)"
  echo       Created web\.env.local
)
if not exist node_modules (
  echo       Installing packages, please wait...
  call npm install
)
if not exist ".next\BUILD_ID" (
  echo       Building the Next.js app, please wait about a minute...
  call npm run build
)

echo [5/5] Starting the web app...
echo.
echo   Open  http://localhost:3000   and log in with a demo account:
echo     customer  aarav.sharma@gmail.com     owner  gopal@udupiupahar.in
echo     partner   ravi.s@gmail.com           admin  lakshmi.iyer@foodhub.in
echo     password  Demo@123   (same for all demo users)
echo   Keep this window open while you use the app. Close it to stop.
echo.
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3000"
call npm start
pause
exit /b 0

:mysqlfail
echo.
echo   MySQL refused the connection - the password is probably wrong.
echo   Close this window and run the file again.
pause
exit /b 1
