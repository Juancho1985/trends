(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Main Dependencies
 */
var config = require('./config'),
  AppLayout = require('./LayoutView'),
  AppRouter = require('./router'),
  App = require('./app'),
  AppController = require('./controller'),
  router,
  api,
  appController;

/**
 * Application starts by assigning an app controller to the router
 * and the router to the application.
 * Then start controller and routing.
 */
App.on('start', function() {
  appController = new AppController(this);
  router = new AppRouter();

  App.layout = new AppLayout();

  App.layout.render();
  appController.start(this, router);
  Backbone.history.start();
});

App.start();

},{"./LayoutView":11,"./app":12,"./config":15,"./controller":16,"./router":33}],2:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;

var _import = require('./handlebars/base');

var base = _interopRequireWildcard(_import);

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)

var _SafeString = require('./handlebars/safe-string');

var _SafeString2 = _interopRequireWildcard(_SafeString);

var _Exception = require('./handlebars/exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var _import2 = require('./handlebars/utils');

var Utils = _interopRequireWildcard(_import2);

var _import3 = require('./handlebars/runtime');

var runtime = _interopRequireWildcard(_import3);

var _noConflict = require('./handlebars/no-conflict');

var _noConflict2 = _interopRequireWildcard(_noConflict);

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
function create() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = _SafeString2['default'];
  hb.Exception = _Exception2['default'];
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function (spec) {
    return runtime.template(spec, hb);
  };

  return hb;
}

var inst = create();
inst.create = create;

_noConflict2['default'](inst);

inst['default'] = inst;

exports['default'] = inst;
module.exports = exports['default'];
},{"./handlebars/base":3,"./handlebars/exception":4,"./handlebars/no-conflict":5,"./handlebars/runtime":6,"./handlebars/safe-string":7,"./handlebars/utils":8}],3:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.HandlebarsEnvironment = HandlebarsEnvironment;
exports.createFrame = createFrame;

var _import = require('./utils');

var Utils = _interopRequireWildcard(_import);

var _Exception = require('./exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var VERSION = '3.0.1';
exports.VERSION = VERSION;
var COMPILER_REVISION = 6;

exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1'
};

exports.REVISION_CHANGES = REVISION_CHANGES;
var isArray = Utils.isArray,
    isFunction = Utils.isFunction,
    toString = Utils.toString,
    objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials) {
  this.helpers = helpers || {};
  this.partials = partials || {};

  registerDefaultHelpers(this);
}

HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: logger,
  log: log,

  registerHelper: function registerHelper(name, fn) {
    if (toString.call(name) === objectType) {
      if (fn) {
        throw new _Exception2['default']('Arg not supported with multiple helpers');
      }
      Utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function unregisterHelper(name) {
    delete this.helpers[name];
  },

  registerPartial: function registerPartial(name, partial) {
    if (toString.call(name) === objectType) {
      Utils.extend(this.partials, name);
    } else {
      if (typeof partial === 'undefined') {
        throw new _Exception2['default']('Attempting to register a partial as undefined');
      }
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function unregisterPartial(name) {
    delete this.partials[name];
  }
};

function registerDefaultHelpers(instance) {
  instance.registerHelper('helperMissing', function () {
    if (arguments.length === 1) {
      // A missing field in a {{foo}} constuct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new _Exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"');
    }
  });

  instance.registerHelper('blockHelperMissing', function (context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if (context === true) {
      return fn(this);
    } else if (context === false || context == null) {
      return inverse(this);
    } else if (isArray(context)) {
      if (context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.name);
        options = { data: data };
      }

      return fn(context, options);
    }
  });

  instance.registerHelper('each', function (context, options) {
    if (!options) {
      throw new _Exception2['default']('Must pass iterator to #each');
    }

    var fn = options.fn,
        inverse = options.inverse,
        i = 0,
        ret = '',
        data = undefined,
        contextPath = undefined;

    if (options.data && options.ids) {
      contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (isFunction(context)) {
      context = context.call(this);
    }

    if (options.data) {
      data = createFrame(options.data);
    }

    function execIteration(field, index, last) {
      if (data) {
        data.key = field;
        data.index = index;
        data.first = index === 0;
        data.last = !!last;

        if (contextPath) {
          data.contextPath = contextPath + field;
        }
      }

      ret = ret + fn(context[field], {
        data: data,
        blockParams: Utils.blockParams([context[field], field], [contextPath + field, null])
      });
    }

    if (context && typeof context === 'object') {
      if (isArray(context)) {
        for (var j = context.length; i < j; i++) {
          execIteration(i, i, i === context.length - 1);
        }
      } else {
        var priorKey = undefined;

        for (var key in context) {
          if (context.hasOwnProperty(key)) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey) {
              execIteration(priorKey, i - 1);
            }
            priorKey = key;
            i++;
          }
        }
        if (priorKey) {
          execIteration(priorKey, i - 1, true);
        }
      }
    }

    if (i === 0) {
      ret = inverse(this);
    }

    return ret;
  });

  instance.registerHelper('if', function (conditional, options) {
    if (isFunction(conditional)) {
      conditional = conditional.call(this);
    }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if (!options.hash.includeZero && !conditional || Utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function (conditional, options) {
    return instance.helpers['if'].call(this, conditional, { fn: options.inverse, inverse: options.fn, hash: options.hash });
  });

  instance.registerHelper('with', function (context, options) {
    if (isFunction(context)) {
      context = context.call(this);
    }

    var fn = options.fn;

    if (!Utils.isEmpty(context)) {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]);
        options = { data: data };
      }

      return fn(context, options);
    } else {
      return options.inverse(this);
    }
  });

  instance.registerHelper('log', function (message, options) {
    var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
    instance.log(level, message);
  });

  instance.registerHelper('lookup', function (obj, field) {
    return obj && obj[field];
  });
}

var logger = {
  methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

  // State enum
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  level: 1,

  // Can be overridden in the host environment
  log: function log(level, message) {
    if (typeof console !== 'undefined' && logger.level <= level) {
      var method = logger.methodMap[level];
      (console[method] || console.log).call(console, message); // eslint-disable-line no-console
    }
  }
};

exports.logger = logger;
var log = logger.log;

exports.log = log;

function createFrame(object) {
  var frame = Utils.extend({}, object);
  frame._parent = object;
  return frame;
}

/* [args, ]options */
},{"./exception":4,"./utils":8}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var loc = node && node.loc,
      line = undefined,
      column = undefined;
  if (loc) {
    line = loc.start.line;
    column = loc.start.column;

    message += ' - ' + line + ':' + column;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, Exception);
  }

  if (loc) {
    this.lineNumber = line;
    this.column = column;
  }
}

Exception.prototype = new Error();

exports['default'] = Exception;
module.exports = exports['default'];
},{}],5:[function(require,module,exports){
(function (global){
'use strict';

exports.__esModule = true;
/*global window */

exports['default'] = function (Handlebars) {
  /* istanbul ignore next */
  var root = typeof global !== 'undefined' ? global : window,
      $Handlebars = root.Handlebars;
  /* istanbul ignore next */
  Handlebars.noConflict = function () {
    if (root.Handlebars === Handlebars) {
      root.Handlebars = $Handlebars;
    }
  };
};

module.exports = exports['default'];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvbm8tY29uZmxpY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuLypnbG9iYWwgd2luZG93ICovXG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGZ1bmN0aW9uIChIYW5kbGViYXJzKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHZhciByb290ID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB3aW5kb3csXG4gICAgICAkSGFuZGxlYmFycyA9IHJvb3QuSGFuZGxlYmFycztcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgSGFuZGxlYmFycy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChyb290LkhhbmRsZWJhcnMgPT09IEhhbmRsZWJhcnMpIHtcbiAgICAgIHJvb3QuSGFuZGxlYmFycyA9ICRIYW5kbGViYXJzO1xuICAgIH1cbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyJdfQ==
},{}],6:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

exports.__esModule = true;
exports.checkRevision = checkRevision;

// TODO: Remove this line and break up compilePartial

exports.template = template;
exports.wrapProgram = wrapProgram;
exports.resolvePartial = resolvePartial;
exports.invokePartial = invokePartial;
exports.noop = noop;

var _import = require('./utils');

var Utils = _interopRequireWildcard(_import);

var _Exception = require('./exception');

var _Exception2 = _interopRequireWildcard(_Exception);

var _COMPILER_REVISION$REVISION_CHANGES$createFrame = require('./base');

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = _COMPILER_REVISION$REVISION_CHANGES$createFrame.COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = _COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[currentRevision],
          compilerVersions = _COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[compilerRevision];
      throw new _Exception2['default']('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new _Exception2['default']('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');
    }
  }
}

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new _Exception2['default']('No environment passed to template');
  }
  if (!templateSpec || !templateSpec.main) {
    throw new _Exception2['default']('Unknown template object: ' + typeof templateSpec);
  }

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  function invokePartialWrapper(partial, context, options) {
    if (options.hash) {
      context = Utils.extend({}, context, options.hash);
    }

    partial = env.VM.resolvePartial.call(this, partial, context, options);
    var result = env.VM.invokePartial.call(this, partial, context, options);

    if (result == null && env.compile) {
      options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
      result = options.partials[options.name](context, options);
    }
    if (result != null) {
      if (options.indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = options.indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new _Exception2['default']('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
    }
  }

  // Just add water
  var container = {
    strict: function strict(obj, name) {
      if (!(name in obj)) {
        throw new _Exception2['default']('"' + name + '" not defined in ' + obj);
      }
      return obj[name];
    },
    lookup: function lookup(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        if (depths[i] && depths[i][name] != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function lambda(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function fn(i) {
      return templateSpec[i];
    },

    programs: [],
    program: function program(i, data, declaredBlockParams, blockParams, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths || blockParams || declaredBlockParams) {
        programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = wrapProgram(this, i, fn);
      }
      return programWrapper;
    },

    data: function data(value, depth) {
      while (value && depth--) {
        value = value._parent;
      }
      return value;
    },
    merge: function merge(param, common) {
      var obj = param || common;

      if (param && common && param !== common) {
        obj = Utils.extend({}, common, param);
      }

      return obj;
    },

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  function ret(context) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths = undefined,
        blockParams = templateSpec.useBlockParams ? [] : undefined;
    if (templateSpec.useDepths) {
      depths = options.depths ? [context].concat(options.depths) : [context];
    }

    return templateSpec.main.call(container, context, container.helpers, container.partials, data, blockParams, depths);
  }
  ret.isTop = true;

  ret._setup = function (options) {
    if (!options.partial) {
      container.helpers = container.merge(options.helpers, env.helpers);

      if (templateSpec.usePartial) {
        container.partials = container.merge(options.partials, env.partials);
      }
    } else {
      container.helpers = options.helpers;
      container.partials = options.partials;
    }
  };

  ret._child = function (i, data, blockParams, depths) {
    if (templateSpec.useBlockParams && !blockParams) {
      throw new _Exception2['default']('must pass block params');
    }
    if (templateSpec.useDepths && !depths) {
      throw new _Exception2['default']('must pass parent depths');
    }

    return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
  };
  return ret;
}

function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
  function prog(context) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    return fn.call(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), depths && [context].concat(depths));
  }
  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  prog.blockParams = declaredBlockParams || 0;
  return prog;
}

function resolvePartial(partial, context, options) {
  if (!partial) {
    partial = options.partials[options.name];
  } else if (!partial.call && !options.name) {
    // This is a dynamic partial that returned a string
    options.name = partial;
    partial = options.partials[partial];
  }
  return partial;
}

function invokePartial(partial, context, options) {
  options.partial = true;

  if (partial === undefined) {
    throw new _Exception2['default']('The partial ' + options.name + ' could not be found');
  } else if (partial instanceof Function) {
    return partial(context, options);
  }
}

function noop() {
  return '';
}

function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? _COMPILER_REVISION$REVISION_CHANGES$createFrame.createFrame(data) : {};
    data.root = context;
  }
  return data;
}
},{"./base":3,"./exception":4,"./utils":8}],7:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
  return '' + this.string;
};

exports['default'] = SafeString;
module.exports = exports['default'];
},{}],8:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.extend = extend;

// Older IE versions do not directly support indexOf so we must implement our own, sadly.
exports.indexOf = indexOf;
exports.escapeExpression = escapeExpression;
exports.isEmpty = isEmpty;
exports.blockParams = blockParams;
exports.appendContextPath = appendContextPath;
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
  '`': '&#x60;'
};

var badChars = /[&<>"'`]/g,
    possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

var toString = Object.prototype.toString;

exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/*eslint-disable func-style, no-var */
var isFunction = function isFunction(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  exports.isFunction = isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
/*eslint-enable func-style, no-var */

/* istanbul ignore next */
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};exports.isArray = isArray;

function indexOf(array, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string == null) {
      return '';
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = '' + string;
  }

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

function blockParams(params, ids) {
  params.path = ids;
  return params;
}

function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}
},{}],9:[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = require('./dist/cjs/handlebars.runtime')['default'];

},{"./dist/cjs/handlebars.runtime":2}],10:[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":9}],11:[function(require,module,exports){
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

},{"./layout":18}],12:[function(require,module,exports){
module.exports = new Marionette.Application();

},{}],13:[function(require,module,exports){
module.exports = Backbone.Wreqr.radio.channel('menu');

},{}],14:[function(require,module,exports){
module.exports = Backbone.Wreqr.radio.channel('presenter');

},{}],15:[function(require,module,exports){
module.exports = {
  api: {
    url : 'http://localhost:3000/development/'
  },
  max_rows: 6,
  max_columns: 6,
  min_delay: 5000,
  max_delay: 15000
};

},{}],16:[function(require,module,exports){
var main      = require('./modules/main'),
    menu      = require('./modules/controllers/menu'),
    presenter     = require('./commons/channels/presenter'),
    routes = require('./modules/routes'),
    AppController;

AppController = Marionette.Object.extend({
  app: null,
  /**
   * Initialize application for controller
   * @param app Marionette.Application
   */
  initialize: function (app) {
    this.app = app;
    presenter.reqres.setHandler("layout", this.getAppLayout.bind(this));
  },
  /**
   * Gets the application Layout
   * @return Marionette.LayoutView
   */
  getAppLayout: function () {
    return this.app.layout;
  },
  /**
   * Start of application
   */
  start: function (app, router) {
    this.app = app;
    this.router = router;
    main.start(this.router);
  }
});

module.exports = AppController;

},{"./commons/channels/presenter":14,"./modules/controllers/menu":21,"./modules/main":23,"./modules/routes":24}],17:[function(require,module,exports){
var menuChannel = require('../commons/channels/menu'),
    appConfig = require('../config'),
    menuChannel = require('../commons/channels/menu'),
    MenuModel;

MenuModel = Backbone.Model.extend({
  defaults: {
    rows: 1,
    cols: 1
  },
  initialize: function () {
    menuChannel.commands.setHandler('change:size', this.changeTrendsSize.bind(this));
    menuChannel.reqres.setHandler('size', this.getSize.bind(this));
  },
  getSize: function () {
    return {
      cols: this.get('cols'),
      rows: this.get('rows')
    };
  },
  changeTrendsSize: function (size) {
    var cols = size ? size.cols : 0,
        rows = size ? size.rows : 0;
    //Control Min Values
    if (cols < 1) {
      cols = 1;
    }
    if (rows < 1) {
      rows = 1;
    }
    //Control Max Values
    if (cols > appConfig.max_columns) {
      cols = appConfig.grid.max_columns;
    }
    if (rows > appConfig.max_rows) {
      rows = appConfig.grid.max_rows;
    }

    this.set('rows', rows);
    this.set('cols', cols);

    menuChannel.vent.trigger('grid:changed', this.toJSON());
  }
});
module.exports = MenuModel;

},{"../commons/channels/menu":13,"../config":15}],18:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    return "<div id=\"menu\" class=\"menu-region-container\"></div>\n<div id=\"main\" class=\"main-region-container\"></div>\n";
},"useData":true});

},{"hbsfy/runtime":10}],19:[function(require,module,exports){
var mock = [],
    categories = [
      'arts',
      'entertainment',
      'geography',
      'history',
      'science',
      'sports'
    ];

for (var i = 0; i < 1000; i++) {
  mock.push({
    text: 'trend ' + i,
    category: categories[Math.floor(Math.random() * categories.length)],
    visible: false
  });
}

module.exports = mock;

},{}],20:[function(require,module,exports){
var Trends = Backbone.Collection.extend({
  pointer: 0,

  next: function() {
    if (++this.pointer >= this.length) {
      this.pointer = 0;
    }

    return this.at(this.pointer);
  },

  prev: function() {
    if (--this.pointer <= 0) {
      this.pointer = this.length - 1;
    }

    return this.at(this.pointer);
  }
});

module.exports = Trends;

},{}],21:[function(require,module,exports){
var MenuItemView = require('../views/Commons/itemViews/Menu'),
    menuChannel = require('../../commons/channels/menu'),
    layout = require('../../commons/channels/presenter'),
    MenuModel = require('../../entities/Menu'),
    Menu;

Menu = Marionette.Object.extend({
  start: function() {
    var presenter = layout.reqres.request('layout');
    this.model = new MenuModel();
    this.menuItemView = new MenuItemView({
      model: this.model
    });
    presenter.menu.show(this.menuItemView);
  }
});

module.exports = new Menu();

},{"../../commons/channels/menu":13,"../../commons/channels/presenter":14,"../../entities/Menu":17,"../views/Commons/itemViews/Menu":30}],22:[function(require,module,exports){
var mock = require('../../mock'),
    TrendsCollection = require('../collections/Trends'),
    menuChannel = require('../../commons/channels/menu'),
    layout = require('../../commons/channels/presenter'),
    CellsCollectionView = require('../views/Commons/collectionViews/Cells'),
    Trends;

Trends = Marionette.Controller.extend({
  start: function() {
    var presenter = layout.reqres.request('layout');

    menuChannel.reqres.setHandler('trends', this.getTrends.bind(this));

    this.cellsCollectionView = new CellsCollectionView({ collection: new Backbone.Collection() });

    presenter.main.show(this.cellsCollectionView);
    menuChannel.vent.on('grid:changed', this.onChangeGrid, this);
  },
  getTrends: function () {
    return new TrendsCollection(_.shuffle(mock));
  },

  onChangeGrid: function() {
    var cells = [],
    size = menu.reqres.request('size');

    for (var i = 0; i < size.cols; i++) {
      for (var j = 0; j < size.rows; j++) {
        cells.push({
          id: '' + i + '-' + j,
          size: {
            cols: size.cols,
            rows: size.rows
          }
        });
      }
    }
    this.cellsCollectionView.collection.set(cells);
  }
});

module.exports = new Trends();

},{"../../commons/channels/menu":13,"../../commons/channels/presenter":14,"../../mock":19,"../collections/Trends":20,"../views/Commons/collectionViews/Cells":28}],23:[function(require,module,exports){
var routesToControl = require('./routes'),
    Cells = require('./views/Commons/collectionViews/Cells'),
    mock = require('../mock'),
    Trends = require('./collections/Trends'),
    trendsCtlr = require('./controllers/trends'),
    menuCtlr = require('./controllers/menu'),
    appConfig = require('../config'),
    presenter = require('../commons/channels/presenter'),
    menu = require('../commons/channels/menu'),
    MainController;

MainController = Marionette.Object.extend({
  start: function(router) {
    trendsCtlr.start();
    menuCtlr.start();
    router.processAppRoutes(this, routesToControl);
  },
  initRoute: function() {
    Backbone.history.navigate('home', { trigger: true });
  },
  showTrends: function(cols, rows) {
    menu.commands.execute('change:size', { cols: cols, rows: rows});
  }
});

module.exports = new MainController();

},{"../commons/channels/menu":13,"../commons/channels/presenter":14,"../config":15,"../mock":19,"./collections/Trends":20,"./controllers/menu":21,"./controllers/trends":22,"./routes":24,"./views/Commons/collectionViews/Cells":28}],24:[function(require,module,exports){
var routes = {
  '': 'initRoute',
  'home(/:rows/:cols)': 'showTrends',
  '*action': 'initRoute'
};

module.exports = routes;

},{}],25:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    return "";
},"useData":true});

},{"hbsfy/runtime":10}],26:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
    var helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "              <a href=\"#home/"
    + alias3(((helper = (helper = helpers.j || (depth0 != null ? depth0.j : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"j","hash":{},"data":data}) : helper)))
    + "/"
    + alias3(((helper = (helper = helpers.i || (depth0 != null ? depth0.i : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"i","hash":{},"data":data}) : helper)))
    + "\" data-col=\""
    + alias3(((helper = (helper = helpers.j || (depth0 != null ? depth0.j : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"j","hash":{},"data":data}) : helper)))
    + "\" data-row=\""
    + alias3(((helper = (helper = helpers.i || (depth0 != null ? depth0.i : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"i","hash":{},"data":data}) : helper)))
    + "\" class=\"btn btn-default btn-xs cell\"></a>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"navbar-header\">\n  <button type=\"button\" class=\"navbar-toggle collapsed\" data-toggle=\"collapse\" data-target=\"#navbar-collapse\">\n    <span class=\"icon-bar\"></span>\n    <span class=\"icon-bar\"></span>\n    <span class=\"icon-bar\"></span>\n  </button>\n</div>\n<div class=\"collapse navbar-collapse\" id=\"navbar-collapse\">\n  <ul class=\"nav navbar-nav\">\n    <li class=\"active\">\n      <div class=\"btn btn-link navbar-btn btn-grid\"><span class=\"glyphicon glyphicon-th\"></span></div>\n      <div class=\"popover-content hidden\">\n        <div class=\"btn-group\">\n"
    + ((stack1 = helpers.each.call(depth0,(depth0 != null ? depth0.cells : depth0),{"name":"each","hash":{},"fn":this.program(1, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "      </div>\n    </li>\n  </ul>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":10}],27:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    return "<h1></h1>\n";
},"useData":true});

},{"hbsfy/runtime":10}],28:[function(require,module,exports){
var CellItemView = require('../itemViews/Cell'),
Cells;

Cells = Marionette.CollectionView.extend({
  childView: CellItemView,
  className: 'row'
});

module.exports = Cells;

},{"../itemViews/Cell":29}],29:[function(require,module,exports){
var TrendsCellItemView = require('../../Trends/itemViews/TrendsCell'),
    menuChannel = require('../../../../commons/channels/menu'),
    appConfig = require('../../../../config'),
    Cell;

Cell = Marionette.ItemView.extend({
  template: _.template(''),

  modelEvents: {
    'change size': 'onChangeSize'
  },

  onChangeSize: function() {
    var size = menuChannel.reqres.request('size');
    this.$el.removeClass();
    this.$el.addClass('cell cell-' + size.cols + '-' + size.rows);
  },

  onRender: function() {
    var trends = menuChannel.reqres.request('trends'),
        trendsCellItemView;

    trendsCellItemView = new TrendsCellItemView({ collection: trends });

    this.$el.html(trendsCellItemView.$el);
    this.onChangeSize();
  }
});

module.exports = Cell;

},{"../../../../commons/channels/menu":13,"../../../../config":15,"../../Trends/itemViews/TrendsCell":32}],30:[function(require,module,exports){
var appConfig = require('../../../../config'),
    menuChannel = require('../../../../commons/channels/menu'),
    menuTemplate = require('../../../templates/Commons/menu'),
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

},{"../../../../commons/channels/menu":13,"../../../../config":15,"../../../templates/Commons/menu":26}],31:[function(require,module,exports){
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

},{"../../../templates/Trends/trend":27}],32:[function(require,module,exports){
var TrendItemView = require('./Trend'),
appConfig = require('../../../../config'),
cellTemplate = require('../../../templates/Cells/cell'),
TrendsCell;

TrendsCell = Marionette.ItemView.extend({
  template: cellTemplate,
  className: 'trends-cell',

  startTimer: function() {
    this.start_time = null;
    this.end_time = _.random(appConfig.min_delay, appConfig.max_delay);
    requestAnimationFrame(this.tick.bind(this));
  },

  tick: function(timestamp) {
    if (!this.start_time) {
      this.start_time = timestamp;
    }

    var delta = timestamp - this.start_time;

    if (delta < this.end_time) {
      requestAnimationFrame(this.tick.bind(this));
    } else {
      this.switchTrend();
    }
  },

  switchTrend: function() {
    this.new_trend = this.createTrend();

    switch(_.random(3)) {
      case 0: // slide right
        this.slideRight();
        break;

      case 1: // slide left
        this.slideLeft();
        break;

      case 2: // slide up
        this.slideUp();
        break;

      case 3: // slide down
        this.slideDown();
        break;
    }

    this.$el.one('webkitTransitionEnd transitionend oTransitionEnd MSTransitionEnd', function() {
      this.updateTrendsCell();
    }.bind(this));
  },

  createTrend: function() {
    var trendModel = this.collection.next(),
        trendItemView = new TrendItemView({ model: trendModel });

    return trendItemView;
  },

  updateTrendsCell: function() {
    if (this.current_trend) {
      this.current_trend.destroy();
    }

    this.current_trend = this.new_trend;

    this.$el.removeClass('horizontal vertical slide right left up down');
    this.startTimer();
  },

  slideRight: function() {
    this.$el.prepend(this.new_trend.$el)
      .addClass('horizontal slide right');
  },

  slideLeft: function() {
    this.$el.append(this.new_trend.$el)
      .addClass('horizontal slide left');
  },

  slideUp: function() {
    this.$el.append(this.new_trend.$el)
      .addClass('vertical slide up');
  },

  slideDown: function() {
    this.$el.prepend(this.new_trend.$el)
      .addClass('vertical slide down');
  },

  initialize: function () {
    this.render();
  },
  onRender: function() {
    this.new_trend = this.createTrend();
    this.$el.append(this.new_trend.$el);
    this.updateTrendsCell();
  }
});

module.exports = TrendsCell;

},{"../../../../config":15,"../../../templates/Cells/cell":25,"./Trend":31}],33:[function(require,module,exports){
module.exports = Marionette.AppRouter.extend({});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZS5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvYmFzZS5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvZXhjZXB0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9uby1jb25mbGljdC5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvcnVudGltZS5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvc2FmZS1zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvcnVudGltZS5qcyIsIm5vZGVfbW9kdWxlcy9oYnNmeS9ydW50aW1lLmpzIiwic3JjL2pzL0xheW91dFZpZXcuanMiLCJzcmMvanMvYXBwLmpzIiwic3JjL2pzL2NvbW1vbnMvY2hhbm5lbHMvbWVudS5qcyIsInNyYy9qcy9jb21tb25zL2NoYW5uZWxzL3ByZXNlbnRlci5qcyIsInNyYy9qcy9jb25maWcuanMiLCJzcmMvanMvY29udHJvbGxlci5qcyIsInNyYy9qcy9lbnRpdGllcy9NZW51LmpzIiwic3JjL2pzL2xheW91dC5oYnMiLCJzcmMvanMvbW9jay5qcyIsInNyYy9qcy9tb2R1bGVzL2NvbGxlY3Rpb25zL1RyZW5kcy5qcyIsInNyYy9qcy9tb2R1bGVzL2NvbnRyb2xsZXJzL21lbnUuanMiLCJzcmMvanMvbW9kdWxlcy9jb250cm9sbGVycy90cmVuZHMuanMiLCJzcmMvanMvbW9kdWxlcy9tYWluLmpzIiwic3JjL2pzL21vZHVsZXMvcm91dGVzLmpzIiwic3JjL2pzL21vZHVsZXMvdGVtcGxhdGVzL0NlbGxzL2NlbGwuaGJzIiwic3JjL2pzL21vZHVsZXMvdGVtcGxhdGVzL0NvbW1vbnMvbWVudS5oYnMiLCJzcmMvanMvbW9kdWxlcy90ZW1wbGF0ZXMvVHJlbmRzL3RyZW5kLmhicyIsInNyYy9qcy9tb2R1bGVzL3ZpZXdzL0NvbW1vbnMvY29sbGVjdGlvblZpZXdzL0NlbGxzLmpzIiwic3JjL2pzL21vZHVsZXMvdmlld3MvQ29tbW9ucy9pdGVtVmlld3MvQ2VsbC5qcyIsInNyYy9qcy9tb2R1bGVzL3ZpZXdzL0NvbW1vbnMvaXRlbVZpZXdzL01lbnUuanMiLCJzcmMvanMvbW9kdWxlcy92aWV3cy9UcmVuZHMvaXRlbVZpZXdzL1RyZW5kLmpzIiwic3JjL2pzL21vZHVsZXMvdmlld3MvVHJlbmRzL2l0ZW1WaWV3cy9UcmVuZHNDZWxsLmpzIiwic3JjL2pzL3JvdXRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogTWFpbiBEZXBlbmRlbmNpZXNcbiAqL1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyksXG4gIEFwcExheW91dCA9IHJlcXVpcmUoJy4vTGF5b3V0VmlldycpLFxuICBBcHBSb3V0ZXIgPSByZXF1aXJlKCcuL3JvdXRlcicpLFxuICBBcHAgPSByZXF1aXJlKCcuL2FwcCcpLFxuICBBcHBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9jb250cm9sbGVyJyksXG4gIHJvdXRlcixcbiAgYXBpLFxuICBhcHBDb250cm9sbGVyO1xuXG4vKipcbiAqIEFwcGxpY2F0aW9uIHN0YXJ0cyBieSBhc3NpZ25pbmcgYW4gYXBwIGNvbnRyb2xsZXIgdG8gdGhlIHJvdXRlclxuICogYW5kIHRoZSByb3V0ZXIgdG8gdGhlIGFwcGxpY2F0aW9uLlxuICogVGhlbiBzdGFydCBjb250cm9sbGVyIGFuZCByb3V0aW5nLlxuICovXG5BcHAub24oJ3N0YXJ0JywgZnVuY3Rpb24oKSB7XG4gIGFwcENvbnRyb2xsZXIgPSBuZXcgQXBwQ29udHJvbGxlcih0aGlzKTtcbiAgcm91dGVyID0gbmV3IEFwcFJvdXRlcigpO1xuXG4gIEFwcC5sYXlvdXQgPSBuZXcgQXBwTGF5b3V0KCk7XG5cbiAgQXBwLmxheW91dC5yZW5kZXIoKTtcbiAgYXBwQ29udHJvbGxlci5zdGFydCh0aGlzLCByb3V0ZXIpO1xuICBCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KCk7XG59KTtcblxuQXBwLnN0YXJ0KCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9pbXBvcnQgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvYmFzZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQpO1xuXG4vLyBFYWNoIG9mIHRoZXNlIGF1Z21lbnQgdGhlIEhhbmRsZWJhcnMgb2JqZWN0LiBObyBuZWVkIHRvIHNldHVwIGhlcmUuXG4vLyAoVGhpcyBpcyBkb25lIHRvIGVhc2lseSBzaGFyZSBjb2RlIGJldHdlZW4gY29tbW9uanMgYW5kIGJyb3dzZSBlbnZzKVxuXG52YXIgX1NhZmVTdHJpbmcgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvc2FmZS1zdHJpbmcnKTtcblxudmFyIF9TYWZlU3RyaW5nMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9TYWZlU3RyaW5nKTtcblxudmFyIF9FeGNlcHRpb24gPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvZXhjZXB0aW9uJyk7XG5cbnZhciBfRXhjZXB0aW9uMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9FeGNlcHRpb24pO1xuXG52YXIgX2ltcG9ydDIgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvdXRpbHMnKTtcblxudmFyIFV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydDIpO1xuXG52YXIgX2ltcG9ydDMgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvcnVudGltZScpO1xuXG52YXIgcnVudGltZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQzKTtcblxudmFyIF9ub0NvbmZsaWN0ID0gcmVxdWlyZSgnLi9oYW5kbGViYXJzL25vLWNvbmZsaWN0Jyk7XG5cbnZhciBfbm9Db25mbGljdDIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfbm9Db25mbGljdCk7XG5cbi8vIEZvciBjb21wYXRpYmlsaXR5IGFuZCB1c2FnZSBvdXRzaWRlIG9mIG1vZHVsZSBzeXN0ZW1zLCBtYWtlIHRoZSBIYW5kbGViYXJzIG9iamVjdCBhIG5hbWVzcGFjZVxuZnVuY3Rpb24gY3JlYXRlKCkge1xuICB2YXIgaGIgPSBuZXcgYmFzZS5IYW5kbGViYXJzRW52aXJvbm1lbnQoKTtcblxuICBVdGlscy5leHRlbmQoaGIsIGJhc2UpO1xuICBoYi5TYWZlU3RyaW5nID0gX1NhZmVTdHJpbmcyWydkZWZhdWx0J107XG4gIGhiLkV4Y2VwdGlvbiA9IF9FeGNlcHRpb24yWydkZWZhdWx0J107XG4gIGhiLlV0aWxzID0gVXRpbHM7XG4gIGhiLmVzY2FwZUV4cHJlc3Npb24gPSBVdGlscy5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIGhiLlZNID0gcnVudGltZTtcbiAgaGIudGVtcGxhdGUgPSBmdW5jdGlvbiAoc3BlYykge1xuICAgIHJldHVybiBydW50aW1lLnRlbXBsYXRlKHNwZWMsIGhiKTtcbiAgfTtcblxuICByZXR1cm4gaGI7XG59XG5cbnZhciBpbnN0ID0gY3JlYXRlKCk7XG5pbnN0LmNyZWF0ZSA9IGNyZWF0ZTtcblxuX25vQ29uZmxpY3QyWydkZWZhdWx0J10oaW5zdCk7XG5cbmluc3RbJ2RlZmF1bHQnXSA9IGluc3Q7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGluc3Q7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHMuSGFuZGxlYmFyc0Vudmlyb25tZW50ID0gSGFuZGxlYmFyc0Vudmlyb25tZW50O1xuZXhwb3J0cy5jcmVhdGVGcmFtZSA9IGNyZWF0ZUZyYW1lO1xuXG52YXIgX2ltcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIFV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydCk7XG5cbnZhciBfRXhjZXB0aW9uID0gcmVxdWlyZSgnLi9leGNlcHRpb24nKTtcblxudmFyIF9FeGNlcHRpb24yID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX0V4Y2VwdGlvbik7XG5cbnZhciBWRVJTSU9OID0gJzMuMC4xJztcbmV4cG9ydHMuVkVSU0lPTiA9IFZFUlNJT047XG52YXIgQ09NUElMRVJfUkVWSVNJT04gPSA2O1xuXG5leHBvcnRzLkNPTVBJTEVSX1JFVklTSU9OID0gQ09NUElMRVJfUkVWSVNJT047XG52YXIgUkVWSVNJT05fQ0hBTkdFUyA9IHtcbiAgMTogJzw9IDEuMC5yYy4yJywgLy8gMS4wLnJjLjIgaXMgYWN0dWFsbHkgcmV2MiBidXQgZG9lc24ndCByZXBvcnQgaXRcbiAgMjogJz09IDEuMC4wLXJjLjMnLFxuICAzOiAnPT0gMS4wLjAtcmMuNCcsXG4gIDQ6ICc9PSAxLngueCcsXG4gIDU6ICc9PSAyLjAuMC1hbHBoYS54JyxcbiAgNjogJz49IDIuMC4wLWJldGEuMSdcbn07XG5cbmV4cG9ydHMuUkVWSVNJT05fQ0hBTkdFUyA9IFJFVklTSU9OX0NIQU5HRVM7XG52YXIgaXNBcnJheSA9IFV0aWxzLmlzQXJyYXksXG4gICAgaXNGdW5jdGlvbiA9IFV0aWxzLmlzRnVuY3Rpb24sXG4gICAgdG9TdHJpbmcgPSBVdGlscy50b1N0cmluZyxcbiAgICBvYmplY3RUeXBlID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbmZ1bmN0aW9uIEhhbmRsZWJhcnNFbnZpcm9ubWVudChoZWxwZXJzLCBwYXJ0aWFscykge1xuICB0aGlzLmhlbHBlcnMgPSBoZWxwZXJzIHx8IHt9O1xuICB0aGlzLnBhcnRpYWxzID0gcGFydGlhbHMgfHwge307XG5cbiAgcmVnaXN0ZXJEZWZhdWx0SGVscGVycyh0aGlzKTtcbn1cblxuSGFuZGxlYmFyc0Vudmlyb25tZW50LnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IEhhbmRsZWJhcnNFbnZpcm9ubWVudCxcblxuICBsb2dnZXI6IGxvZ2dlcixcbiAgbG9nOiBsb2csXG5cbiAgcmVnaXN0ZXJIZWxwZXI6IGZ1bmN0aW9uIHJlZ2lzdGVySGVscGVyKG5hbWUsIGZuKSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwobmFtZSkgPT09IG9iamVjdFR5cGUpIHtcbiAgICAgIGlmIChmbikge1xuICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnQXJnIG5vdCBzdXBwb3J0ZWQgd2l0aCBtdWx0aXBsZSBoZWxwZXJzJyk7XG4gICAgICB9XG4gICAgICBVdGlscy5leHRlbmQodGhpcy5oZWxwZXJzLCBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oZWxwZXJzW25hbWVdID0gZm47XG4gICAgfVxuICB9LFxuICB1bnJlZ2lzdGVySGVscGVyOiBmdW5jdGlvbiB1bnJlZ2lzdGVySGVscGVyKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5oZWxwZXJzW25hbWVdO1xuICB9LFxuXG4gIHJlZ2lzdGVyUGFydGlhbDogZnVuY3Rpb24gcmVnaXN0ZXJQYXJ0aWFsKG5hbWUsIHBhcnRpYWwpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMucGFydGlhbHMsIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodHlwZW9mIHBhcnRpYWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdBdHRlbXB0aW5nIHRvIHJlZ2lzdGVyIGEgcGFydGlhbCBhcyB1bmRlZmluZWQnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGFydGlhbHNbbmFtZV0gPSBwYXJ0aWFsO1xuICAgIH1cbiAgfSxcbiAgdW5yZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uIHVucmVnaXN0ZXJQYXJ0aWFsKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5wYXJ0aWFsc1tuYW1lXTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcmVnaXN0ZXJEZWZhdWx0SGVscGVycyhpbnN0YW5jZSkge1xuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaGVscGVyTWlzc2luZycsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gQSBtaXNzaW5nIGZpZWxkIGluIGEge3tmb299fSBjb25zdHVjdC5cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNvbWVvbmUgaXMgYWN0dWFsbHkgdHJ5aW5nIHRvIGNhbGwgc29tZXRoaW5nLCBibG93IHVwLlxuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ01pc3NpbmcgaGVscGVyOiBcIicgKyBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdLm5hbWUgKyAnXCInKTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdibG9ja0hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBpbnZlcnNlID0gb3B0aW9ucy5pbnZlcnNlLFxuICAgICAgICBmbiA9IG9wdGlvbnMuZm47XG5cbiAgICBpZiAoY29udGV4dCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGZuKHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gZmFsc2UgfHwgY29udGV4dCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcbiAgICAgIGlmIChjb250ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaWRzKSB7XG4gICAgICAgICAgb3B0aW9ucy5pZHMgPSBbb3B0aW9ucy5uYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzLmVhY2goY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmlkcykge1xuICAgICAgICB2YXIgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMubmFtZSk7XG4gICAgICAgIG9wdGlvbnMgPSB7IGRhdGE6IGRhdGEgfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZuKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ011c3QgcGFzcyBpdGVyYXRvciB0byAjZWFjaCcpO1xuICAgIH1cblxuICAgIHZhciBmbiA9IG9wdGlvbnMuZm4sXG4gICAgICAgIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICByZXQgPSAnJyxcbiAgICAgICAgZGF0YSA9IHVuZGVmaW5lZCxcbiAgICAgICAgY29udGV4dFBhdGggPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG4gICAgICBjb250ZXh0UGF0aCA9IFV0aWxzLmFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5pZHNbMF0pICsgJy4nO1xuICAgIH1cblxuICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7XG4gICAgICBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmRhdGEpIHtcbiAgICAgIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4ZWNJdGVyYXRpb24oZmllbGQsIGluZGV4LCBsYXN0KSB7XG4gICAgICBpZiAoZGF0YSkge1xuICAgICAgICBkYXRhLmtleSA9IGZpZWxkO1xuICAgICAgICBkYXRhLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIGRhdGEuZmlyc3QgPSBpbmRleCA9PT0gMDtcbiAgICAgICAgZGF0YS5sYXN0ID0gISFsYXN0O1xuXG4gICAgICAgIGlmIChjb250ZXh0UGF0aCkge1xuICAgICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBjb250ZXh0UGF0aCArIGZpZWxkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldCA9IHJldCArIGZuKGNvbnRleHRbZmllbGRdLCB7XG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIGJsb2NrUGFyYW1zOiBVdGlscy5ibG9ja1BhcmFtcyhbY29udGV4dFtmaWVsZF0sIGZpZWxkXSwgW2NvbnRleHRQYXRoICsgZmllbGQsIG51bGxdKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQgJiYgdHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgICBmb3IgKHZhciBqID0gY29udGV4dC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICBleGVjSXRlcmF0aW9uKGksIGksIGkgPT09IGNvbnRleHQubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwcmlvcktleSA9IHVuZGVmaW5lZDtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY29udGV4dCkge1xuICAgICAgICAgIGlmIChjb250ZXh0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIC8vIFdlJ3JlIHJ1bm5pbmcgdGhlIGl0ZXJhdGlvbnMgb25lIHN0ZXAgb3V0IG9mIHN5bmMgc28gd2UgY2FuIGRldGVjdFxuICAgICAgICAgICAgLy8gdGhlIGxhc3QgaXRlcmF0aW9uIHdpdGhvdXQgaGF2ZSB0byBzY2FuIHRoZSBvYmplY3QgdHdpY2UgYW5kIGNyZWF0ZVxuICAgICAgICAgICAgLy8gYW4gaXRlcm1lZGlhdGUga2V5cyBhcnJheS5cbiAgICAgICAgICAgIGlmIChwcmlvcktleSkge1xuICAgICAgICAgICAgICBleGVjSXRlcmF0aW9uKHByaW9yS2V5LCBpIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmlvcktleSA9IGtleTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByaW9yS2V5KSB7XG4gICAgICAgICAgZXhlY0l0ZXJhdGlvbihwcmlvcktleSwgaSAtIDEsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGkgPT09IDApIHtcbiAgICAgIHJldCA9IGludmVyc2UodGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2lmJywgZnVuY3Rpb24gKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY29uZGl0aW9uYWwpKSB7XG4gICAgICBjb25kaXRpb25hbCA9IGNvbmRpdGlvbmFsLmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCBiZWhhdmlvciBpcyB0byByZW5kZXIgdGhlIHBvc2l0aXZlIHBhdGggaWYgdGhlIHZhbHVlIGlzIHRydXRoeSBhbmQgbm90IGVtcHR5LlxuICAgIC8vIFRoZSBgaW5jbHVkZVplcm9gIG9wdGlvbiBtYXkgYmUgc2V0IHRvIHRyZWF0IHRoZSBjb25kdGlvbmFsIGFzIHB1cmVseSBub3QgZW1wdHkgYmFzZWQgb24gdGhlXG4gICAgLy8gYmVoYXZpb3Igb2YgaXNFbXB0eS4gRWZmZWN0aXZlbHkgdGhpcyBkZXRlcm1pbmVzIGlmIDAgaXMgaGFuZGxlZCBieSB0aGUgcG9zaXRpdmUgcGF0aCBvciBuZWdhdGl2ZS5cbiAgICBpZiAoIW9wdGlvbnMuaGFzaC5pbmNsdWRlWmVybyAmJiAhY29uZGl0aW9uYWwgfHwgVXRpbHMuaXNFbXB0eShjb25kaXRpb25hbCkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIGZ1bmN0aW9uIChjb25kaXRpb25hbCwgb3B0aW9ucykge1xuICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzWydpZiddLmNhbGwodGhpcywgY29uZGl0aW9uYWwsIHsgZm46IG9wdGlvbnMuaW52ZXJzZSwgaW52ZXJzZTogb3B0aW9ucy5mbiwgaGFzaDogb3B0aW9ucy5oYXNoIH0pO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignd2l0aCcsIGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHtcbiAgICAgIGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgdmFyIGZuID0gb3B0aW9ucy5mbjtcblxuICAgIGlmICghVXRpbHMuaXNFbXB0eShjb250ZXh0KSkge1xuICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmlkcykge1xuICAgICAgICB2YXIgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMuaWRzWzBdKTtcbiAgICAgICAgb3B0aW9ucyA9IHsgZGF0YTogZGF0YSB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZm4oY29udGV4dCwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfVxuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9nJywgZnVuY3Rpb24gKG1lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgICB2YXIgbGV2ZWwgPSBvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5kYXRhLmxldmVsICE9IG51bGwgPyBwYXJzZUludChvcHRpb25zLmRhdGEubGV2ZWwsIDEwKSA6IDE7XG4gICAgaW5zdGFuY2UubG9nKGxldmVsLCBtZXNzYWdlKTtcbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2xvb2t1cCcsIGZ1bmN0aW9uIChvYmosIGZpZWxkKSB7XG4gICAgcmV0dXJuIG9iaiAmJiBvYmpbZmllbGRdO1xuICB9KTtcbn1cblxudmFyIGxvZ2dlciA9IHtcbiAgbWV0aG9kTWFwOiB7IDA6ICdkZWJ1ZycsIDE6ICdpbmZvJywgMjogJ3dhcm4nLCAzOiAnZXJyb3InIH0sXG5cbiAgLy8gU3RhdGUgZW51bVxuICBERUJVRzogMCxcbiAgSU5GTzogMSxcbiAgV0FSTjogMixcbiAgRVJST1I6IDMsXG4gIGxldmVsOiAxLFxuXG4gIC8vIENhbiBiZSBvdmVycmlkZGVuIGluIHRoZSBob3N0IGVudmlyb25tZW50XG4gIGxvZzogZnVuY3Rpb24gbG9nKGxldmVsLCBtZXNzYWdlKSB7XG4gICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBsb2dnZXIubGV2ZWwgPD0gbGV2ZWwpIHtcbiAgICAgIHZhciBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcbiAgICAgIChjb25zb2xlW21ldGhvZF0gfHwgY29uc29sZS5sb2cpLmNhbGwoY29uc29sZSwgbWVzc2FnZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0cy5sb2dnZXIgPSBsb2dnZXI7XG52YXIgbG9nID0gbG9nZ2VyLmxvZztcblxuZXhwb3J0cy5sb2cgPSBsb2c7XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyYW1lKG9iamVjdCkge1xuICB2YXIgZnJhbWUgPSBVdGlscy5leHRlbmQoe30sIG9iamVjdCk7XG4gIGZyYW1lLl9wYXJlbnQgPSBvYmplY3Q7XG4gIHJldHVybiBmcmFtZTtcbn1cblxuLyogW2FyZ3MsIF1vcHRpb25zICovIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cbmZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlLCBub2RlKSB7XG4gIHZhciBsb2MgPSBub2RlICYmIG5vZGUubG9jLFxuICAgICAgbGluZSA9IHVuZGVmaW5lZCxcbiAgICAgIGNvbHVtbiA9IHVuZGVmaW5lZDtcbiAgaWYgKGxvYykge1xuICAgIGxpbmUgPSBsb2Muc3RhcnQubGluZTtcbiAgICBjb2x1bW4gPSBsb2Muc3RhcnQuY29sdW1uO1xuXG4gICAgbWVzc2FnZSArPSAnIC0gJyArIGxpbmUgKyAnOicgKyBjb2x1bW47XG4gIH1cblxuICB2YXIgdG1wID0gRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgLy8gVW5mb3J0dW5hdGVseSBlcnJvcnMgYXJlIG5vdCBlbnVtZXJhYmxlIGluIENocm9tZSAoYXQgbGVhc3QpLCBzbyBgZm9yIHByb3AgaW4gdG1wYCBkb2Vzbid0IHdvcmsuXG4gIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGVycm9yUHJvcHMubGVuZ3RoOyBpZHgrKykge1xuICAgIHRoaXNbZXJyb3JQcm9wc1tpZHhdXSA9IHRtcFtlcnJvclByb3BzW2lkeF1dO1xuICB9XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgRXhjZXB0aW9uKTtcbiAgfVxuXG4gIGlmIChsb2MpIHtcbiAgICB0aGlzLmxpbmVOdW1iZXIgPSBsaW5lO1xuICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICB9XG59XG5cbkV4Y2VwdGlvbi5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gRXhjZXB0aW9uO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuLypnbG9iYWwgd2luZG93ICovXG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGZ1bmN0aW9uIChIYW5kbGViYXJzKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHZhciByb290ID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB3aW5kb3csXG4gICAgICAkSGFuZGxlYmFycyA9IHJvb3QuSGFuZGxlYmFycztcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgSGFuZGxlYmFycy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChyb290LkhhbmRsZWJhcnMgPT09IEhhbmRsZWJhcnMpIHtcbiAgICAgIHJvb3QuSGFuZGxlYmFycyA9ICRIYW5kbGViYXJzO1xuICAgIH1cbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbTV2WkdWZmJXOWtkV3hsY3k5b1lXNWtiR1ZpWVhKekwyUnBjM1F2WTJwekwyaGhibVJzWldKaGNuTXZibTh0WTI5dVpteHBZM1F1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVNJc0ltWnBiR1VpT2lKblpXNWxjbUYwWldRdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lKM1Z6WlNCemRISnBZM1FuTzF4dVhHNWxlSEJ2Y25SekxsOWZaWE5OYjJSMWJHVWdQU0IwY25WbE8xeHVMeXBuYkc5aVlXd2dkMmx1Wkc5M0lDb3ZYRzVjYm1WNGNHOXlkSE5iSjJSbFptRjFiSFFuWFNBOUlHWjFibU4wYVc5dUlDaElZVzVrYkdWaVlYSnpLU0I3WEc0Z0lDOHFJR2x6ZEdGdVluVnNJR2xuYm05eVpTQnVaWGgwSUNvdlhHNGdJSFpoY2lCeWIyOTBJRDBnZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnSjNWdVpHVm1hVzVsWkNjZ1B5Qm5iRzlpWVd3Z09pQjNhVzVrYjNjc1hHNGdJQ0FnSUNBa1NHRnVaR3hsWW1GeWN5QTlJSEp2YjNRdVNHRnVaR3hsWW1GeWN6dGNiaUFnTHlvZ2FYTjBZVzVpZFd3Z2FXZHViM0psSUc1bGVIUWdLaTljYmlBZ1NHRnVaR3hsWW1GeWN5NXViME52Ym1ac2FXTjBJRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUdsbUlDaHliMjkwTGtoaGJtUnNaV0poY25NZ1BUMDlJRWhoYm1Sc1pXSmhjbk1wSUh0Y2JpQWdJQ0FnSUhKdmIzUXVTR0Z1Wkd4bFltRnljeUE5SUNSSVlXNWtiR1ZpWVhKek8xeHVJQ0FnSUgxY2JpQWdmVHRjYm4wN1hHNWNibTF2WkhWc1pTNWxlSEJ2Y25SeklEMGdaWGh3YjNKMGMxc25aR1ZtWVhWc2RDZGRPeUpkZlE9PSIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5jaGVja1JldmlzaW9uID0gY2hlY2tSZXZpc2lvbjtcblxuLy8gVE9ETzogUmVtb3ZlIHRoaXMgbGluZSBhbmQgYnJlYWsgdXAgY29tcGlsZVBhcnRpYWxcblxuZXhwb3J0cy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuZXhwb3J0cy53cmFwUHJvZ3JhbSA9IHdyYXBQcm9ncmFtO1xuZXhwb3J0cy5yZXNvbHZlUGFydGlhbCA9IHJlc29sdmVQYXJ0aWFsO1xuZXhwb3J0cy5pbnZva2VQYXJ0aWFsID0gaW52b2tlUGFydGlhbDtcbmV4cG9ydHMubm9vcCA9IG5vb3A7XG5cbnZhciBfaW1wb3J0ID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0KTtcblxudmFyIF9FeGNlcHRpb24gPSByZXF1aXJlKCcuL2V4Y2VwdGlvbicpO1xuXG52YXIgX0V4Y2VwdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfRXhjZXB0aW9uKTtcblxudmFyIF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lID0gcmVxdWlyZSgnLi9iYXNlJyk7XG5cbmZ1bmN0aW9uIGNoZWNrUmV2aXNpb24oY29tcGlsZXJJbmZvKSB7XG4gIHZhciBjb21waWxlclJldmlzaW9uID0gY29tcGlsZXJJbmZvICYmIGNvbXBpbGVySW5mb1swXSB8fCAxLFxuICAgICAgY3VycmVudFJldmlzaW9uID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuQ09NUElMRVJfUkVWSVNJT047XG5cbiAgaWYgKGNvbXBpbGVyUmV2aXNpb24gIT09IGN1cnJlbnRSZXZpc2lvbikge1xuICAgIGlmIChjb21waWxlclJldmlzaW9uIDwgY3VycmVudFJldmlzaW9uKSB7XG4gICAgICB2YXIgcnVudGltZVZlcnNpb25zID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuUkVWSVNJT05fQ0hBTkdFU1tjdXJyZW50UmV2aXNpb25dLFxuICAgICAgICAgIGNvbXBpbGVyVmVyc2lvbnMgPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5SRVZJU0lPTl9DSEFOR0VTW2NvbXBpbGVyUmV2aXNpb25dO1xuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RlbXBsYXRlIHdhcyBwcmVjb21waWxlZCB3aXRoIGFuIG9sZGVyIHZlcnNpb24gb2YgSGFuZGxlYmFycyB0aGFuIHRoZSBjdXJyZW50IHJ1bnRpbWUuICcgKyAnUGxlYXNlIHVwZGF0ZSB5b3VyIHByZWNvbXBpbGVyIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIHJ1bnRpbWVWZXJzaW9ucyArICcpIG9yIGRvd25ncmFkZSB5b3VyIHJ1bnRpbWUgdG8gYW4gb2xkZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVyVmVyc2lvbnMgKyAnKS4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVXNlIHRoZSBlbWJlZGRlZCB2ZXJzaW9uIGluZm8gc2luY2UgdGhlIHJ1bnRpbWUgZG9lc24ndCBrbm93IGFib3V0IHRoaXMgcmV2aXNpb24geWV0XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYSBuZXdlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiAnICsgJ1BsZWFzZSB1cGRhdGUgeW91ciBydW50aW1lIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVySW5mb1sxXSArICcpLicpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZSh0ZW1wbGF0ZVNwZWMsIGVudikge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAoIWVudikge1xuICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdObyBlbnZpcm9ubWVudCBwYXNzZWQgdG8gdGVtcGxhdGUnKTtcbiAgfVxuICBpZiAoIXRlbXBsYXRlU3BlYyB8fCAhdGVtcGxhdGVTcGVjLm1haW4pIHtcbiAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVW5rbm93biB0ZW1wbGF0ZSBvYmplY3Q6ICcgKyB0eXBlb2YgdGVtcGxhdGVTcGVjKTtcbiAgfVxuXG4gIC8vIE5vdGU6IFVzaW5nIGVudi5WTSByZWZlcmVuY2VzIHJhdGhlciB0aGFuIGxvY2FsIHZhciByZWZlcmVuY2VzIHRocm91Z2hvdXQgdGhpcyBzZWN0aW9uIHRvIGFsbG93XG4gIC8vIGZvciBleHRlcm5hbCB1c2VycyB0byBvdmVycmlkZSB0aGVzZSBhcyBwc3VlZG8tc3VwcG9ydGVkIEFQSXMuXG4gIGVudi5WTS5jaGVja1JldmlzaW9uKHRlbXBsYXRlU3BlYy5jb21waWxlcik7XG5cbiAgZnVuY3Rpb24gaW52b2tlUGFydGlhbFdyYXBwZXIocGFydGlhbCwgY29udGV4dCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmhhc2gpIHtcbiAgICAgIGNvbnRleHQgPSBVdGlscy5leHRlbmQoe30sIGNvbnRleHQsIG9wdGlvbnMuaGFzaCk7XG4gICAgfVxuXG4gICAgcGFydGlhbCA9IGVudi5WTS5yZXNvbHZlUGFydGlhbC5jYWxsKHRoaXMsIHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIHZhciByZXN1bHQgPSBlbnYuVk0uaW52b2tlUGFydGlhbC5jYWxsKHRoaXMsIHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpO1xuXG4gICAgaWYgKHJlc3VsdCA9PSBudWxsICYmIGVudi5jb21waWxlKSB7XG4gICAgICBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV0gPSBlbnYuY29tcGlsZShwYXJ0aWFsLCB0ZW1wbGF0ZVNwZWMuY29tcGlsZXJPcHRpb25zLCBlbnYpO1xuICAgICAgcmVzdWx0ID0gb3B0aW9ucy5wYXJ0aWFsc1tvcHRpb25zLm5hbWVdKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0ICE9IG51bGwpIHtcbiAgICAgIGlmIChvcHRpb25zLmluZGVudCkge1xuICAgICAgICB2YXIgbGluZXMgPSByZXN1bHQuc3BsaXQoJ1xcbicpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpbmVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGlmICghbGluZXNbaV0gJiYgaSArIDEgPT09IGwpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpbmVzW2ldID0gb3B0aW9ucy5pbmRlbnQgKyBsaW5lc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBsaW5lcy5qb2luKCdcXG4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUaGUgcGFydGlhbCAnICsgb3B0aW9ucy5uYW1lICsgJyBjb3VsZCBub3QgYmUgY29tcGlsZWQgd2hlbiBydW5uaW5nIGluIHJ1bnRpbWUtb25seSBtb2RlJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gSnVzdCBhZGQgd2F0ZXJcbiAgdmFyIGNvbnRhaW5lciA9IHtcbiAgICBzdHJpY3Q6IGZ1bmN0aW9uIHN0cmljdChvYmosIG5hbWUpIHtcbiAgICAgIGlmICghKG5hbWUgaW4gb2JqKSkge1xuICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnXCInICsgbmFtZSArICdcIiBub3QgZGVmaW5lZCBpbiAnICsgb2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmpbbmFtZV07XG4gICAgfSxcbiAgICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChkZXB0aHMsIG5hbWUpIHtcbiAgICAgIHZhciBsZW4gPSBkZXB0aHMubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoZGVwdGhzW2ldICYmIGRlcHRoc1tpXVtuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGRlcHRoc1tpXVtuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgbGFtYmRhOiBmdW5jdGlvbiBsYW1iZGEoY3VycmVudCwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiBjdXJyZW50ID09PSAnZnVuY3Rpb24nID8gY3VycmVudC5jYWxsKGNvbnRleHQpIDogY3VycmVudDtcbiAgICB9LFxuXG4gICAgZXNjYXBlRXhwcmVzc2lvbjogVXRpbHMuZXNjYXBlRXhwcmVzc2lvbixcbiAgICBpbnZva2VQYXJ0aWFsOiBpbnZva2VQYXJ0aWFsV3JhcHBlcixcblxuICAgIGZuOiBmdW5jdGlvbiBmbihpKSB7XG4gICAgICByZXR1cm4gdGVtcGxhdGVTcGVjW2ldO1xuICAgIH0sXG5cbiAgICBwcm9ncmFtczogW10sXG4gICAgcHJvZ3JhbTogZnVuY3Rpb24gcHJvZ3JhbShpLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG4gICAgICB2YXIgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldLFxuICAgICAgICAgIGZuID0gdGhpcy5mbihpKTtcbiAgICAgIGlmIChkYXRhIHx8IGRlcHRocyB8fCBibG9ja1BhcmFtcyB8fCBkZWNsYXJlZEJsb2NrUGFyYW1zKSB7XG4gICAgICAgIHByb2dyYW1XcmFwcGVyID0gd3JhcFByb2dyYW0odGhpcywgaSwgZm4sIGRhdGEsIGRlY2xhcmVkQmxvY2tQYXJhbXMsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuICAgICAgfSBlbHNlIGlmICghcHJvZ3JhbVdyYXBwZXIpIHtcbiAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldID0gd3JhcFByb2dyYW0odGhpcywgaSwgZm4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb2dyYW1XcmFwcGVyO1xuICAgIH0sXG5cbiAgICBkYXRhOiBmdW5jdGlvbiBkYXRhKHZhbHVlLCBkZXB0aCkge1xuICAgICAgd2hpbGUgKHZhbHVlICYmIGRlcHRoLS0pIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5fcGFyZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgbWVyZ2U6IGZ1bmN0aW9uIG1lcmdlKHBhcmFtLCBjb21tb24pIHtcbiAgICAgIHZhciBvYmogPSBwYXJhbSB8fCBjb21tb247XG5cbiAgICAgIGlmIChwYXJhbSAmJiBjb21tb24gJiYgcGFyYW0gIT09IGNvbW1vbikge1xuICAgICAgICBvYmogPSBVdGlscy5leHRlbmQoe30sIGNvbW1vbiwgcGFyYW0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICBub29wOiBlbnYuVk0ubm9vcCxcbiAgICBjb21waWxlckluZm86IHRlbXBsYXRlU3BlYy5jb21waWxlclxuICB9O1xuXG4gIGZ1bmN0aW9uIHJldChjb250ZXh0KSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG4gICAgdmFyIGRhdGEgPSBvcHRpb25zLmRhdGE7XG5cbiAgICByZXQuX3NldHVwKG9wdGlvbnMpO1xuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsICYmIHRlbXBsYXRlU3BlYy51c2VEYXRhKSB7XG4gICAgICBkYXRhID0gaW5pdERhdGEoY29udGV4dCwgZGF0YSk7XG4gICAgfVxuICAgIHZhciBkZXB0aHMgPSB1bmRlZmluZWQsXG4gICAgICAgIGJsb2NrUGFyYW1zID0gdGVtcGxhdGVTcGVjLnVzZUJsb2NrUGFyYW1zID8gW10gOiB1bmRlZmluZWQ7XG4gICAgaWYgKHRlbXBsYXRlU3BlYy51c2VEZXB0aHMpIHtcbiAgICAgIGRlcHRocyA9IG9wdGlvbnMuZGVwdGhzID8gW2NvbnRleHRdLmNvbmNhdChvcHRpb25zLmRlcHRocykgOiBbY29udGV4dF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHRlbXBsYXRlU3BlYy5tYWluLmNhbGwoY29udGFpbmVyLCBjb250ZXh0LCBjb250YWluZXIuaGVscGVycywgY29udGFpbmVyLnBhcnRpYWxzLCBkYXRhLCBibG9ja1BhcmFtcywgZGVwdGhzKTtcbiAgfVxuICByZXQuaXNUb3AgPSB0cnVlO1xuXG4gIHJldC5fc2V0dXAgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG4gICAgICBjb250YWluZXIuaGVscGVycyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLmhlbHBlcnMsIGVudi5oZWxwZXJzKTtcblxuICAgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VQYXJ0aWFsKSB7XG4gICAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLnBhcnRpYWxzLCBlbnYucGFydGlhbHMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb250YWluZXIuaGVscGVycyA9IG9wdGlvbnMuaGVscGVycztcbiAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IG9wdGlvbnMucGFydGlhbHM7XG4gICAgfVxuICB9O1xuXG4gIHJldC5fY2hpbGQgPSBmdW5jdGlvbiAoaSwgZGF0YSwgYmxvY2tQYXJhbXMsIGRlcHRocykge1xuICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlQmxvY2tQYXJhbXMgJiYgIWJsb2NrUGFyYW1zKSB7XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIGJsb2NrIHBhcmFtcycpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGVTcGVjLnVzZURlcHRocyAmJiAhZGVwdGhzKSB7XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIHBhcmVudCBkZXB0aHMnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gd3JhcFByb2dyYW0oY29udGFpbmVyLCBpLCB0ZW1wbGF0ZVNwZWNbaV0sIGRhdGEsIDAsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuICB9O1xuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiB3cmFwUHJvZ3JhbShjb250YWluZXIsIGksIGZuLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG4gIGZ1bmN0aW9uIHByb2coY29udGV4dCkge1xuICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1sxXTtcblxuICAgIHJldHVybiBmbi5jYWxsKGNvbnRhaW5lciwgY29udGV4dCwgY29udGFpbmVyLmhlbHBlcnMsIGNvbnRhaW5lci5wYXJ0aWFscywgb3B0aW9ucy5kYXRhIHx8IGRhdGEsIGJsb2NrUGFyYW1zICYmIFtvcHRpb25zLmJsb2NrUGFyYW1zXS5jb25jYXQoYmxvY2tQYXJhbXMpLCBkZXB0aHMgJiYgW2NvbnRleHRdLmNvbmNhdChkZXB0aHMpKTtcbiAgfVxuICBwcm9nLnByb2dyYW0gPSBpO1xuICBwcm9nLmRlcHRoID0gZGVwdGhzID8gZGVwdGhzLmxlbmd0aCA6IDA7XG4gIHByb2cuYmxvY2tQYXJhbXMgPSBkZWNsYXJlZEJsb2NrUGFyYW1zIHx8IDA7XG4gIHJldHVybiBwcm9nO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlUGFydGlhbChwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gIGlmICghcGFydGlhbCkge1xuICAgIHBhcnRpYWwgPSBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV07XG4gIH0gZWxzZSBpZiAoIXBhcnRpYWwuY2FsbCAmJiAhb3B0aW9ucy5uYW1lKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWMgcGFydGlhbCB0aGF0IHJldHVybmVkIGEgc3RyaW5nXG4gICAgb3B0aW9ucy5uYW1lID0gcGFydGlhbDtcbiAgICBwYXJ0aWFsID0gb3B0aW9ucy5wYXJ0aWFsc1twYXJ0aWFsXTtcbiAgfVxuICByZXR1cm4gcGFydGlhbDtcbn1cblxuZnVuY3Rpb24gaW52b2tlUGFydGlhbChwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMucGFydGlhbCA9IHRydWU7XG5cbiAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUaGUgcGFydGlhbCAnICsgb3B0aW9ucy5uYW1lICsgJyBjb3VsZCBub3QgYmUgZm91bmQnKTtcbiAgfSBlbHNlIGlmIChwYXJ0aWFsIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gcGFydGlhbChjb250ZXh0LCBvcHRpb25zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBub29wKCkge1xuICByZXR1cm4gJyc7XG59XG5cbmZ1bmN0aW9uIGluaXREYXRhKGNvbnRleHQsIGRhdGEpIHtcbiAgaWYgKCFkYXRhIHx8ICEoJ3Jvb3QnIGluIGRhdGEpKSB7XG4gICAgZGF0YSA9IGRhdGEgPyBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5jcmVhdGVGcmFtZShkYXRhKSA6IHt9O1xuICAgIGRhdGEucm9vdCA9IGNvbnRleHQ7XG4gIH1cbiAgcmV0dXJuIGRhdGE7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuLy8gQnVpbGQgb3V0IG91ciBiYXNpYyBTYWZlU3RyaW5nIHR5cGVcbmZ1bmN0aW9uIFNhZmVTdHJpbmcoc3RyaW5nKSB7XG4gIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xufVxuXG5TYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IFNhZmVTdHJpbmcucHJvdG90eXBlLnRvSFRNTCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICcnICsgdGhpcy5zdHJpbmc7XG59O1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBTYWZlU3RyaW5nO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7XG5cbi8vIE9sZGVyIElFIHZlcnNpb25zIGRvIG5vdCBkaXJlY3RseSBzdXBwb3J0IGluZGV4T2Ygc28gd2UgbXVzdCBpbXBsZW1lbnQgb3VyIG93biwgc2FkbHkuXG5leHBvcnRzLmluZGV4T2YgPSBpbmRleE9mO1xuZXhwb3J0cy5lc2NhcGVFeHByZXNzaW9uID0gZXNjYXBlRXhwcmVzc2lvbjtcbmV4cG9ydHMuaXNFbXB0eSA9IGlzRW1wdHk7XG5leHBvcnRzLmJsb2NrUGFyYW1zID0gYmxvY2tQYXJhbXM7XG5leHBvcnRzLmFwcGVuZENvbnRleHRQYXRoID0gYXBwZW5kQ29udGV4dFBhdGg7XG52YXIgZXNjYXBlID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90OycsXG4gICdcXCcnOiAnJiN4Mjc7JyxcbiAgJ2AnOiAnJiN4NjA7J1xufTtcblxudmFyIGJhZENoYXJzID0gL1smPD5cIidgXS9nLFxuICAgIHBvc3NpYmxlID0gL1smPD5cIidgXS87XG5cbmZ1bmN0aW9uIGVzY2FwZUNoYXIoY2hyKSB7XG4gIHJldHVybiBlc2NhcGVbY2hyXTtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKG9iaiAvKiAsIC4uLnNvdXJjZSAqLykge1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGZvciAodmFyIGtleSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXJndW1lbnRzW2ldLCBrZXkpKSB7XG4gICAgICAgIG9ialtrZXldID0gYXJndW1lbnRzW2ldW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn1cblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuZXhwb3J0cy50b1N0cmluZyA9IHRvU3RyaW5nO1xuLy8gU291cmNlZCBmcm9tIGxvZGFzaFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Jlc3RpZWpzL2xvZGFzaC9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dFxuLyplc2xpbnQtZGlzYWJsZSBmdW5jLXN0eWxlLCBuby12YXIgKi9cbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufTtcbi8vIGZhbGxiYWNrIGZvciBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaVxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmlmIChpc0Z1bmN0aW9uKC94LykpIHtcbiAgZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gIH07XG59XG52YXIgaXNGdW5jdGlvbjtcbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG4vKmVzbGludC1lbmFibGUgZnVuYy1zdHlsZSwgbm8tdmFyICovXG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcbn07ZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaW5kZXhPZihhcnJheSwgdmFsdWUpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGFycmF5W2ldID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlRXhwcmVzc2lvbihzdHJpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gZG9uJ3QgZXNjYXBlIFNhZmVTdHJpbmdzLCBzaW5jZSB0aGV5J3JlIGFscmVhZHkgc2FmZVxuICAgIGlmIChzdHJpbmcgJiYgc3RyaW5nLnRvSFRNTCkge1xuICAgICAgcmV0dXJuIHN0cmluZy50b0hUTUwoKTtcbiAgICB9IGVsc2UgaWYgKHN0cmluZyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfSBlbHNlIGlmICghc3RyaW5nKSB7XG4gICAgICByZXR1cm4gc3RyaW5nICsgJyc7XG4gICAgfVxuXG4gICAgLy8gRm9yY2UgYSBzdHJpbmcgY29udmVyc2lvbiBhcyB0aGlzIHdpbGwgYmUgZG9uZSBieSB0aGUgYXBwZW5kIHJlZ2FyZGxlc3MgYW5kXG4gICAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG4gICAgLy8gYW4gb2JqZWN0J3MgdG8gc3RyaW5nIGhhcyBlc2NhcGVkIGNoYXJhY3RlcnMgaW4gaXQuXG4gICAgc3RyaW5nID0gJycgKyBzdHJpbmc7XG4gIH1cblxuICBpZiAoIXBvc3NpYmxlLnRlc3Qoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmc7XG4gIH1cbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKGJhZENoYXJzLCBlc2NhcGVDaGFyKTtcbn1cblxuZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICBpZiAoIXZhbHVlICYmIHZhbHVlICE9PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJsb2NrUGFyYW1zKHBhcmFtcywgaWRzKSB7XG4gIHBhcmFtcy5wYXRoID0gaWRzO1xuICByZXR1cm4gcGFyYW1zO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRDb250ZXh0UGF0aChjb250ZXh0UGF0aCwgaWQpIHtcbiAgcmV0dXJuIChjb250ZXh0UGF0aCA/IGNvbnRleHRQYXRoICsgJy4nIDogJycpICsgaWQ7XG59IiwiLy8gQ3JlYXRlIGEgc2ltcGxlIHBhdGggYWxpYXMgdG8gYWxsb3cgYnJvd3NlcmlmeSB0byByZXNvbHZlXG4vLyB0aGUgcnVudGltZSBvbiBhIHN1cHBvcnRlZCBwYXRoLlxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZScpWydkZWZhdWx0J107XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJoYW5kbGViYXJzL3J1bnRpbWVcIilbXCJkZWZhdWx0XCJdO1xuIiwidmFyIHRlbXBsYXRlLCBBcHBMYXlvdXQ7XG5cbnRlbXBsYXRlID0gcmVxdWlyZSgnLi9sYXlvdXQnKTtcbi8qKlxuICogQXBwIExheW91dFxuICovXG5BcHBMYXlvdXQgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICBlbDogJ2JvZHknLFxuICByZWdpb25zOiB7XG4gICAgbWFpbiAgOiAnI21haW4nLFxuICAgIG1lbnUgIDogJyNtZW51J1xuICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gQXBwTGF5b3V0O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBuZXcgTWFyaW9uZXR0ZS5BcHBsaWNhdGlvbigpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5XcmVxci5yYWRpby5jaGFubmVsKCdtZW51Jyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLldyZXFyLnJhZGlvLmNoYW5uZWwoJ3ByZXNlbnRlcicpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFwaToge1xuICAgIHVybCA6ICdfX2FwaV9fJ1xuICB9LFxuICBtYXhfcm93czogNixcbiAgbWF4X2NvbHVtbnM6IDYsXG4gIG1pbl9kZWxheTogNTAwMCxcbiAgbWF4X2RlbGF5OiAxNTAwMFxufTtcbiIsInZhciBtYWluICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvbWFpbicpLFxuICAgIG1lbnUgICAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9jb250cm9sbGVycy9tZW51JyksXG4gICAgcHJlc2VudGVyICAgICA9IHJlcXVpcmUoJy4vY29tbW9ucy9jaGFubmVscy9wcmVzZW50ZXInKSxcbiAgICByb3V0ZXMgPSByZXF1aXJlKCcuL21vZHVsZXMvcm91dGVzJyksXG4gICAgQXBwQ29udHJvbGxlcjtcblxuQXBwQ29udHJvbGxlciA9IE1hcmlvbmV0dGUuT2JqZWN0LmV4dGVuZCh7XG4gIGFwcDogbnVsbCxcbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYXBwbGljYXRpb24gZm9yIGNvbnRyb2xsZXJcbiAgICogQHBhcmFtIGFwcCBNYXJpb25ldHRlLkFwcGxpY2F0aW9uXG4gICAqL1xuICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgcHJlc2VudGVyLnJlcXJlcy5zZXRIYW5kbGVyKFwibGF5b3V0XCIsIHRoaXMuZ2V0QXBwTGF5b3V0LmJpbmQodGhpcykpO1xuICB9LFxuICAvKipcbiAgICogR2V0cyB0aGUgYXBwbGljYXRpb24gTGF5b3V0XG4gICAqIEByZXR1cm4gTWFyaW9uZXR0ZS5MYXlvdXRWaWV3XG4gICAqL1xuICBnZXRBcHBMYXlvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hcHAubGF5b3V0O1xuICB9LFxuICAvKipcbiAgICogU3RhcnQgb2YgYXBwbGljYXRpb25cbiAgICovXG4gIHN0YXJ0OiBmdW5jdGlvbiAoYXBwLCByb3V0ZXIpIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLnJvdXRlciA9IHJvdXRlcjtcbiAgICBtYWluLnN0YXJ0KHRoaXMucm91dGVyKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwQ29udHJvbGxlcjtcbiIsInZhciBtZW51Q2hhbm5lbCA9IHJlcXVpcmUoJy4uL2NvbW1vbnMvY2hhbm5lbHMvbWVudScpLFxuICAgIGFwcENvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpLFxuICAgIG1lbnVDaGFubmVsID0gcmVxdWlyZSgnLi4vY29tbW9ucy9jaGFubmVscy9tZW51JyksXG4gICAgTWVudU1vZGVsO1xuXG5NZW51TW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuICBkZWZhdWx0czoge1xuICAgIHJvd3M6IDEsXG4gICAgY29sczogMVxuICB9LFxuICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgbWVudUNoYW5uZWwuY29tbWFuZHMuc2V0SGFuZGxlcignY2hhbmdlOnNpemUnLCB0aGlzLmNoYW5nZVRyZW5kc1NpemUuYmluZCh0aGlzKSk7XG4gICAgbWVudUNoYW5uZWwucmVxcmVzLnNldEhhbmRsZXIoJ3NpemUnLCB0aGlzLmdldFNpemUuYmluZCh0aGlzKSk7XG4gIH0sXG4gIGdldFNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29sczogdGhpcy5nZXQoJ2NvbHMnKSxcbiAgICAgIHJvd3M6IHRoaXMuZ2V0KCdyb3dzJylcbiAgICB9O1xuICB9LFxuICBjaGFuZ2VUcmVuZHNTaXplOiBmdW5jdGlvbiAoc2l6ZSkge1xuICAgIHZhciBjb2xzID0gc2l6ZSA/IHNpemUuY29scyA6IDAsXG4gICAgICAgIHJvd3MgPSBzaXplID8gc2l6ZS5yb3dzIDogMDtcbiAgICAvL0NvbnRyb2wgTWluIFZhbHVlc1xuICAgIGlmIChjb2xzIDwgMSkge1xuICAgICAgY29scyA9IDE7XG4gICAgfVxuICAgIGlmIChyb3dzIDwgMSkge1xuICAgICAgcm93cyA9IDE7XG4gICAgfVxuICAgIC8vQ29udHJvbCBNYXggVmFsdWVzXG4gICAgaWYgKGNvbHMgPiBhcHBDb25maWcubWF4X2NvbHVtbnMpIHtcbiAgICAgIGNvbHMgPSBhcHBDb25maWcuZ3JpZC5tYXhfY29sdW1ucztcbiAgICB9XG4gICAgaWYgKHJvd3MgPiBhcHBDb25maWcubWF4X3Jvd3MpIHtcbiAgICAgIHJvd3MgPSBhcHBDb25maWcuZ3JpZC5tYXhfcm93cztcbiAgICB9XG5cbiAgICB0aGlzLnNldCgncm93cycsIHJvd3MpO1xuICAgIHRoaXMuc2V0KCdjb2xzJywgY29scyk7XG5cbiAgICBtZW51Q2hhbm5lbC52ZW50LnRyaWdnZXIoJ2dyaWQ6Y2hhbmdlZCcsIHRoaXMudG9KU09OKCkpO1xuICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gTWVudU1vZGVsO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnNDb21waWxlciA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFyc0NvbXBpbGVyLnRlbXBsYXRlKHtcImNvbXBpbGVyXCI6WzYsXCI+PSAyLjAuMC1iZXRhLjFcIl0sXCJtYWluXCI6ZnVuY3Rpb24oZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHJldHVybiBcIjxkaXYgaWQ9XFxcIm1lbnVcXFwiIGNsYXNzPVxcXCJtZW51LXJlZ2lvbi1jb250YWluZXJcXFwiPjwvZGl2PlxcbjxkaXYgaWQ9XFxcIm1haW5cXFwiIGNsYXNzPVxcXCJtYWluLXJlZ2lvbi1jb250YWluZXJcXFwiPjwvZGl2PlxcblwiO1xufSxcInVzZURhdGFcIjp0cnVlfSk7XG4iLCJ2YXIgbW9jayA9IFtdLFxuICAgIGNhdGVnb3JpZXMgPSBbXG4gICAgICAnYXJ0cycsXG4gICAgICAnZW50ZXJ0YWlubWVudCcsXG4gICAgICAnZ2VvZ3JhcGh5JyxcbiAgICAgICdoaXN0b3J5JyxcbiAgICAgICdzY2llbmNlJyxcbiAgICAgICdzcG9ydHMnXG4gICAgXTtcblxuZm9yICh2YXIgaSA9IDA7IGkgPCAxMDAwOyBpKyspIHtcbiAgbW9jay5wdXNoKHtcbiAgICB0ZXh0OiAndHJlbmQgJyArIGksXG4gICAgY2F0ZWdvcnk6IGNhdGVnb3JpZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2F0ZWdvcmllcy5sZW5ndGgpXSxcbiAgICB2aXNpYmxlOiBmYWxzZVxuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtb2NrO1xuIiwidmFyIFRyZW5kcyA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgcG9pbnRlcjogMCxcblxuICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICBpZiAoKyt0aGlzLnBvaW50ZXIgPj0gdGhpcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucG9pbnRlciA9IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYXQodGhpcy5wb2ludGVyKTtcbiAgfSxcblxuICBwcmV2OiBmdW5jdGlvbigpIHtcbiAgICBpZiAoLS10aGlzLnBvaW50ZXIgPD0gMCkge1xuICAgICAgdGhpcy5wb2ludGVyID0gdGhpcy5sZW5ndGggLSAxO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmF0KHRoaXMucG9pbnRlcik7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZW5kcztcbiIsInZhciBNZW51SXRlbVZpZXcgPSByZXF1aXJlKCcuLi92aWV3cy9Db21tb25zL2l0ZW1WaWV3cy9NZW51JyksXG4gICAgbWVudUNoYW5uZWwgPSByZXF1aXJlKCcuLi8uLi9jb21tb25zL2NoYW5uZWxzL21lbnUnKSxcbiAgICBsYXlvdXQgPSByZXF1aXJlKCcuLi8uLi9jb21tb25zL2NoYW5uZWxzL3ByZXNlbnRlcicpLFxuICAgIE1lbnVNb2RlbCA9IHJlcXVpcmUoJy4uLy4uL2VudGl0aWVzL01lbnUnKSxcbiAgICBNZW51O1xuXG5NZW51ID0gTWFyaW9uZXR0ZS5PYmplY3QuZXh0ZW5kKHtcbiAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcmVzZW50ZXIgPSBsYXlvdXQucmVxcmVzLnJlcXVlc3QoJ2xheW91dCcpO1xuICAgIHRoaXMubW9kZWwgPSBuZXcgTWVudU1vZGVsKCk7XG4gICAgdGhpcy5tZW51SXRlbVZpZXcgPSBuZXcgTWVudUl0ZW1WaWV3KHtcbiAgICAgIG1vZGVsOiB0aGlzLm1vZGVsXG4gICAgfSk7XG4gICAgcHJlc2VudGVyLm1lbnUuc2hvdyh0aGlzLm1lbnVJdGVtVmlldyk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBNZW51KCk7XG4iLCJ2YXIgbW9jayA9IHJlcXVpcmUoJy4uLy4uL21vY2snKSxcbiAgICBUcmVuZHNDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi4vY29sbGVjdGlvbnMvVHJlbmRzJyksXG4gICAgbWVudUNoYW5uZWwgPSByZXF1aXJlKCcuLi8uLi9jb21tb25zL2NoYW5uZWxzL21lbnUnKSxcbiAgICBsYXlvdXQgPSByZXF1aXJlKCcuLi8uLi9jb21tb25zL2NoYW5uZWxzL3ByZXNlbnRlcicpLFxuICAgIENlbGxzQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCcuLi92aWV3cy9Db21tb25zL2NvbGxlY3Rpb25WaWV3cy9DZWxscycpLFxuICAgIFRyZW5kcztcblxuVHJlbmRzID0gTWFyaW9uZXR0ZS5Db250cm9sbGVyLmV4dGVuZCh7XG4gIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJlc2VudGVyID0gbGF5b3V0LnJlcXJlcy5yZXF1ZXN0KCdsYXlvdXQnKTtcblxuICAgIG1lbnVDaGFubmVsLnJlcXJlcy5zZXRIYW5kbGVyKCd0cmVuZHMnLCB0aGlzLmdldFRyZW5kcy5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuY2VsbHNDb2xsZWN0aW9uVmlldyA9IG5ldyBDZWxsc0NvbGxlY3Rpb25WaWV3KHsgY29sbGVjdGlvbjogbmV3IEJhY2tib25lLkNvbGxlY3Rpb24oKSB9KTtcblxuICAgIHByZXNlbnRlci5tYWluLnNob3codGhpcy5jZWxsc0NvbGxlY3Rpb25WaWV3KTtcbiAgICBtZW51Q2hhbm5lbC52ZW50Lm9uKCdncmlkOmNoYW5nZWQnLCB0aGlzLm9uQ2hhbmdlR3JpZCwgdGhpcyk7XG4gIH0sXG4gIGdldFRyZW5kczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgVHJlbmRzQ29sbGVjdGlvbihfLnNodWZmbGUobW9jaykpO1xuICB9LFxuXG4gIG9uQ2hhbmdlR3JpZDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNlbGxzID0gW10sXG4gICAgc2l6ZSA9IG1lbnUucmVxcmVzLnJlcXVlc3QoJ3NpemUnKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZS5jb2xzOyBpKyspIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2l6ZS5yb3dzOyBqKyspIHtcbiAgICAgICAgY2VsbHMucHVzaCh7XG4gICAgICAgICAgaWQ6ICcnICsgaSArICctJyArIGosXG4gICAgICAgICAgc2l6ZToge1xuICAgICAgICAgICAgY29sczogc2l6ZS5jb2xzLFxuICAgICAgICAgICAgcm93czogc2l6ZS5yb3dzXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jZWxsc0NvbGxlY3Rpb25WaWV3LmNvbGxlY3Rpb24uc2V0KGNlbGxzKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFRyZW5kcygpO1xuIiwidmFyIHJvdXRlc1RvQ29udHJvbCA9IHJlcXVpcmUoJy4vcm91dGVzJyksXG4gICAgQ2VsbHMgPSByZXF1aXJlKCcuL3ZpZXdzL0NvbW1vbnMvY29sbGVjdGlvblZpZXdzL0NlbGxzJyksXG4gICAgbW9jayA9IHJlcXVpcmUoJy4uL21vY2snKSxcbiAgICBUcmVuZHMgPSByZXF1aXJlKCcuL2NvbGxlY3Rpb25zL1RyZW5kcycpLFxuICAgIHRyZW5kc0N0bHIgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL3RyZW5kcycpLFxuICAgIG1lbnVDdGxyID0gcmVxdWlyZSgnLi9jb250cm9sbGVycy9tZW51JyksXG4gICAgYXBwQ29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJyksXG4gICAgcHJlc2VudGVyID0gcmVxdWlyZSgnLi4vY29tbW9ucy9jaGFubmVscy9wcmVzZW50ZXInKSxcbiAgICBtZW51ID0gcmVxdWlyZSgnLi4vY29tbW9ucy9jaGFubmVscy9tZW51JyksXG4gICAgTWFpbkNvbnRyb2xsZXI7XG5cbk1haW5Db250cm9sbGVyID0gTWFyaW9uZXR0ZS5PYmplY3QuZXh0ZW5kKHtcbiAgc3RhcnQ6IGZ1bmN0aW9uKHJvdXRlcikge1xuICAgIHRyZW5kc0N0bHIuc3RhcnQoKTtcbiAgICBtZW51Q3Rsci5zdGFydCgpO1xuICAgIHJvdXRlci5wcm9jZXNzQXBwUm91dGVzKHRoaXMsIHJvdXRlc1RvQ29udHJvbCk7XG4gIH0sXG4gIGluaXRSb3V0ZTogZnVuY3Rpb24oKSB7XG4gICAgQmFja2JvbmUuaGlzdG9yeS5uYXZpZ2F0ZSgnaG9tZScsIHsgdHJpZ2dlcjogdHJ1ZSB9KTtcbiAgfSxcbiAgc2hvd1RyZW5kczogZnVuY3Rpb24oY29scywgcm93cykge1xuICAgIG1lbnUuY29tbWFuZHMuZXhlY3V0ZSgnY2hhbmdlOnNpemUnLCB7IGNvbHM6IGNvbHMsIHJvd3M6IHJvd3N9KTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IE1haW5Db250cm9sbGVyKCk7XG4iLCJ2YXIgcm91dGVzID0ge1xuICAnJzogJ2luaXRSb3V0ZScsXG4gICdob21lKC86cm93cy86Y29scyknOiAnc2hvd1RyZW5kcycsXG4gICcqYWN0aW9uJzogJ2luaXRSb3V0ZSdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcm91dGVzO1xuIiwiLy8gaGJzZnkgY29tcGlsZWQgSGFuZGxlYmFycyB0ZW1wbGF0ZVxudmFyIEhhbmRsZWJhcnNDb21waWxlciA9IHJlcXVpcmUoJ2hic2Z5L3J1bnRpbWUnKTtcbm1vZHVsZS5leHBvcnRzID0gSGFuZGxlYmFyc0NvbXBpbGVyLnRlbXBsYXRlKHtcImNvbXBpbGVyXCI6WzYsXCI+PSAyLjAuMC1iZXRhLjFcIl0sXCJtYWluXCI6ZnVuY3Rpb24oZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHJldHVybiBcIlwiO1xufSxcInVzZURhdGFcIjp0cnVlfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFyc0NvbXBpbGVyID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzQ29tcGlsZXIudGVtcGxhdGUoe1wiMVwiOmZ1bmN0aW9uKGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICB2YXIgaGVscGVyLCBhbGlhczE9aGVscGVycy5oZWxwZXJNaXNzaW5nLCBhbGlhczI9XCJmdW5jdGlvblwiLCBhbGlhczM9dGhpcy5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIHJldHVybiBcIiAgICAgICAgICAgICAgPGEgaHJlZj1cXFwiI2hvbWUvXCJcbiAgICArIGFsaWFzMygoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmogfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmogOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMxKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMyID8gaGVscGVyLmNhbGwoZGVwdGgwLHtcIm5hbWVcIjpcImpcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiL1wiXG4gICAgKyBhbGlhczMoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5pIHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5pIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMSksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMiA/IGhlbHBlci5jYWxsKGRlcHRoMCx7XCJuYW1lXCI6XCJpXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIlxcXCIgZGF0YS1jb2w9XFxcIlwiXG4gICAgKyBhbGlhczMoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5qIHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5qIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMSksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMiA/IGhlbHBlci5jYWxsKGRlcHRoMCx7XCJuYW1lXCI6XCJqXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIlxcXCIgZGF0YS1yb3c9XFxcIlwiXG4gICAgKyBhbGlhczMoKChoZWxwZXIgPSAoaGVscGVyID0gaGVscGVycy5pIHx8IChkZXB0aDAgIT0gbnVsbCA/IGRlcHRoMC5pIDogZGVwdGgwKSkgIT0gbnVsbCA/IGhlbHBlciA6IGFsaWFzMSksKHR5cGVvZiBoZWxwZXIgPT09IGFsaWFzMiA/IGhlbHBlci5jYWxsKGRlcHRoMCx7XCJuYW1lXCI6XCJpXCIsXCJoYXNoXCI6e30sXCJkYXRhXCI6ZGF0YX0pIDogaGVscGVyKSkpXG4gICAgKyBcIlxcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdCBidG4teHMgY2VsbFxcXCI+PC9hPlxcblwiO1xufSxcImNvbXBpbGVyXCI6WzYsXCI+PSAyLjAuMC1iZXRhLjFcIl0sXCJtYWluXCI6ZnVuY3Rpb24oZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBzdGFjazE7XG5cbiAgcmV0dXJuIFwiPGRpdiBjbGFzcz1cXFwibmF2YmFyLWhlYWRlclxcXCI+XFxuICA8YnV0dG9uIHR5cGU9XFxcImJ1dHRvblxcXCIgY2xhc3M9XFxcIm5hdmJhci10b2dnbGUgY29sbGFwc2VkXFxcIiBkYXRhLXRvZ2dsZT1cXFwiY29sbGFwc2VcXFwiIGRhdGEtdGFyZ2V0PVxcXCIjbmF2YmFyLWNvbGxhcHNlXFxcIj5cXG4gICAgPHNwYW4gY2xhc3M9XFxcImljb24tYmFyXFxcIj48L3NwYW4+XFxuICAgIDxzcGFuIGNsYXNzPVxcXCJpY29uLWJhclxcXCI+PC9zcGFuPlxcbiAgICA8c3BhbiBjbGFzcz1cXFwiaWNvbi1iYXJcXFwiPjwvc3Bhbj5cXG4gIDwvYnV0dG9uPlxcbjwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcImNvbGxhcHNlIG5hdmJhci1jb2xsYXBzZVxcXCIgaWQ9XFxcIm5hdmJhci1jb2xsYXBzZVxcXCI+XFxuICA8dWwgY2xhc3M9XFxcIm5hdiBuYXZiYXItbmF2XFxcIj5cXG4gICAgPGxpIGNsYXNzPVxcXCJhY3RpdmVcXFwiPlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcImJ0biBidG4tbGluayBuYXZiYXItYnRuIGJ0bi1ncmlkXFxcIj48c3BhbiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi10aFxcXCI+PC9zcGFuPjwvZGl2PlxcbiAgICAgIDxkaXYgY2xhc3M9XFxcInBvcG92ZXItY29udGVudCBoaWRkZW5cXFwiPlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuLWdyb3VwXFxcIj5cXG5cIlxuICAgICsgKChzdGFjazEgPSBoZWxwZXJzLmVhY2guY2FsbChkZXB0aDAsKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmNlbGxzIDogZGVwdGgwKSx7XCJuYW1lXCI6XCJlYWNoXCIsXCJoYXNoXCI6e30sXCJmblwiOnRoaXMucHJvZ3JhbSgxLCBkYXRhLCAwKSxcImludmVyc2VcIjp0aGlzLm5vb3AsXCJkYXRhXCI6ZGF0YX0pKSAhPSBudWxsID8gc3RhY2sxIDogXCJcIilcbiAgICArIFwiICAgICAgPC9kaXY+XFxuICAgIDwvbGk+XFxuICA8L3VsPlxcbjwvZGl2PlxcblwiO1xufSxcInVzZURhdGFcIjp0cnVlfSk7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFyc0NvbXBpbGVyID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzQ29tcGlsZXIudGVtcGxhdGUoe1wiY29tcGlsZXJcIjpbNixcIj49IDIuMC4wLWJldGEuMVwiXSxcIm1haW5cIjpmdW5jdGlvbihkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gICAgcmV0dXJuIFwiPGgxPjwvaDE+XFxuXCI7XG59LFwidXNlRGF0YVwiOnRydWV9KTtcbiIsInZhciBDZWxsSXRlbVZpZXcgPSByZXF1aXJlKCcuLi9pdGVtVmlld3MvQ2VsbCcpLFxuQ2VsbHM7XG5cbkNlbGxzID0gTWFyaW9uZXR0ZS5Db2xsZWN0aW9uVmlldy5leHRlbmQoe1xuICBjaGlsZFZpZXc6IENlbGxJdGVtVmlldyxcbiAgY2xhc3NOYW1lOiAncm93J1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2VsbHM7XG4iLCJ2YXIgVHJlbmRzQ2VsbEl0ZW1WaWV3ID0gcmVxdWlyZSgnLi4vLi4vVHJlbmRzL2l0ZW1WaWV3cy9UcmVuZHNDZWxsJyksXG4gICAgbWVudUNoYW5uZWwgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi9jb21tb25zL2NoYW5uZWxzL21lbnUnKSxcbiAgICBhcHBDb25maWcgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi9jb25maWcnKSxcbiAgICBDZWxsO1xuXG5DZWxsID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgnJyksXG5cbiAgbW9kZWxFdmVudHM6IHtcbiAgICAnY2hhbmdlIHNpemUnOiAnb25DaGFuZ2VTaXplJ1xuICB9LFxuXG4gIG9uQ2hhbmdlU2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNpemUgPSBtZW51Q2hhbm5lbC5yZXFyZXMucmVxdWVzdCgnc2l6ZScpO1xuICAgIHRoaXMuJGVsLnJlbW92ZUNsYXNzKCk7XG4gICAgdGhpcy4kZWwuYWRkQ2xhc3MoJ2NlbGwgY2VsbC0nICsgc2l6ZS5jb2xzICsgJy0nICsgc2l6ZS5yb3dzKTtcbiAgfSxcblxuICBvblJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRyZW5kcyA9IG1lbnVDaGFubmVsLnJlcXJlcy5yZXF1ZXN0KCd0cmVuZHMnKSxcbiAgICAgICAgdHJlbmRzQ2VsbEl0ZW1WaWV3O1xuXG4gICAgdHJlbmRzQ2VsbEl0ZW1WaWV3ID0gbmV3IFRyZW5kc0NlbGxJdGVtVmlldyh7IGNvbGxlY3Rpb246IHRyZW5kcyB9KTtcblxuICAgIHRoaXMuJGVsLmh0bWwodHJlbmRzQ2VsbEl0ZW1WaWV3LiRlbCk7XG4gICAgdGhpcy5vbkNoYW5nZVNpemUoKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2VsbDtcbiIsInZhciBhcHBDb25maWcgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi9jb25maWcnKSxcbiAgICBtZW51Q2hhbm5lbCA9IHJlcXVpcmUoJy4uLy4uLy4uLy4uL2NvbW1vbnMvY2hhbm5lbHMvbWVudScpLFxuICAgIG1lbnVUZW1wbGF0ZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3RlbXBsYXRlcy9Db21tb25zL21lbnUnKSxcbiAgICBNZW51O1xuXG5NZW51ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogbWVudVRlbXBsYXRlLFxuICBjbGFzc05hbWU6ICdjb250YWluZXItZmx1aWQnLFxuXG4gIHVpOiB7XG4gICAgYnRuX2dyaWQ6ICcuYnRuLWdyaWQnLFxuICAgIHBvcG92ZXJfY29udGVudDogJy5wb3BvdmVyLWNvbnRlbnQnXG4gIH0sXG5cbiAgb25PdmVyQ2VsbDogZnVuY3Rpb24oZXZ0KSB7XG4gICAgdmFyIGNlbGwgPSAkKGV2dC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgY29sdW1uID0gK2NlbGwuZGF0YSgnY29sJyk7XG5cbiAgICAkKCcucG9wb3ZlciA+IC5wb3BvdmVyLWNvbnRlbnQgLmNlbGwnKS5yZW1vdmVDbGFzcygnYnRuLXByaW1hcnknKTtcblxuICAgIGNlbGwuYWRkQ2xhc3MoJ2J0bi1wcmltYXJ5Jyk7XG4gICAgZm9yICh2YXIgaSA9IGNvbHVtbjsgaSA+IDA7IGktLSkge1xuICAgICAgY2VsbC5wcmV2QWxsKCc6bnRoLWNoaWxkKDZuKycgKyBpICsgJyknKS5hZGRDbGFzcygnYnRuLXByaW1hcnknKTtcbiAgICB9XG4gIH0sXG5cbiAgb25DbGlja0NlbGw6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudWkuYnRuX2dyaWQucG9wb3ZlcignaGlkZScpO1xuICB9LFxuXG4gIG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgXy5kZWZlcihmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYudWkuYnRuX2dyaWQucG9wb3Zlcih7XG4gICAgICAgIGh0bWw6IHRydWUsXG4gICAgICAgIGNvbnRlbnQ6IHNlbGYudWkucG9wb3Zlcl9jb250ZW50Lmh0bWwoKSxcbiAgICAgICAgdmlld3BvcnQ6IHsgc2VsZWN0b3I6ICdib2R5JywgcGFkZGluZzogJzEwJyB9LFxuICAgICAgICBwbGFjZW1lbnQ6ICdib3R0b20nLFxuICAgICAgICB0b2dnbGU6ICdwb3BvdmVyJ1xuICAgICAgfSk7XG5cbiAgICAgIHNlbGYudWkuYnRuX2dyaWQub24oJ3Nob3duLmJzLnBvcG92ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLnBvcG92ZXIgPiAucG9wb3Zlci1jb250ZW50IC5jZWxsJylcbiAgICAgICAgICAub24oJ21vdXNlb3ZlcicsIHNlbGYub25PdmVyQ2VsbC5iaW5kKHNlbGYpKVxuICAgICAgICAgIC5vbmUoJ2NsaWNrJywgc2VsZi5vbkNsaWNrQ2VsbC5iaW5kKHNlbGYpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIHNlcmlhbGl6ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzaXplICA9IHRoaXMubW9kZWwuZ2V0U2l6ZSgpLFxuICAgICAgICBjZWxscyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gYXBwQ29uZmlnLm1heF9yb3dzOyBpKyspIHtcbiAgICAgIGZvcih2YXIgaiA9IDE7IGogPD0gYXBwQ29uZmlnLm1heF9jb2x1bW5zOyBqKyspIHtcbiAgICAgICAgY2VsbHMucHVzaCh7XG4gICAgICAgICAgaTogaSxcbiAgICAgICAgICBqOiBqXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgY2VsbHM6IGNlbGxzXG4gICAgfTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudTtcbiIsInZhciB0cmVuZFRlbXBsYXRlID0gcmVxdWlyZSgnLi4vLi4vLi4vdGVtcGxhdGVzL1RyZW5kcy90cmVuZCcpLFxuVHJlbmQ7XG5cblRyZW5kID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogdHJlbmRUZW1wbGF0ZSxcbiAgY2xhc3NOYW1lOiAndHJlbmQnLFxuICB1aToge1xuICAgIHRleHQ6ICdoMSdcbiAgfSxcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfSxcbiAgb25SZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJGVsLmFkZENsYXNzKCdiZy0nICsgdGhpcy5tb2RlbC5nZXQoJ2NhdGVnb3J5JykpO1xuICAgIHRoaXMudWkudGV4dC50eXBlZCh7XG4gICAgICBzdHJpbmdzOiBbdGhpcy5tb2RlbC5nZXQoJ3RleHQnKSArICcnXSxcbiAgICAgIHN0YXJ0RGVsYXk6IDUwMCxcbiAgICAgIHNob3dDdXJzb3I6IGZhbHNlXG4gICAgfSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZW5kO1xuIiwidmFyIFRyZW5kSXRlbVZpZXcgPSByZXF1aXJlKCcuL1RyZW5kJyksXG5hcHBDb25maWcgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi9jb25maWcnKSxcbmNlbGxUZW1wbGF0ZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3RlbXBsYXRlcy9DZWxscy9jZWxsJyksXG5UcmVuZHNDZWxsO1xuXG5UcmVuZHNDZWxsID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogY2VsbFRlbXBsYXRlLFxuICBjbGFzc05hbWU6ICd0cmVuZHMtY2VsbCcsXG5cbiAgc3RhcnRUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdGFydF90aW1lID0gbnVsbDtcbiAgICB0aGlzLmVuZF90aW1lID0gXy5yYW5kb20oYXBwQ29uZmlnLm1pbl9kZWxheSwgYXBwQ29uZmlnLm1heF9kZWxheSk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMudGljay5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICB0aWNrOiBmdW5jdGlvbih0aW1lc3RhbXApIHtcbiAgICBpZiAoIXRoaXMuc3RhcnRfdGltZSkge1xuICAgICAgdGhpcy5zdGFydF90aW1lID0gdGltZXN0YW1wO1xuICAgIH1cblxuICAgIHZhciBkZWx0YSA9IHRpbWVzdGFtcCAtIHRoaXMuc3RhcnRfdGltZTtcblxuICAgIGlmIChkZWx0YSA8IHRoaXMuZW5kX3RpbWUpIHtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnRpY2suYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3dpdGNoVHJlbmQoKTtcbiAgICB9XG4gIH0sXG5cbiAgc3dpdGNoVHJlbmQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubmV3X3RyZW5kID0gdGhpcy5jcmVhdGVUcmVuZCgpO1xuXG4gICAgc3dpdGNoKF8ucmFuZG9tKDMpKSB7XG4gICAgICBjYXNlIDA6IC8vIHNsaWRlIHJpZ2h0XG4gICAgICAgIHRoaXMuc2xpZGVSaWdodCgpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxOiAvLyBzbGlkZSBsZWZ0XG4gICAgICAgIHRoaXMuc2xpZGVMZWZ0KCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDI6IC8vIHNsaWRlIHVwXG4gICAgICAgIHRoaXMuc2xpZGVVcCgpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOiAvLyBzbGlkZSBkb3duXG4gICAgICAgIHRoaXMuc2xpZGVEb3duKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHRoaXMuJGVsLm9uZSgnd2Via2l0VHJhbnNpdGlvbkVuZCB0cmFuc2l0aW9uZW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51cGRhdGVUcmVuZHNDZWxsKCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcblxuICBjcmVhdGVUcmVuZDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRyZW5kTW9kZWwgPSB0aGlzLmNvbGxlY3Rpb24ubmV4dCgpLFxuICAgICAgICB0cmVuZEl0ZW1WaWV3ID0gbmV3IFRyZW5kSXRlbVZpZXcoeyBtb2RlbDogdHJlbmRNb2RlbCB9KTtcblxuICAgIHJldHVybiB0cmVuZEl0ZW1WaWV3O1xuICB9LFxuXG4gIHVwZGF0ZVRyZW5kc0NlbGw6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmN1cnJlbnRfdHJlbmQpIHtcbiAgICAgIHRoaXMuY3VycmVudF90cmVuZC5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50X3RyZW5kID0gdGhpcy5uZXdfdHJlbmQ7XG5cbiAgICB0aGlzLiRlbC5yZW1vdmVDbGFzcygnaG9yaXpvbnRhbCB2ZXJ0aWNhbCBzbGlkZSByaWdodCBsZWZ0IHVwIGRvd24nKTtcbiAgICB0aGlzLnN0YXJ0VGltZXIoKTtcbiAgfSxcblxuICBzbGlkZVJpZ2h0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiRlbC5wcmVwZW5kKHRoaXMubmV3X3RyZW5kLiRlbClcbiAgICAgIC5hZGRDbGFzcygnaG9yaXpvbnRhbCBzbGlkZSByaWdodCcpO1xuICB9LFxuXG4gIHNsaWRlTGVmdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMubmV3X3RyZW5kLiRlbClcbiAgICAgIC5hZGRDbGFzcygnaG9yaXpvbnRhbCBzbGlkZSBsZWZ0Jyk7XG4gIH0sXG5cbiAgc2xpZGVVcDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMubmV3X3RyZW5kLiRlbClcbiAgICAgIC5hZGRDbGFzcygndmVydGljYWwgc2xpZGUgdXAnKTtcbiAgfSxcblxuICBzbGlkZURvd246IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJGVsLnByZXBlbmQodGhpcy5uZXdfdHJlbmQuJGVsKVxuICAgICAgLmFkZENsYXNzKCd2ZXJ0aWNhbCBzbGlkZSBkb3duJyk7XG4gIH0sXG5cbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH0sXG4gIG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm5ld190cmVuZCA9IHRoaXMuY3JlYXRlVHJlbmQoKTtcbiAgICB0aGlzLiRlbC5hcHBlbmQodGhpcy5uZXdfdHJlbmQuJGVsKTtcbiAgICB0aGlzLnVwZGF0ZVRyZW5kc0NlbGwoKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVHJlbmRzQ2VsbDtcbiIsIm1vZHVsZS5leHBvcnRzID0gTWFyaW9uZXR0ZS5BcHBSb3V0ZXIuZXh0ZW5kKHt9KTtcbiJdfQ==
