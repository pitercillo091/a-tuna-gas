import game from './motor.mjs';
import {serveRanking} from './ranking.mjs';

const database = Deno.env.get('SUPABASE_URL');
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!database || !key) throw new Error('Falta la configuración privada del servidor.');

Deno.serve(serveRanking(game, database, key));
