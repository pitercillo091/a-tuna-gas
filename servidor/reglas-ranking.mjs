export const pageSize = 50;
export const sessionTtl = 24 * 60 * 60 * 1000;
export const maxBody = 240000;
export const publicOrigin = 'https://atunagas.aquiestalatuna.es';
export const pagesOrigin = 'https://pitercillo091.github.io';
export const scoreFields = 'id,name,time_ms,driver,vehicle,track,locality,direction,date';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function nickname(value) {
  if (typeof value !== 'string') return null;
  const name = value.normalize('NFKC').trim().replace(/ +/g, ' ');
  const length = [...name].length;
  return length >= 2 && length <= 24 && /^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._'’\-]*$/u.test(name) ? name : null;
}

export function raceSelection(game, values) {
  const {track, driver, vehicle, entrants, clientVersion} = values;
  if(clientVersion !== game.replay.version) {
    throw new HttpError(409, 'Actualiza el juego antes de iniciar una carrera clasificable.');
  }
  if (!game.tracks.some(t => t.id === track) || !game.characters.some(c => c.id === driver) ||
    !game.vehicles.some(v => v.id === vehicle) || !Number.isInteger(entrants) || entrants < 6 || entrants > 15) {
    throw new HttpError(400, 'La combinación de carrera no es válida.');
  }
  return {track, driver, vehicle, entrants};
}

export function raceSubmission(data, replay) {
  const {id, name: raw, runs} = data;
  const name = nickname(raw);
  if (!name) throw new HttpError(400, 'Escribe entre 2 y 24 caracteres de nombre, con letras o números.');
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{32}$/.test(id)) {
    throw new HttpError(400, 'Falta el identificador de la carrera.');
  }
  const ticks = replay.ticks(runs);
  if (!ticks) throw new HttpError(400, 'La repetición no tiene un formato válido.');
  return {id, name, runs, time: Math.round(ticks * replay.dt * 1000)};
}

export function checkElapsed(session, route, time, now) {
  if (!session || now - session.created > sessionTtl) {
    throw new HttpError(410, 'La sesión ha caducado. Inicia otra carrera.');
  }
  if (time < route.total * route.laps * .8 / 560 * 1000 || time > now - session.created + 1600) {
    throw new HttpError(422, 'El tiempo no coincide con una carrera posible.');
  }
}

export function rankingFilters(tracks, params) {
  const route = params.get('track');
  const region = params.get('locality');
  const offset = Number(params.get('offset') || 0);
  const course = route && tracks.find(track => track.id === route);
  if (route && !course) throw new HttpError(400, 'Circuito desconocido.');
  if (region && !tracks.some(track => track.region === region)) throw new HttpError(400, 'Localidad desconocida.');
  if (course && region && course.region !== region) throw new HttpError(400, 'El circuito no pertenece a esa localidad.');
  if (!Number.isSafeInteger(offset) || offset < 0) throw new HttpError(400, 'Página de clasificación no válida.');
  return {route, region, offset};
}
