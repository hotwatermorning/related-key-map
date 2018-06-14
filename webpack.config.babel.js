import webpack from "webpack";
import ExtractTextPlugin from "extract-text-webpack-plugin"; // need for writing CSS files.

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
      }]
    },
    // resolve: {
    //   moduleDirectories
    // }
  }];