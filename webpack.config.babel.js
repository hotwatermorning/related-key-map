var path = require("path");
var webpack = require("webpack");

module.exports = (env, args) => {
  return {
    entry: {
      "index" : "./_src/js/index.js",
      "site-documents": "./_src/js/site-documents.js"
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
      },{
        test: /\.(mp3)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "[path][name].[ext]",
            outputPath: (url, resourcePath, context) => {
              var dir = path.dirname(url);
              var relative_path = path.relative("_src", dir);
              var base = path.basename(url);
              return path.join(relative_path, base);
            },
            publicPath: (url, resourcePath, context) => {
              var dir = path.dirname(url);
              var relative_path = path.relative("_src", dir);
              var base = path.basename(url);
              return path.join(relative_path, base);
            },
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