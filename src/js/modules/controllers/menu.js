var MenuItemView = require('../views/Commons/itemViews/Menu'),
    menuChannel = require('../../commons/channels/menu'),
    layout = require('../../commons/channels/presenter'),
    MenuModel = require('../../entities/Menu'),
    Menu;

Menu = Marionette.Object.extend({
  start: function() {
    var presenter = layout.reqres.request('layout');
    this.model = new MenuModel();
    this.menuItemView = new MenuItemView({
      model: this.model
    });
    presenter.menu.show(this.menuItemView);
  }
});

module.exports = new Menu();
