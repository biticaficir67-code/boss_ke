@echo off
setlocal
chcp 65001 >nul
title Game Website - Local Launcher

pushd "%~dp0"
if errorlevel 1 (
  echo Cannot open the project directory.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js 22.12 or later.
  echo Then double-click this file again.
  pause
  popd
  exit /b 1
)

node "scripts\start.mjs" %*
set "START_EXIT=%ERRORLEVEL%"
if not "%START_EXIT%"=="0" (
  echo.
  echo Startup failed. Please check the message above.
  pause
)
popd
exit /b %START_EXIT%
