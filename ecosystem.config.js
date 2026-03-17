module.exports = {
  apps: [
    {
      name: 'villa-pms',
      script: 'server/src/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/villa-pms/error.log',
      out_file: '/var/log/villa-pms/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 5000,
      max_restarts: 10
    }
  ]
};
