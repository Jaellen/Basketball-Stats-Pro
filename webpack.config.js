"use strict";
let webpack = require('webpack');

module.exports = {
  entry: './src/app.js',
  output: {
    filename: "bundle.js"
  },
  module: {
   preLoaders: [
       {
         test: /\.js$/,
         exclude: /node_modules/,
         loader: 'jshint-loader'
       }
   ],
   loaders: [
     {
       test: [/\.js$/, /\.es6$/],
       exclude: /node_modules/,
       loader: 'babel-loader',
       query: {
         presets: ['es2015']
       }
     },
     {
       test: /\.(jpe?g|png|gif|svg)$/i,
       loaders: [
        'file?hash=sha512&digest=hex&name=[hash].[ext]',
        'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
        ]
     },
     {
       test: /\.json$/,
       loader: 'json-loader'
     },
     {
       test: /\.css$/,
       loader: 'style-loader!css-loader'
     },
     {
        test: /\.scss$/,
        loaders: ["style", "css", "sass"]
     }
   ]
 },
 resolve: {
   extensions: ['', '.js', '.es6']
 },
  watch: true
}
