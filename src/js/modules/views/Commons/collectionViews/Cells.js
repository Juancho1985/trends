var CellItemView = require('../itemViews/Cell'),
Cells;

Cells = Marionette.CollectionView.extend({
  childView: CellItemView,
  className: 'row'
});

module.exports = Cells;
