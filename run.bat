@echo off
TITLE FacultySync Server
echo Starting FacultySync...
echo.

IF NOT EXIST node_modules (
    echo node_modules not found. Running npm install...
    call npm install
)

echo Starting server...
call npm start
pause
