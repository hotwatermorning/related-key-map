import webpack from "webpack";

module.exports = (env, args) => {
  return {
    entry: {
      index : __dirname + "/_src/js/index.js"
    },
    output: {
      path: __dirname + "/public/js/",
      filename: "[name].bundle.js"
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
        use: [ "style-loader", "postcss-loader" ]
      },{
        test: /\.(jpe?g|png|gif|svg|ico)(\?.+)?$/,
        use: {
          loader: "url-loader",
          options: {
            limit: 8192,
          }
        }
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

if (process.env.NODE_ENV !== 'production') {
  module.exports.devtool = 'inline-source-map';
}