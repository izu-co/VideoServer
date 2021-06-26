const path = require('path');

module.exports = (env, argv) => {
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
    }

    if (env.mode === 'development')
        config.devtool = 'inline-source-map'

    return config;
};