var TrendsCellItemView = require('../trends/views/TrendsCell'),
    menuChannel = require('../../../commons/channels/menu'),
    appConfig = require('../../../config'),
    Cell;

Cell = Marionette.ItemView.extend({
  template: _.template(''),

  modelEvents: {
    'change size': 'onChangeSize'
  },

  onChangeSize: function() {
    var size = menuChannel.reqres.request('size');
    this.$el.removeClass();
    this.$el.addClass('cell cell-' + size.cols + '-' + size.rows);
  },

  onRender: function() {
    var trends = menuChannel.reqres.request('trends'),
        trendsCellItemView;

    trendsCellItemView = new TrendsCellItemView({ collection: trends });

    this.$el.html(trendsCellItemView.$el);
    this.onChangeSize();
  }
});

module.exports = Cell;
