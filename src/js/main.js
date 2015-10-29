/**
 * Main Dependencies
 */
var config = require('./config'),
  AppLayout = require('./LayoutView'),
  AppRouter = require('./router'),
  App = require('./app'),
  AppController = require('./controller'),
  router,
  api,
  appController;

/**
 * Application starts by assigning an app controller to the router
 * and the router to the application.
 * Then start controller and routing.
 */
App.on('start', function() {
  appController = new AppController(this);
  router = new AppRouter();

  App.layout = new AppLayout();

  App.layout.render();
  appController.start(this, router);
  Backbone.history.start();
});

module.exports = App;
