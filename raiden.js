import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __path = dirname(__filename);
const PORT = process.env.PORT || 8000;

// Import your modules using dynamic imports or convert them to ES modules too
import('./qr.js').then(module => {
  const server = module.default || module;
  
  import('./pair.js').then(module => {
    const code = module.default || module;
    
    const app = express();
    
    // Set max listeners
    EventEmitter.defaultMaxListeners = 500;
    
    // Set up routes
    app.use('/qr', server);
    app.use('/code', code);
    
    app.use('/pair', async (req, res) => {
      res.sendFile(`${__path}/pair.html`);
    });
    
    app.use('/', async (req, res) => {
      res.sendFile(`${__path}/main.html`);
    });
    
    // Body parser middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
Powered by The Developer03

 Server running on http://localhost:${PORT}`);
    });
    
    // Export app (as default export in ES modules)
    export default app;
  });
});
