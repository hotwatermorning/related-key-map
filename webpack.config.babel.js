var path = require("path");
var webpack = require("webpack");

module.exports = (env, args) => {
  return {
    entry: {
      index : "./_src/js/index.js"
    },
    output: {
      filename: "[name].bundle.js",
      chunkFilename: "[name].bundle.js",
      path: path.resolve(__dirname, "public")
    },
    module: {
      rules: [{
        test: /\.js$/,
        exclude: [
          /node_modules/
        ],
        use: [{
          loader: "babel-loader",
          options: {
            presets: [ "env" ]
          }
        }],
      },{
        test: /\.css$/,
        use: [
          {
            loader: "style-loader"
          }, {
            loader: "postcss-loader",
            options: { config: { path: "./postcss.config.js" } }
          }
        ]
      },{
        test: /\.(jpe?g|png|gif|svg|ico|ttf)(\?.+)?$/,
        include: [
          path.resolve(__dirname, "_src", "images")
        ],
        use: {
          loader: "url-loader",
          options: {
            limit: 8192,
            name: "./images/[name].[ext]"
          }
        }
      },{
        test: /\.(otf|ttf)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "[name].[ext]",
            context: "",
          }
        },
      }]
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      })
    ],
  };
};

if (process.env.NODE_ENV === 'development') {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  if(!("plugins" in module.exports)) {
    module.exports.plugins = [];
  }
  module.exports.plugins.push(new BundleAnalyzerPlugin());
  module.exports.devtool = 'inline-source-map';
}