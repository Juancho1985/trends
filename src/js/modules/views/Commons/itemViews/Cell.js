var TrendsCellItemView = require('../../Trends/itemViews/TrendsCell'),
menu = require('../../../../commons/channels/menu'),
trendsChannel = require('../../../../commons/channels/trends'),
appConfig = require('../../../../config'),
Cell;

Cell = Marionette.ItemView.extend({
  template: _.template(''),

  modelEvents: {
    'change size': 'onChangeSize'
  },

  onChangeSize: function() {
    var size = menu.reqres.request('size');
    this.$el.removeClass();
    this.$el.addClass('cell cell-' + size.cols + '-' + size.rows);
  },

  onRender: function() {
    var trends = trendsChannel.reqres.request('trends'),
    trendsCellItemView;

    trendsCellItemView = new TrendsCellItemView({ collection: trends });

    this.$el.html(trendsCellItemView.$el);
    this.onChangeSize();
  }
});

module.exports = Cell;
