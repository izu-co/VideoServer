const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require("webpack")

module.exports = (env, argv) => {
    if (!env)
        env = {}
    if (!Object.prototype.hasOwnProperty.call(env, 'PREFIX_URL'))
        env.PREFIX_URL = ''
    if (!argv.mode)
        env.mode = "development";
    const config = {
        watch: false,
        target: 'web',
        mode: env.mode,
        entry: {
            generalFunctions: './html/js/generalFunctions',
            login: {
                dependOn: 'generalFunctions',
                import: './html/js/login',
            },
            admin: {
                dependOn: 'generalFunctions',
                import: './html/js/admin',
            },
            player: {
                dependOn: 'generalFunctions',
                import: './html/js/player',
            }, 
            server: {
                dependOn: 'generalFunctions',
                import: './html/js/server',
            },
            settings: {
                dependOn: 'generalFunctions',
                import: './html/js/settings',
            },
            videoSelector: {
                dependOn: 'generalFunctions',
                import: './html/js/videoSelector',
            }
        },
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: path.join('html', 'js', '[name].js')
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js']
        },
        module: {
            rules: [
                { test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ }
            ]
        },
        plugins: [
            ...getHtmlFiles(env),
            new webpack.DefinePlugin({
                ___PREFIX_URL___: JSON.stringify(env.PREFIX_URL)
            })
        ]
    }

    if (env.mode === 'development')
        config.devtool = 'inline-source-map'

    return config;
};

const getHtmlFiles = (args) => {
    let ret = []
    let htmlFiles = [
        'admin', 'player', 'server',
        'settings', 'videoSelector'
    ]
    for (let htmlFile of htmlFiles) {
        ret.push(new HtmlWebpackPlugin({
            template: `./html/${htmlFile}/index.html`,
            chunks: [ ],
            filename: `./html/${htmlFile}/index.html`,
            templateParameters: args,
            minify: false
        }))
    }
    ret.push(new HtmlWebpackPlugin({
        template: './html/index.html',
        chunks: [ ],
        filename: './html/index.html',
        templateParameters: args,
        minify: false
    }))
    return ret;
}