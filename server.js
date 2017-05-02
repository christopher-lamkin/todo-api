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
  var queryParams = req.query;
  var filteredTodos = todos;

  if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true' ){
    filteredTodos = _.where(todos, {completed: true});
  } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false'){
    filteredTodos = _.where(todos, {completed: false});
  }

  var searchTerm = queryParams["q"];

  if (searchTerm){
    var searchResults = _.filter(filteredTodos, function(todo){return todo.description.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1});
  } else {
    var searchResults = filteredTodos;
  }

  res.json(searchResults);
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

app.put('/todos/:id', function(req, res){
  var todoID = parseInt(req.params.id, 10);
  var matchedTodo = _.findWhere(todos, {id: todoID});
  var todo = _.pick(req.body, 'description', 'completed');
  var validAttributes = {};

  if (!matchedTodo){
    return res.status(404).json({"error": "no todo found with that ID"});
  }

  if (todo.hasOwnProperty('completed') && _.isBoolean(todo.completed)){
    validAttributes.completed = todo.completed;
  } else if (todo.hasOwnProperty('completed')) {
    return res.status(400).send();
  }

  if (todo.hasOwnProperty('description') && _.isString(todo.description) && todo.description.trim().length > 0){
    validAttributes.description = todo.description;
  } else if (todo.hasOwnProperty('description')){
    return res.status(400).send();
  }

  _.extend(matchedTodo, validAttributes);
  res.json(matchedTodo);
});

db.sequelize.sync().then(function(){
  app.listen(PORT, function(){
    console.log('Express listening on port ' + PORT + '.');
  });
});
