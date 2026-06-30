@echo off
echo Synchronizing package-lock.json...
cd server
call npm install
cd ..
echo Done updating lockfile!
pause
