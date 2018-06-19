import webpack from "webpack";

module.exports = [{
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
    devtool: "inline-source-map"
    // resolve: {
    //   moduleDirectories
    // }
  }];