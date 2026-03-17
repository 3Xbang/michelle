import app from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';

const PORT = config.port || 3000;

app.listen(PORT, () => {
  logger.info(`Villa PMS server running on port ${PORT}`);
});
