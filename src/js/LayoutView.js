var template, AppLayout;

template = require('./layout.hbs');
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
