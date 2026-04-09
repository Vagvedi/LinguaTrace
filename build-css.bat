@echo off
echo Building Tailwind CSS...
npx tailwindcss -i ./static/css/input.css -o ./static/css/style.css
echo CSS build complete!
pause
