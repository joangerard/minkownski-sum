var express = require('express');
var app = express();
const PORT = process.env.PORT || 3000

app.use(express.static('public'));
app.use('/scripts', express.static(__dirname + '/node_modules/pixi.js/dist/'));

app.get('/', function (req, res) {
    // res.send('Hello World');
    res.sendfile('index.html');
});

app.get('/hello', function (req, res) {
    res.render('hello', { title: 'Hello', message: 'Hello there!' })
  });

app.listen(PORT, function(){
    console.log(`Listening on port ${ PORT }!`)
  });
  