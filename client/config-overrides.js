module.exports = function override(config, env) {
  return config;
};

module.exports.devServer = function overrideDevServer(configFunction) {
  return function (proxy, allowedHost) {
    const config = configFunction(proxy, allowedHost);

    config.allowedHosts = ['localhost'];
    config.host = 'localhost';
    config.port = 3000;

    return config;
  };
};
