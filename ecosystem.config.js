module.exports = {
  apps: [
    {
      name: "dataAggregator",
      script: "server.js",
      autorestart: true, // Enables automatic restart
      watch: true, // Restarts the app when a file changes (optional)
      max_memory_restart: "200M", // Optional: Restarts the app if it reaches 100M memory usage
      // other configurations...
    },
  ],
};
