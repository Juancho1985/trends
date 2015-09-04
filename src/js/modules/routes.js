var routes = {
  '': 'initRoute',
  'home(/:rows/:cols)': 'showTrends',
  '*action': 'initRoute'
};

module.exports = routes;
