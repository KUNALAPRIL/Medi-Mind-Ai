@echo off
echo --- BRANCHES --- > git_debug_output.txt
git branch >> git_debug_output.txt 2>&1
echo --- REMOTES --- >> git_debug_output.txt
git remote -v >> git_debug_output.txt 2>&1
echo --- STATUS --- >> git_debug_output.txt
git status >> git_debug_output.txt 2>&1
echo --- LOG --- >> git_debug_output.txt
git log -n 5 >> git_debug_output.txt 2>&1
echo Done > debug_done.txt
