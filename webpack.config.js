//Bundle the modules into app.bundle.js by running 'webpack' from commmand line
//Run 'webpack-dev-server' from command line to run a server on localhost:8080/

var path = require('path');
var SRC = path.join(__dirname, 'src/');
var NODE_MODULES = path.join(__dirname, 'node_modules/');


var config = {
     entry: './src/app.js',
     output: {
         path: './bin',
         filename: 'app.bundle.js',
     },
     resolve: {
     root: [SRC, NODE_MODULES],
     alias: {
      'login': path.join(SRC, './js/login'),
      'nav': path.join(SRC, './js/nav'),
      'stats': path.join(SRC, './js/stats'),
      'compare': path.join(SRC, './js/compare'),
      'favourites': path.join(SRC, './js/favourites'),
      'account': path.join(SRC, './js/account'),
      'data-service': path.join(SRC, './js/components/data-service'),
      'login-component': path.join(SRC, './js/components/login-component'),
      'switch-component': path.join(SRC, './js/components/switch-component'),
      'search-component': path.join(SRC, './js/components/search-component'),
      'star-component': path.join(SRC, './js/components/star-component'),
      'picture-component': path.join(SRC, './js/components/picture-component'),
      'stats-main-component': path.join(SRC, './js/components/stats-main-component'),
      'stats-secondary-component': path.join(SRC, './js/components/stats-secondary-component'),
      'compare-component': path.join(SRC, './js/components/compare-component'),
      'carousel-component': path.join(SRC, './js/components/carousel-component'),
      'compare-main-component': path.join(SRC, './js/components/compare-main-component'),
      'compare-secondary-component': path.join(SRC, './js/components/compare-secondary-component'),
      'rankings-component': path.join(SRC, './js/components/rankings-component'),
      'account-component': path.join(SRC, './js/components/account-component')
      }
     },
     module: {
         loaders:
         [
           {
             test: /\.js$/,
             exclude: /node_modules/,
             loader: 'babel-loader'
           },
           {
             test: /\.css$/,
             loaders: ['style', 'css']
           },
           {
             test: /\.scss$/,
             loaders: ["style", "css", "sass"]
           },
           {
             test: /\.(jpg|png|svg)$/,
             loader: 'file?name=public/images/[name].[ext]'
           }
        ]
     }
 }

module.exports = config;
