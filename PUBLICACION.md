# Publicar A Tuna Gas 1.2

El sitio estático va a **GitHub Pages**. El servidor de clasificaciones es un servicio **Node.js 24** independiente, con SQLite en almacenamiento persistente. El navegador envía una repetición de la carrera y recibe el tiempo calculado por el servidor.

## Probar el proyecto localmente

1. Instala Node.js 24 si hace falta.
2. Desde la carpeta del proyecto, ejecuta `node servidor/servidor.mjs` o abre `Abrir con clasificaciones locales.cmd`.
3. Abre [http://127.0.0.1:8783/](http://127.0.0.1:8783/) y conserva abierta la terminal. Los tiempos de este servidor se guardan en `datos/tiempos.sqlite`.
4. La entrada `index.html` también abre el juego directamente desde disco. Para compartir tiempos hace falta la entrada HTTP local o publicada.

`node herramientas/preparar-pages.mjs` crea `dist-pages/` si todavía no existe. Puedes pasar otro directorio nuevo dentro del proyecto. El constructor solo copia las carpetas que usa el juego, la configuración del dominio y las portadas finales. Los respaldos, las capturas, los archivos de datos, las herramientas de servidor y los materiales de edición se quedan fuera del sitio.

## Publicar en GitHub Pages

1. Descomprime el paquete para GitHub y sube su contenido a un repositorio propio para el juego. Conserva `.github/workflows/pages.yml`, `CNAME` y `.gitignore`.
2. En **Settings → Pages**, elige **GitHub Actions** como fuente. Ejecuta **Publicar A Tuna Gas en GitHub Pages** desde **Actions → Run workflow**. El flujo prepara y publica el artefacto estático.
3. Verifica el dominio en GitHub según las indicaciones de Pages. Configura `atunagas.aquiestalatuna.es` como **Custom domain** del repositorio antes de apuntarle el DNS. El flujo de Actions usa el ajuste de Pages. El archivo `CNAME` queda preparado si se publica desde una rama.
4. En el DNS de `aquiestalatuna.es`, apunta `atunagas` mediante un registro CNAME con destino a `<propietario>.github.io`. Comprueba el uso del registro A existente antes de sustituirlo. Usa el propietario real del repositorio. Activa **Enforce HTTPS** cuando GitHub termine de emitir el certificado.
5. Prueba [atunagas.aquiestalatuna.es](https://atunagas.aquiestalatuna.es/) desde un navegador privado. Completa una carrera y comprueba que aparecen el formulario y la clasificación.

[Configurar el dominio en GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) · [Flujos de publicación de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Alojar el servidor de clasificaciones

1. En un servicio que ejecute Node.js 24 con volumen persistente, ejecuta el `Dockerfile` incluido o `node servidor/servidor.mjs`. El contenedor expone el puerto 8783 y guarda su base en `/datos/tiempos.sqlite`. Monta `/datos` en el volumen. Usa una sola instancia para este archivo de SQLite.
2. Con Node.js directo, configura `HOST=0.0.0.0`, `PORT`, `API_ONLY=1`, `RANKING_DB` con una ruta del volumen y `SITE_ORIGIN=https://atunagas.aquiestalatuna.es`. El proxy del alojamiento debe servir HTTPS y enviar las peticiones al puerto Node. Usa controles de tráfico en el proxy si el servicio queda expuesto al público.
3. Publica el servicio como `https://ranking-atunagas.aquiestalatuna.es`. También puedes usar un dominio HTTPS del proveedor y actualizar `clasificaciones/config.js` antes de ejecutar el flujo de Pages. Esa dirección es pública. Los permisos del proveedor se gestionan en su panel.
4. Comprueba `https://ranking-atunagas.aquiestalatuna.es/api/health`. Debe indicar la versión 1.2 y 30 circuitos. Después guarda un tiempo desde el sitio de Pages y comprueba que aparece desde otra sesión.
5. Al actualizar la física, prepara el servidor y el sitio para la misma versión. Conserva la ruta del volumen. Para una copia fría de la base, para el servicio, copia el volumen y reinicia. Las exportaciones y copias que contengan la base se quedan fuera de GitHub.

## Validación y almacenamiento

- Cada carrera clasificable recibe un identificador aleatorio de un solo resultado, una semilla y una hora de inicio del servidor.
- El navegador registra las pulsaciones. El servidor reconstruye la carrera con el motor de la versión 1.2 y exige que la repetición cruce la meta, dentro de la ventana de tiempo y los límites previstos.
- La clave del resultado hace idempotente el reintento del mismo envío. El nombre se valida. El tiempo, la localidad, el circuito, el sentido y la fecha se obtienen en el servidor. El personaje y el coche se fijan en la sesión inicial.
- Los mejores 100 resultados de cada filtro salen de SQLite en orden ascendente. La clasificación general compara los tiempos de todos los circuitos, incluidos los más cortos. El filtro de circuito permite comparar el mismo trazado.
- SQLite conserva la tabla de tiempos después de reiniciar. Las sesiones caducadas se limpian en el servidor. Se limita el ritmo de solicitudes y el número de verificaciones simultáneas. La validación verifica la carrera y sus controles, incluso si los controles proceden de un bot que sabe conducir.

## Comprobaciones

- `node pruebas/motor.cjs` verifica las dos direcciones de cada localidad.
- `node pruebas/clasificaciones.mjs` verifica guardado real, filtros, reintentos, rechazos y persistencia.
- `node pruebas/navegador.cjs` requiere Playwright y Edge. `node pruebas/android-https.cjs` requiere Playwright, Chrome o Edge y Python con cryptography. La segunda prueba sirve el artefacto de Pages bajo `/juego/` con un certificado local efímero y comprueba la simulación táctil.
- Prueba el dominio y el servicio público después del despliegue. El dominio `atunagas.aquiestalatuna.es` resolvía a un registro A durante la preparación y queda pendiente de validar por HTTPS.
