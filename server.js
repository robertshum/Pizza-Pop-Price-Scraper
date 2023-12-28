import { initApp } from './index.js';
import {
  PORT
} from './config.js';


(async () => {
  const app = await initApp();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
