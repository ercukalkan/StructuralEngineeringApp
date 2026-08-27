@echo off
cd /d "%~dp0"
call calculation_service\.venv_py312\Scripts\activate
uvicorn calculation_service.api.controllers.server:app --reload
