var main      = require('./modules/main'),
    menu      = require('./modules/controllers/menu'),
    presenter     = require('./commons/channels/presenter'),
    routes = require('./modules/routes'),
    AppController;

AppController = Marionette.Object.extend({
  app: null,
  /**
   * Initialize application for controller
   * @param app Marionette.Application
   */
  initialize: function (app) {
    this.app = app;
    presenter.reqres.setHandler("layout", this.getAppLayout.bind(this));
  },
  /**
   * Gets the application Layout
   * @return Marionette.LayoutView
   */
  getAppLayout: function () {
    return this.app.layout;
  },
  /**
   * Start of application
   */
  start: function (app, router) {
    this.app = app;
    this.router = router;
    main.start(this.router);
  }
});

module.exports = AppController;
