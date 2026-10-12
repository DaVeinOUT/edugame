/* ============================================================
   SCREENS/INDEX.JS — Registre des écrans d'EDUCA v2
   Le routeur (js/ui/router.js) monte chaque écran par son nom.
   ============================================================ */

import { welcome } from './welcome.js';
import { profiles } from './profiles.js';
import { hub } from './hub.js';
import { path } from './path.js';
import { lesson } from './lesson.js';
import { collection } from './collection.js';
import { ladder } from './ladder.js';
import { games } from './games.js';
import { trace } from './trace.js';
import { adult } from './adult.js';
import { placement } from './placement.js';

export const screens = { welcome, profiles, hub, path, lesson, collection, ladder, games, trace, adult, placement };
