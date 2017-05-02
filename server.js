var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res){
  res.send('Todo API Root');
});

app.get('/todos', function(req, res){
  var query = req.query;
  var where = {};

  if (query.hasOwnProperty('completed') && query.completed === 'true'){
    where.completed = true;
  } else if (query.hasOwnProperty('completed') && query.completed === 'false'){
    where.completed = false;
  }

  if (query.hasOwnProperty('q') && query.q.length > 0){
    where.description = {
      $like: '%' + query.q + '%'
    };
  }

  db.todo.findAll({where: where}).then(function(todos){
    res.json(todos);
  }, function(e){
    res.status(500).send()
  });
});

app.get('/todos/:id', function(req, res){
  var todoID = parseInt(req.params.id, 10);
  db.todo.findById(todoID).then(function(todo){
    if (!!todo){
      res.json(todo);
    } else {
      res.status(404).send();
    }
  }, function(e){
    res.status(500).send();
  });
});

app.post('/todos', function(req, res){
  var body = _.pick(req.body, 'description', 'completed');

  db.todo.create(body).then(function(todo){
      res.status(200).send(todo.toJSON());
  }, function(e){
    res.status(400).json(e);
  });
});

app.delete('/todos/:id', function(req, res){
  var todoID = parseInt(req.params.id, 10);
  console.log(todoID);
  db.todo.destroy({
    where: {
      id: todoID
    }
  }).then(function(rowsDeleted){
    console.log(rowsDeleted);
    if (rowsDeleted === 0){
      res.status(404).json({
        error: 'No todo with id'
      });
    } else {
      res.status(204).send();
    }
  }, function(){
    res.status(500).send();
  });
});

app.put('/todos/:id', function(req, res){
  var todoID = parseInt(req.params.id, 10);
  var todo = _.pick(req.body, 'description', 'completed');
  var attributes = {};

  if (todo.hasOwnProperty('completed')){
    attributes.completed = todo.completed;
  }

  if (todo.hasOwnProperty('description')){
    attributes.description = todo.description;
  }

  db.todo.findById(todoID).then(function(todo){
    if (todo){
      todo.update(attributes).then(function(todo){
        res.json(todo.toJSON());
      }, function(e){
        res.status(400).json(e);
      })
    } else {
      res.status(404).send();
    }
  }, function(){
    res.status(500).send();
  });
});

db.sequelize.sync().then(function(){
  app.listen(PORT, function(){
    console.log('Express listening on port ' + PORT + '.');
  });
});
