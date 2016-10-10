module.exports = {
   entry: ["./src/js/global.js", "./app.js"],
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
         presets: ['react', 'es2015']
       }
     },
     {
       test: /\.json$/,
       loader: 'json-loader'
     },
     {
       test: /\.css$/,
       loader: 'style-loader!css-loader'
     }
   ]
 },
 resolve: {
   extensions: ['', '.js', '.es6']
 },
  watch: true
}
