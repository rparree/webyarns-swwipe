const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const {GitRevisionPlugin} = require('git-revision-webpack-plugin')
const gitRevisionPlugin = new GitRevisionPlugin({
    versionCommand: 'describe --always --tags --abbrev=0',
})

function genHtmlWebpackPlugin(template) {
    return new HtmlWebpackPlugin({
        template: template,
        scriptLoading: "blocking",
        inject: "head",
        filename: template
    });
}

module.exports = (env, argv) => {
    const version = gitRevisionPlugin.version()
    commitHash = JSON.stringify(gitRevisionPlugin.commithash())
    const isDevMode = argv.mode === 'development';
    console.log("development mode: ", isDevMode)

    const babelPlugins = [
        "@babel/plugin-proposal-optional-chaining",
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-transform-runtime"
    ]
    console.log("ENV", argv.mode);
    if (argv.mode === 'production') {
        babelPlugins.push(['transform-remove-console', {exclude: ['error', 'warn']}]);
    }
    const devtool = argv.mode === 'production' ? "source-map" : "eval";
    return {
        resolve: {
            extensions: ['.ts', '.js'],
        },
        mode: "development",
        entry: {
            'webyarns-swwipe': {
                import: "./src/index.ts",
                filename: `webyarns-swwipe-${version}.js`,
            },
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
        },
        devtool,
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            "presets": [
                                ['@babel/preset-env', {targets: "defaults"}],
                                "@babel/typescript"
                            ],
                            "plugins": babelPlugins,

                        }
                    }
                },
                {
                    test: /\.css$/i,
                    use: [
                        isDevMode ? "style-loader" : MiniCssExtractPlugin.loader,
                        "css-loader",
                        "postcss-loader"
                        /*    "sass-loader",*/
                    ],
                }
            ]
        },
        plugins: [
            gitRevisionPlugin,
            genHtmlWebpackPlugin("index.html"),
            new CopyPlugin({

                patterns: [
                    {
                        from: "images/",
                        to: "images/"
                    },
                    {
                        from: "node_modules/webyarns-reveal/js",
                        to: "js"
                    },
                    {
                        from: "node_modules/webyarns-reveal/webyarns-util/lib",
                        to: "js"
                    },
                    {
                        from: "node_modules/webyarns-reveal/css",
                        to: "css"
                    },
                    {
                        from: "node_modules/webyarns-reveal/lib/css/",
                        to: "lib/css/"
                    },
                    {
                        from: "lib/font/**",
                        context: path.resolve(__dirname, "node_modules", "webyarns-reveal"),
                    },
                ],

            }),
            new MiniCssExtractPlugin({
                filename: `[name]-${version}.css`,
            }),
            new webpack.BannerPlugin({
                banner: `version: ${version} (${commitHash})\n`
            }),
        ],
        devServer: {
            port: 9090,
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    extractComments: false
                })
            ]
        }
    }
};
