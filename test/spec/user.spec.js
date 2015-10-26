'use strict';
var expect = require('expect.js');
var user = require('../../user');

describe("Juancho", function () {
  it("name", function (done) {
    expect(user.name).to.be('juancho');
    done();
  });
  it("age", function () {
    expect(user.age).to.be(30);
  });
});
