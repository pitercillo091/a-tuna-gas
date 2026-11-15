import game from '../servidor/modelo.cjs';
import '../clasificaciones/config.js';

const origin = 'https://atunagas.aquiestalatuna.es';
const address = game.rankingEndpoint + '/api/';
const options = {headers:{Origin:origin},signal:AbortSignal.timeout(12000)};
const health = await fetch(address+'health',options);
if (!health.ok || health.headers.get('access-control-allow-origin') !== origin) {
  throw Error('La plataforma de clasificación no permite peticiones desde el dominio del juego.');
}
const info = await health.json();
if (info.version !== game.replay.version || info.tracks !== game.tracks.length) {
  throw Error('Publica primero el motor compatible de la clasificación.');
}
const scores = await fetch(address+'scores?track=lopera-2',options);
if (!scores.ok || !Array.isArray((await scores.json()).rows)) {
  throw Error('La tabla pública no está disponible.');
}
console.log('Clasificación pública compatible, con filtros y HTTPS.');
