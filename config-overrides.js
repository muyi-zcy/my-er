/** CRA webpack fix: @antv/x6 ESM imports omit .js extensions */
module.exports = function override(config) {
  config.module.rules.push({
    test: /\.m?js$/,
    include: /node_modules[\\/]@antv/,
    resolve: {
      fullySpecified: false,
    },
  });
  return config;
};
