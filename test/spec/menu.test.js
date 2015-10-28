var expect = require('expect.js');

describe("Menu Controller", function () {
  var menu;
  beforeEach(function () {
    menu = require('../../src/js/modules/menu/menu.js');
  });
  it("should be have an start method", function () {
    expect(menu.start).not.to.be(undefined);
  });
});

