var MenuItemView = require('../views/Commons/itemViews/Menu'),
    menuChannel = require('../../commons/channels/menu'),
    layout = require('../../commons/channels/presenter'),
    TrendsModel = require('../../entities/Trends'),
    Menu;

Menu = Marionette.Object.extend({
  start: function() {
    var presenter = layout.reqres.request('layout');
    this.model = new TrendsModel();
    this.menuItemView = new MenuItemView();
    presenter.menu.show(this.menuItemView);
  }
});

module.exports = new Menu();
