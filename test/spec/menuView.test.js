var expect = require('expect.js'),
MenuView = require('../../src/js/modules/menu/views/Menu.js'),
appConfig = require('../../src/js/config'),
MenuModel = require('../../src/js/entities/Menu.js');

describe("Menu View", function () {
  var menuModel, menu;

  beforeEach(function () {
    menuModel = new MenuModel(),
    menu = new MenuView({
      model: menuModel
    });
  });
  it("should have a serialize data with rows in same quantity as configuration", function () {
    var serializedData = menu.serializeData(), lastCell;
    lastCell = _.last(serializedData.cells);
    expect(lastCell.i).to.be(appConfig.max_rows);
  });
  it("should have a serialize data with cols in same quantity as configuration", function () {
    var serializedData = menu.serializeData(), lastCell;
    lastCell = _.last(serializedData.cells);
    expect(lastCell.j).to.be(appConfig.max_columns);
  });
});

