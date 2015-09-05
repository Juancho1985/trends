var routesToControl = require('./routes'),
    trendsCtlr = require('./cells/trends/trends'),
    menuCtlr = require('./menu/menu'),
    appConfig = require('../config'),
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
