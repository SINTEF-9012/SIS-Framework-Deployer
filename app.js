var express = require('express');
var path = require('path');
var app = express();
var runtime = require('./engine/engine.js');
// Define the port to run on
app.set('port', 8880);

//provide access to the editor
app.use("/js", express.static(path.join(__dirname, 'js')));
app.use("/editor", express.static(path.join(__dirname, 'editor')));
app.use("/css", express.static(path.join(__dirname, 'css')));
app.use("/fonts", express.static(path.join(__dirname, 'fonts')));
app.use("/metamodel", express.static(path.join(__dirname, 'metamodel')));
app.use("/repository", express.static(path.join(__dirname, 'repository')));
app.use(express.static(path.join(__dirname, '')));

//Start the engine
console.log('Engine started!\n');
runtime.start();

// Listen for editor requests
var server = app.listen(app.get('port'), function () {
    var port = server.address().port;
    console.log('Magic happens on port ' + port);
});