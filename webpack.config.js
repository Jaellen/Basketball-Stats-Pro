"use strict";

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
      test: /\.(png|jpg)$/, 
      loader: 'url-loader?limit=8192' 
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
