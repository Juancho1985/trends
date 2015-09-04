var template, AppLayout;

template = require('./layout');
/**
 * App Layout
 */
AppLayout = Marionette.LayoutView.extend({
  template: template,
  el: 'body',
  regions: {
    main  : '#main',
    menu  : '#menu'
  }
});
module.exports = AppLayout;
