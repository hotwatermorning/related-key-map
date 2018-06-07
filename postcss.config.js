module.exports = {
    plugins: [
        require("postcss-simple-vars")({
            silent: true
        }),
        require("postcss-nested"),
        require("postcss-for"),
        require("postcss-extend"),
        require("autoprefixer")({
            browsers: ["last 5 versions"]
        }),
        require("postcss-cssnext"),
    ]
};
