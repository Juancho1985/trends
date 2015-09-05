var mock = require('../../../mock'),
    TrendsCollection = require('./collections/Trends'),
    menuChannel = require('../../../commons/channels/menu'),
    layout = require('../../../commons/channels/presenter'),
    CellsCollectionView = require('../views/Cells'),
    Trends;

Trends = Marionette.Controller.extend({
  start: function() {
    var presenter = layout.reqres.request('layout');

    menuChannel.reqres.setHandler('trends', this.getTrends.bind(this));

    this.cellsCollectionView = new CellsCollectionView({ collection: new Backbone.Collection() });

    presenter.main.show(this.cellsCollectionView);
    menuChannel.vent.on('grid:changed', this.onChangeGrid, this);
  },
  getTrends: function () {
    return new TrendsCollection(_.shuffle(mock));
  },

  onChangeGrid: function() {
    var cells = [],
    size = menuChannel.reqres.request('size');

    for (var i = 0; i < size.cols; i++) {
      for (var j = 0; j < size.rows; j++) {
        cells.push({
          id: '' + i + '-' + j,
          size: {
            cols: size.cols,
            rows: size.rows
          }
        });
      }
    }
    this.cellsCollectionView.collection.set(cells);
  }
});

module.exports = new Trends();
