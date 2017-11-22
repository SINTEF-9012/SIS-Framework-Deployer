//This is used to load javascript files dynamically :)
var path = require('path'),
    walk = require('walk');

var class_loader = function () {
    var that = {};
    that.findModules = function (opts, done, ctx) {
        var walker = walk.walk(opts.folder, {
                followLinks: false
            }),
            modules = [];

        walker.on('file', function (root, stat, next) {
            var relative = path.join(root, stat.name),
                current = path.join(path.dirname(require.main.filename), relative);
            extname = path.extname(current);

            if (extname === '.js' && (opts.filter === undefined || opts.filter(current))) {
                var module = require(current);
                var tmp = {};
                tmp.id = stat.name;
                tmp.module = module;
                modules.push(tmp);
            }

            next();
        });

        walker.on('end', function () {
            done(modules, ctx);
        });
    }
    return that;
};



module.exports = class_loader;