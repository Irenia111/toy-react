module.exports = {
    // 入口文件
    entry: {
        main: './main.js'
    },
    // 增加build后文件可读性，不压缩打包后文件
    mode: "development",
    optimization: {
        minimize: false
    },
    // modules 打包规则
    module: {
        rules: [
            // js 文件需经过babel
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    // 配置babel-loader
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [['@babel/plugin-transform-react-jsx', {pragma: 'createElement'}]]
                    }
                }
            }
        ]
    }
}
