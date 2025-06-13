module.exports = {
  apps: [{
    name: 'customer-service-hub',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      RATE_LIMIT_ENABLED: 'true',
      ENABLE_REQUEST_LOGGING: 'true',
      CACHE_TTL: '300',
      MAX_CONNECTIONS: '100'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};