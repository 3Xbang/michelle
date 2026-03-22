module.exports = {
  apps: [
    {
      name: 'mira',
      script: '/var/www/mira/server/src/index.js',
      cwd: '/var/www/mira/server',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'mira_db',
        DB_USER: 'mira',
        DB_PASSWORD: 'MiraPms2024x',
        JWT_SECRET: 'mira-villa-pms-secret-key-2024',
        JWT_EXPIRES_IN: '24h',
        CORS_ORIGIN: '*'
      },
      error_file: '/var/log/mira/error.log',
      out_file: '/var/log/mira/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 5000,
      max_restarts: 10
    }
  ]
};
