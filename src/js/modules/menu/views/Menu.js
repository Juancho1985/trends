var appConfig = require('../../../config'),
    menuChannel = require('../../../commons/channels/menu'),
    menuTemplate = require('../templates/menu'),
    Menu;

Menu = Marionette.ItemView.extend({
  template: menuTemplate,
  className: 'container-fluid',

  ui: {
    btn_grid: '.btn-grid',
    popover_content: '.popover-content'
  },

  onOverCell: function(evt) {
    var cell = $(evt.currentTarget),
        column = +cell.data('col');

    $('.popover > .popover-content .cell').removeClass('btn-primary');

    cell.addClass('btn-primary');
    for (var i = column; i > 0; i--) {
      cell.prevAll(':nth-child(6n+' + i + ')').addClass('btn-primary');
    }
  },

  onClickCell: function() {
    this.ui.btn_grid.popover('hide');
  },

  onRender: function() {
    var self = this;
    _.defer(function() {
      self.ui.btn_grid.popover({
        html: true,
        content: self.ui.popover_content.html(),
        viewport: { selector: 'body', padding: '10' },
        placement: 'bottom',
        toggle: 'popover'
      });

      self.ui.btn_grid.on('shown.bs.popover', function() {
        $('.popover > .popover-content .cell')
          .on('mouseover', self.onOverCell.bind(self))
          .one('click', self.onClickCell.bind(self));
      });
    });
  },

  serializeData: function() {
    var size  = this.model.getSize(),
        cells = [];

    for (var i = 1; i <= appConfig.max_rows; i++) {
      for(var j = 1; j <= appConfig.max_columns; j++) {
        cells.push({
          i: i,
          j: j
        });
      }
    }
    return {
      cells: cells
    };
  }
});

module.exports = Menu;
