var fakeLocation,
  Router,
  router,
  webpage = require('webpage'),
  page ,
  vendors = require('../../src/js/vendors'),
  action,
  navigate = function (path) {
    fakeLocation.replace('http://example.com#' + path);
    Backbone.history.checkUrl();
  };



beforeEach(function () {
  page = webpage.create({
    website: 'http://www.phantomjs.org',
    title: 'Trends'
  });
  page.open(, function (status) {
    if (status === "success") {
      page.injectJs(vendors);
    } else {
      console.log('some error: ', arguments);
    }
  });
});

afterEach(function () {
  Backbone.history.stop();
});

describe("Main Application", function () {
  var Main = require('../../src/js/main.js');
  it("should have an start listener setted", function () {
    expect(true).to.be(true);
  });
});

