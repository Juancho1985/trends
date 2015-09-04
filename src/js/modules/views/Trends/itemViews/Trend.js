var trendTemplate = require('../../../templates/Trends/trend'),
Trend;

Trend = Marionette.ItemView.extend({
  template: trendTemplate,
  className: 'trend',
  ui: {
    text: 'h1'
  },
  initialize: function() {
    this.render();
  },
  onRender: function() {
    this.$el.addClass('bg-' + this.model.get('category'));
    this.ui.text.typed({
      strings: [this.model.get('text') + ''],
      startDelay: 500,
      showCursor: false
    });
  }
});

module.exports = Trend;
