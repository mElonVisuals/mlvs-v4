import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    import(pathToFileURL(path.join(eventsPath, file)).href).then(evtModule => {
      const evt = evtModule.default || evtModule;
      const name = evt.name || evtModule.name;
      const once = evt.once || evtModule.once;
      const execute = evt.execute || evtModule.execute;
      if (!name || !execute) return;
      if (once) client.once(name, (...args) => execute(...args, client));
      else client.on(name, (...args) => execute(...args, client));
  logger.info('events', `Registered ${name}${once ? ' (once)' : ''}`);
    });
  }
}
