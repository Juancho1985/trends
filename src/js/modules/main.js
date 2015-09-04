var routesToControl = require('./routes'),
    Cells = require('./views/Commons/collectionViews/Cells'),
    mock = require('../mock'),
    Trends = require('./collections/Trends'),
    trendsCtlr = require('./controllers/trends'),
    menuCtlr = require('./controllers/menu'),
    appConfig = require('../config'),
    presenter = require('../commons/channels/presenter'),
    menu = require('../commons/channels/menu'),
    MainController;

MainController = Marionette.Object.extend({
  start: function(router) {
    trendsCtlr.start();
    menuCtlr.start();
    router.processAppRoutes(this, routesToControl);
  },
  initRoute: function() {
    Backbone.history.navigate('home', { trigger: true });
  },
  showTrends: function(cols, rows) {
    menu.commands.execute('change:size', { cols: cols, rows: rows});
  }
});

module.exports = new MainController();
