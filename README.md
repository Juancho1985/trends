[![Build Status](https://api.travis-ci.org/jotaoncode/trends.svg)](https://api.travis-ci.org/jotaoncode/trends.svg)

[![Coverage Status](https://coveralls.io/repos/jotaoncode/trends/badge.svg?branch=master&service=github)](https://coveralls.io/repos/jotaoncode/trends?branch=master)

## Synopsis

Trends cards, an application to show trends by giving the effect you choose.

## Motivation

This project is finished on September 2014 aproximately, in those moments I did not know so much of CSS3. I learned some of this things from https://github.com/SRCres.
Now I want to improve those things learned by using some new things.

## Installation

$ npm install

$ gem install bootstrap-sass

Development
$ gulp

Production
$ gulp production

## API

Not defined, only front end with mock values. You can find de mock in sr/js/mock
You can define the api you need for production and development in the following
files:
/configs/app-config.json

Then remove the mock, and add a promise to get those values in the way you need,
set the collection with the values, and thats it :).

## Tests

Enviroment for tests is added, but there is not test yet.
If you define some test just run gulp karma and you will be able to
test what you need.

## Contributors

Juan José García

Sebastián Crespo
