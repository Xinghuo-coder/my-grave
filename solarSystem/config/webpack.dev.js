const path = require('path')

module.exports = {
  devtool: 'source-map',
  mode: 'development',
  entry: './src/js/index.ts',
  output: {
    path: path.resolve(__dirname, '../dist/js'),
    filename: 'main.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, '../src')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  devServer: {
    hot: true,
    progress: true,
    contentBase: path.resolve(__dirname, '../dist'),
    publicPath: '/js/',
    compress: true,
    open: 'Chrome',
    openPage: 'index.html',
    port: 8095
  }
}