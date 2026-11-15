# Publicar A Tuna Gas 1.2

## Juego local

Abre `index.html` desde la carpeta del proyecto para correr. Para probar también la clasificación, ejecuta `node servidor/servidor.mjs` con Node.js 24 y abre [el juego local](http://127.0.0.1:8783/). Los tiempos de esta instalación se guardan en `datos/tiempos.sqlite`.

## Publicación web

El flujo `.github/workflows/pages.yml` ejecuta las pruebas del motor, la clasificación, el navegador de escritorio y la emulación Android. Al actualizar `main`, comprueba la compatibilidad de la API pública y despliega por GitHub Pages si todo pasa. También se puede ejecutar desde Actions. Las solicitudes de incorporación ejecutan las pruebas sin publicar.

`node herramientas/preparar-pages.mjs` prepara el sitio estático en `dist-pages/`. Usa un destino nuevo si ya existe. El constructor versiona las referencias a scripts y estilos y copia únicamente los archivos públicos del juego. Las bases de datos locales, copias de seguridad y capturas de pruebas se guardan fuera del sitio.

El dominio personalizado del repositorio `pitercillo091/a-tuna-gas` es `atunagas.aquiestalatuna.es`. En IONOS el host `atunagas` usa las cuatro direcciones IPv4 y las cuatro IPv6 de GitHub Pages. Esta configuración permite conservar sus registros MX de correo. El sitio se comprueba por HTTPS. [GitHub Pages](https://github.com/pitercillo091/a-tuna-gas/settings/pages) · [DNS en GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

| Tipo | Host | Destinos |
| --- | --- | --- |
| A | `atunagas` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| AAAA | `atunagas` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |

## Clasificación pública

GitHub Pages sirve el juego y una función de Supabase atiende la clasificación. PostgreSQL guarda los tiempos de forma persistente. La función crea una sesión con una semilla, examina la repetición de los controles y calcula el tiempo con el motor del juego. El jugador introduce su nombre y la ficha muestra el resto de datos de la carrera. La fecha definitiva es la del guardado en el servidor. La tabla ordena por tiempo y permite filtrar por localidad y por cada sentido del circuito.

`servidor/supabase/clasificacion.sql` define las tablas y los permisos. La función usa las credenciales privadas de su entorno para consultar dichas tablas. El navegador solo conoce la URL HTTPS de la función y el identificador aleatorio de su propia carrera. El servicio local sigue usando SQLite y las mismas reglas de repetición.

Si se cambia el motor de una forma que afecte a las repeticiones, actualiza `replay.version` y publica la función antes de desplegar el sitio. `node herramientas/preparar-clasificacion.mjs publicacion/funcion-ranking` prepara los archivos de la función `atunagas-ranking`. La función se despliega por separado en Supabase y comparte el motor con la versión web. `node herramientas/verificar-clasificacion-publica.mjs` comprueba la versión, los filtros y el acceso desde el dominio del juego. [Desplegar una función de Supabase](https://supabase.com/docs/guides/functions/deploy)

## Comprobaciones

- `node pruebas/motor.cjs` prueba los 30 recorridos, los objetos, los rivales y los resultados.
- `node pruebas/clasificaciones.mjs` comprueba el guardado persistente, los filtros, los reintentos y los rechazos.
- `node pruebas/navegador.cjs` prueba menús, carrera, música y objetos desde disco con Playwright.
- `node pruebas/android-https.cjs` usa Playwright, Chromium y Python con cryptography para probar controles táctiles, audio, resultados y clasificación bajo HTTPS con un dispositivo Android emulado.
