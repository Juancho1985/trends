var menuChannel = require('../commons/channels/menu'),
    appConfig = require('../config'),
    menuChannel = require('../commons/channels/menu'),
    MenuModel;

MenuModel = Backbone.Model.extend({
  defaults: {
    rows: 1,
    cols: 1
  },
  initialize: function () {
    menuChannel.commands.setHandler('change:size', this.changeTrendsSize.bind(this));
    menuChannel.reqres.setHandler('size', this.getSize.bind(this));
  },
  getSize: function () {
    return {
      cols: this.get('cols'),
      rows: this.get('rows')
    };
  },
  changeTrendsSize: function (size) {
    var cols = size ? size.cols : 0,
        rows = size ? size.rows : 0;
    //Control Min Values
    if (cols < 1) {
      cols = 1;
    }
    if (rows < 1) {
      rows = 1;
    }
    //Control Max Values
    if (cols > appConfig.max_columns) {
      cols = appConfig.grid.max_columns;
    }
    if (rows > appConfig.max_rows) {
      rows = appConfig.grid.max_rows;
    }

    this.set('rows', rows);
    this.set('cols', cols);

    menuChannel.vent.trigger('grid:changed', this.toJSON());
  }
});
module.exports = MenuModel;
