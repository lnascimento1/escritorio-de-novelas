# Escritorio de novelas

App para escribir novelas y cuentos: manuscrito por capítulos, fichas como mapa, mapa de ideas, línea de tiempo tipo metro, tablero, metas y pomodoro.

## Usarla desde el navegador (sin instalar nada)

Abrí **https://lnascimento1.github.io/escritorio-de-novelas/** en Chrome o Edge y tocá el ícono de *Instalar* en la barra de direcciones. Queda como una app, con su ícono, y funciona sin internet. Sirve en compus corporativas donde no se pueden instalar programas.

## Descargar

Cada cambio en `main` fabrica una versión nueva. Las descargas están en **Releases** (columna derecha de esta página):

- **Android:** `escritorio-de-novelas.apk`. Al instalarlo, Android pide permitir "instalar apps de fuentes desconocidas".
- **Windows:** `escritorio-de-novelas-windows.exe`. Como no está firmado, Windows puede mostrar "Windows protegió tu PC": tocá *Más información → Ejecutar de todas formas*.

## Dónde se guarda lo que escribís

- Todo se guarda solo en el dispositivo.
- **Windows:** en *Exportar → Elegir carpeta de respaldo* elegí tu carpeta de Google Drive (con Google Drive para escritorio instalado) y cada *Guardar* deja una copia ahí, más una por día en `Respaldos/`.
- **Android:** *Exportar → Enviar respaldo* y elegí Drive. Para pasar una obra de un dispositivo a otro: *Exportar → Abrir un respaldo .json*.

## Estructura

- `src/` — la app (HTML, CSS y JavaScript). Es la misma que corre en claude.ai.
- `build.js` — arma `www/` con todo adentro (fuentes y librerías locales, sin internet).
- `electron/` — envoltorio para Windows.
- `capacitor.config.json` — envoltorio para Android.
- `.github/workflows/build.yml` — fabrica el APK y el instalador y los publica.
