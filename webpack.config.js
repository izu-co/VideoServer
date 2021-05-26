const path = require('path');

module.exports = {
    watch: false,
    target: 'web',
    mode: 'development',
    devtool: 'inline-source-map',
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
        path: path.resolve(__dirname, 'build', 'html', 'js'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ }
        ]
    }
};