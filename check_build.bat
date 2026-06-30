@echo off
cd server
echo Starting compilation check... > ../server_build_output.txt
call npm run build >> ../server_build_output.txt 2>&1
echo Done >> ../server_build_output.txt
echo Output written to server_build_output.txt
pause
