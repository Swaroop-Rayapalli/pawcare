@echo off
echo ========================================
echo PawCare MySQL Database Setup
echo ========================================
echo.
echo This script will create the pawcare_db database.
echo.
set /p MYSQL_PASSWORD="Enter MySQL root password (press Enter if no password): "

echo.
echo Creating database...
echo.

if "%MYSQL_PASSWORD%"=="" (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS pawcare_db; SHOW DATABASES;"
) else (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p%MYSQL_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS pawcare_db; SHOW DATABASES;"
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Database created successfully!
    echo ========================================
    echo.
    echo Now you can start the PawCare application with:
    echo npm start
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to create database
    echo ========================================
    echo.
    echo Please check your MySQL password and try again.
    echo.
)

pause
