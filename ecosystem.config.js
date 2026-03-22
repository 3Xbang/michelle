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
        PORT: 4000
      },
      error_file: '/var/log/mira/error.log',
      out_file: '/var/log/mira/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 5000,
      max_restarts: 10
    }
  ]
};
