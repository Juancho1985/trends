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

},{"./LayoutView":11,"./app":12,"./config":17,"./controller":18,"./router":35}],2:[function(require,module,exports){
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

},{"./layout":20}],12:[function(require,module,exports){
module.exports = new Marionette.Application();

},{}],13:[function(require,module,exports){
module.exports = Backbone.Wreqr.radio.channel('events');

},{}],14:[function(require,module,exports){
module.exports = Backbone.Wreqr.radio.channel('menu');

},{}],15:[function(require,module,exports){
module.exports = Backbone.Wreqr.radio.channel('presenter');

},{}],16:[function(require,module,exports){
module.exports = Backbone.Wreqr.radio.channel('trends');

},{}],17:[function(require,module,exports){
module.exports = {
  api: {
    url : 'http://localhost:3000/development/'
  },
  max_rows: 6,
  max_columns: 6,
  min_delay: 5000,
  max_delay: 15000
};

},{}],18:[function(require,module,exports){
var main      = require('./modules/main'),
    menu      = require('./modules/controllers/menu'),
    presenter     = require('./commons/channels/presenter'),
    routes = require('./modules/routes'),
    events        = require('./commons/channels/events'),
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

},{"./commons/channels/events":13,"./commons/channels/presenter":15,"./modules/controllers/menu":23,"./modules/main":25,"./modules/routes":26}],19:[function(require,module,exports){
var menuChannel = require('../commons/channels/menu'),
    appConfig = require('../config'),
    trendsChannel = require('../commons/channels/trends'),
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

    trendsChannel.vent.trigger('grid:changed', this.toJSON());
  }
});
module.exports = MenuModel;

},{"../commons/channels/menu":14,"../commons/channels/trends":16,"../config":17}],20:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    return "<div id=\"menu\" class=\"menu-region-container\"></div>\n<div id=\"main\" class=\"main-region-container\"></div>\n";
},"useData":true});

},{"hbsfy/runtime":10}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
var MenuItemView = require('../views/Commons/itemViews/Menu'),
    menuChannel = require('../../commons/channels/menu'),
    layout = require('../../commons/channels/presenter'),
    TrendsModel = require('../../entities/Trends'),
    Menu;

Menu = Marionette.Object.extend({
  start: function() {
    var presenter = layout.reqres.request('layout');
    this.model = new TrendsModel();
    this.menuItemView = new MenuItemView();
    presenter.menu.show(this.menuItemView);
  }
});

module.exports = new Menu();

},{"../../commons/channels/menu":14,"../../commons/channels/presenter":15,"../../entities/Trends":19,"../views/Commons/itemViews/Menu":32}],24:[function(require,module,exports){
var mock = require('../../mock'),
    TrendsCollection = require('../collections/Trends'),
    menu = require('../../commons/channels/menu'),
    trends = require('../../commons/channels/trends'),
    layout = require('../../commons/channels/presenter'),
    trendsChannel = require('../../commons/channels/trends'),
    CellsCollectionView = require('../views/Commons/collectionViews/Cells'),
    Trends;

Trends = Marionette.Controller.extend({
  start: function() {
    var presenter = layout.reqres.request('layout');

    trends.reqres.setHandler('trends', this.getTrends.bind(this));

    this.cellsCollectionView = new CellsCollectionView({ collection: new Backbone.Collection() });

    presenter.main.show(this.cellsCollectionView);
    trendsChannel.vent.on('grid:changed', this.onChangeGrid, this);
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

},{"../../commons/channels/menu":14,"../../commons/channels/presenter":15,"../../commons/channels/trends":16,"../../mock":21,"../collections/Trends":22,"../views/Commons/collectionViews/Cells":30}],25:[function(require,module,exports){
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

},{"../commons/channels/menu":14,"../commons/channels/presenter":15,"../config":17,"../mock":21,"./collections/Trends":22,"./controllers/menu":23,"./controllers/trends":24,"./routes":26,"./views/Commons/collectionViews/Cells":30}],26:[function(require,module,exports){
var routes = {
  '': 'initRoute',
  'home(/:rows/:cols)': 'showTrends',
  '*action': 'initRoute'
};

module.exports = routes;

},{}],27:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    return "";
},"useData":true});

},{"hbsfy/runtime":10}],28:[function(require,module,exports){
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

},{"hbsfy/runtime":10}],29:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    return "<h1></h1>\n";
},"useData":true});

},{"hbsfy/runtime":10}],30:[function(require,module,exports){
var CellItemView = require('../itemViews/Cell'),
Cells;

Cells = Marionette.CollectionView.extend({
  childView: CellItemView,
  className: 'row'
});

module.exports = Cells;

},{"../itemViews/Cell":31}],31:[function(require,module,exports){
var TrendsCellItemView = require('../../Trends/itemViews/TrendsCell'),
menu = require('../../../../commons/channels/menu'),
trendsChannel = require('../../../../commons/channels/trends'),
appConfig = require('../../../../config'),
Cell;

Cell = Marionette.ItemView.extend({
  template: _.template(''),

  modelEvents: {
    'change size': 'onChangeSize'
  },

  onChangeSize: function() {
    var size = menu.reqres.request('size');
    this.$el.removeClass();
    this.$el.addClass('cell cell-' + size.cols + '-' + size.rows);
  },

  onRender: function() {
    var trends = trendsChannel.reqres.request('trends'),
    trendsCellItemView;

    trendsCellItemView = new TrendsCellItemView({ collection: trends });

    this.$el.html(trendsCellItemView.$el);
    this.onChangeSize();
  }
});

module.exports = Cell;

},{"../../../../commons/channels/menu":14,"../../../../commons/channels/trends":16,"../../../../config":17,"../../Trends/itemViews/TrendsCell":34}],32:[function(require,module,exports){
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
    _.defer(function() {
      this.ui.btn_grid.popover({
        html: true,
        content: this.ui.popover_content.html(),
        viewport: { selector: 'body', padding: '10' },
        placement: 'bottom',
        toggle: 'popover'
      });

      this.ui.btn_grid.on('shown.bs.popover', function() {
        $('.popover > .popover-content .cell')
          .on('mouseover', this.onOverCell.bind(this))
          .one('click', this.onClickCell.bind(this));
      }.bind(this));
    }.bind(this));
  },

  serializeData: function() {
    var size = menuChannel.reqres.request('size'), cells = [];

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

},{"../../../../commons/channels/menu":14,"../../../../config":17,"../../../templates/Commons/menu":28}],33:[function(require,module,exports){
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

},{"../../../templates/Trends/trend":29}],34:[function(require,module,exports){
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

},{"../../../../config":17,"../../../templates/Cells/cell":27,"./Trend":33}],35:[function(require,module,exports){
module.exports = Marionette.AppRouter.extend({});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZS5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvYmFzZS5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvZXhjZXB0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvZGlzdC9janMvaGFuZGxlYmFycy9uby1jb25mbGljdC5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvcnVudGltZS5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvY2pzL2hhbmRsZWJhcnMvc2FmZS1zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvaGFuZGxlYmFycy9kaXN0L2Nqcy9oYW5kbGViYXJzL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2hhbmRsZWJhcnMvcnVudGltZS5qcyIsIm5vZGVfbW9kdWxlcy9oYnNmeS9ydW50aW1lLmpzIiwic3JjL2pzL0xheW91dFZpZXcuanMiLCJzcmMvanMvYXBwLmpzIiwic3JjL2pzL2NvbW1vbnMvY2hhbm5lbHMvZXZlbnRzLmpzIiwic3JjL2pzL2NvbW1vbnMvY2hhbm5lbHMvbWVudS5qcyIsInNyYy9qcy9jb21tb25zL2NoYW5uZWxzL3ByZXNlbnRlci5qcyIsInNyYy9qcy9jb21tb25zL2NoYW5uZWxzL3RyZW5kcy5qcyIsInNyYy9qcy9jb25maWcuanMiLCJzcmMvanMvY29udHJvbGxlci5qcyIsInNyYy9qcy9lbnRpdGllcy9UcmVuZHMuanMiLCJzcmMvanMvbGF5b3V0LmhicyIsInNyYy9qcy9tb2NrLmpzIiwic3JjL2pzL21vZHVsZXMvY29sbGVjdGlvbnMvVHJlbmRzLmpzIiwic3JjL2pzL21vZHVsZXMvY29udHJvbGxlcnMvbWVudS5qcyIsInNyYy9qcy9tb2R1bGVzL2NvbnRyb2xsZXJzL3RyZW5kcy5qcyIsInNyYy9qcy9tb2R1bGVzL21haW4uanMiLCJzcmMvanMvbW9kdWxlcy9yb3V0ZXMuanMiLCJzcmMvanMvbW9kdWxlcy90ZW1wbGF0ZXMvQ2VsbHMvY2VsbC5oYnMiLCJzcmMvanMvbW9kdWxlcy90ZW1wbGF0ZXMvQ29tbW9ucy9tZW51LmhicyIsInNyYy9qcy9tb2R1bGVzL3RlbXBsYXRlcy9UcmVuZHMvdHJlbmQuaGJzIiwic3JjL2pzL21vZHVsZXMvdmlld3MvQ29tbW9ucy9jb2xsZWN0aW9uVmlld3MvQ2VsbHMuanMiLCJzcmMvanMvbW9kdWxlcy92aWV3cy9Db21tb25zL2l0ZW1WaWV3cy9DZWxsLmpzIiwic3JjL2pzL21vZHVsZXMvdmlld3MvQ29tbW9ucy9pdGVtVmlld3MvTWVudS5qcyIsInNyYy9qcy9tb2R1bGVzL3ZpZXdzL1RyZW5kcy9pdGVtVmlld3MvVHJlbmQuanMiLCJzcmMvanMvbW9kdWxlcy92aWV3cy9UcmVuZHMvaXRlbVZpZXdzL1RyZW5kc0NlbGwuanMiLCJzcmMvanMvcm91dGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogTWFpbiBEZXBlbmRlbmNpZXNcbiAqL1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyksXG4gIEFwcExheW91dCA9IHJlcXVpcmUoJy4vTGF5b3V0VmlldycpLFxuICBBcHBSb3V0ZXIgPSByZXF1aXJlKCcuL3JvdXRlcicpLFxuICBBcHAgPSByZXF1aXJlKCcuL2FwcCcpLFxuICBBcHBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9jb250cm9sbGVyJyksXG4gIHJvdXRlcixcbiAgYXBpLFxuICBhcHBDb250cm9sbGVyO1xuXG4vKipcbiAqIEFwcGxpY2F0aW9uIHN0YXJ0cyBieSBhc3NpZ25pbmcgYW4gYXBwIGNvbnRyb2xsZXIgdG8gdGhlIHJvdXRlclxuICogYW5kIHRoZSByb3V0ZXIgdG8gdGhlIGFwcGxpY2F0aW9uLlxuICogVGhlbiBzdGFydCBjb250cm9sbGVyIGFuZCByb3V0aW5nLlxuICovXG5BcHAub24oJ3N0YXJ0JywgZnVuY3Rpb24oKSB7XG4gIGFwcENvbnRyb2xsZXIgPSBuZXcgQXBwQ29udHJvbGxlcih0aGlzKTtcbiAgcm91dGVyID0gbmV3IEFwcFJvdXRlcigpO1xuXG4gIEFwcC5sYXlvdXQgPSBuZXcgQXBwTGF5b3V0KCk7XG5cbiAgQXBwLmxheW91dC5yZW5kZXIoKTtcbiAgYXBwQ29udHJvbGxlci5zdGFydCh0aGlzLCByb3V0ZXIpO1xuICBCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KCk7XG59KTtcblxuQXBwLnN0YXJ0KCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9pbXBvcnQgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvYmFzZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQpO1xuXG4vLyBFYWNoIG9mIHRoZXNlIGF1Z21lbnQgdGhlIEhhbmRsZWJhcnMgb2JqZWN0LiBObyBuZWVkIHRvIHNldHVwIGhlcmUuXG4vLyAoVGhpcyBpcyBkb25lIHRvIGVhc2lseSBzaGFyZSBjb2RlIGJldHdlZW4gY29tbW9uanMgYW5kIGJyb3dzZSBlbnZzKVxuXG52YXIgX1NhZmVTdHJpbmcgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvc2FmZS1zdHJpbmcnKTtcblxudmFyIF9TYWZlU3RyaW5nMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9TYWZlU3RyaW5nKTtcblxudmFyIF9FeGNlcHRpb24gPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvZXhjZXB0aW9uJyk7XG5cbnZhciBfRXhjZXB0aW9uMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9FeGNlcHRpb24pO1xuXG52YXIgX2ltcG9ydDIgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvdXRpbHMnKTtcblxudmFyIFV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydDIpO1xuXG52YXIgX2ltcG9ydDMgPSByZXF1aXJlKCcuL2hhbmRsZWJhcnMvcnVudGltZScpO1xuXG52YXIgcnVudGltZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQzKTtcblxudmFyIF9ub0NvbmZsaWN0ID0gcmVxdWlyZSgnLi9oYW5kbGViYXJzL25vLWNvbmZsaWN0Jyk7XG5cbnZhciBfbm9Db25mbGljdDIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfbm9Db25mbGljdCk7XG5cbi8vIEZvciBjb21wYXRpYmlsaXR5IGFuZCB1c2FnZSBvdXRzaWRlIG9mIG1vZHVsZSBzeXN0ZW1zLCBtYWtlIHRoZSBIYW5kbGViYXJzIG9iamVjdCBhIG5hbWVzcGFjZVxuZnVuY3Rpb24gY3JlYXRlKCkge1xuICB2YXIgaGIgPSBuZXcgYmFzZS5IYW5kbGViYXJzRW52aXJvbm1lbnQoKTtcblxuICBVdGlscy5leHRlbmQoaGIsIGJhc2UpO1xuICBoYi5TYWZlU3RyaW5nID0gX1NhZmVTdHJpbmcyWydkZWZhdWx0J107XG4gIGhiLkV4Y2VwdGlvbiA9IF9FeGNlcHRpb24yWydkZWZhdWx0J107XG4gIGhiLlV0aWxzID0gVXRpbHM7XG4gIGhiLmVzY2FwZUV4cHJlc3Npb24gPSBVdGlscy5lc2NhcGVFeHByZXNzaW9uO1xuXG4gIGhiLlZNID0gcnVudGltZTtcbiAgaGIudGVtcGxhdGUgPSBmdW5jdGlvbiAoc3BlYykge1xuICAgIHJldHVybiBydW50aW1lLnRlbXBsYXRlKHNwZWMsIGhiKTtcbiAgfTtcblxuICByZXR1cm4gaGI7XG59XG5cbnZhciBpbnN0ID0gY3JlYXRlKCk7XG5pbnN0LmNyZWF0ZSA9IGNyZWF0ZTtcblxuX25vQ29uZmxpY3QyWydkZWZhdWx0J10oaW5zdCk7XG5cbmluc3RbJ2RlZmF1bHQnXSA9IGluc3Q7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGluc3Q7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHMuSGFuZGxlYmFyc0Vudmlyb25tZW50ID0gSGFuZGxlYmFyc0Vudmlyb25tZW50O1xuZXhwb3J0cy5jcmVhdGVGcmFtZSA9IGNyZWF0ZUZyYW1lO1xuXG52YXIgX2ltcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIFV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydCk7XG5cbnZhciBfRXhjZXB0aW9uID0gcmVxdWlyZSgnLi9leGNlcHRpb24nKTtcblxudmFyIF9FeGNlcHRpb24yID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX0V4Y2VwdGlvbik7XG5cbnZhciBWRVJTSU9OID0gJzMuMC4xJztcbmV4cG9ydHMuVkVSU0lPTiA9IFZFUlNJT047XG52YXIgQ09NUElMRVJfUkVWSVNJT04gPSA2O1xuXG5leHBvcnRzLkNPTVBJTEVSX1JFVklTSU9OID0gQ09NUElMRVJfUkVWSVNJT047XG52YXIgUkVWSVNJT05fQ0hBTkdFUyA9IHtcbiAgMTogJzw9IDEuMC5yYy4yJywgLy8gMS4wLnJjLjIgaXMgYWN0dWFsbHkgcmV2MiBidXQgZG9lc24ndCByZXBvcnQgaXRcbiAgMjogJz09IDEuMC4wLXJjLjMnLFxuICAzOiAnPT0gMS4wLjAtcmMuNCcsXG4gIDQ6ICc9PSAxLngueCcsXG4gIDU6ICc9PSAyLjAuMC1hbHBoYS54JyxcbiAgNjogJz49IDIuMC4wLWJldGEuMSdcbn07XG5cbmV4cG9ydHMuUkVWSVNJT05fQ0hBTkdFUyA9IFJFVklTSU9OX0NIQU5HRVM7XG52YXIgaXNBcnJheSA9IFV0aWxzLmlzQXJyYXksXG4gICAgaXNGdW5jdGlvbiA9IFV0aWxzLmlzRnVuY3Rpb24sXG4gICAgdG9TdHJpbmcgPSBVdGlscy50b1N0cmluZyxcbiAgICBvYmplY3RUeXBlID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cbmZ1bmN0aW9uIEhhbmRsZWJhcnNFbnZpcm9ubWVudChoZWxwZXJzLCBwYXJ0aWFscykge1xuICB0aGlzLmhlbHBlcnMgPSBoZWxwZXJzIHx8IHt9O1xuICB0aGlzLnBhcnRpYWxzID0gcGFydGlhbHMgfHwge307XG5cbiAgcmVnaXN0ZXJEZWZhdWx0SGVscGVycyh0aGlzKTtcbn1cblxuSGFuZGxlYmFyc0Vudmlyb25tZW50LnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IEhhbmRsZWJhcnNFbnZpcm9ubWVudCxcblxuICBsb2dnZXI6IGxvZ2dlcixcbiAgbG9nOiBsb2csXG5cbiAgcmVnaXN0ZXJIZWxwZXI6IGZ1bmN0aW9uIHJlZ2lzdGVySGVscGVyKG5hbWUsIGZuKSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwobmFtZSkgPT09IG9iamVjdFR5cGUpIHtcbiAgICAgIGlmIChmbikge1xuICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnQXJnIG5vdCBzdXBwb3J0ZWQgd2l0aCBtdWx0aXBsZSBoZWxwZXJzJyk7XG4gICAgICB9XG4gICAgICBVdGlscy5leHRlbmQodGhpcy5oZWxwZXJzLCBuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oZWxwZXJzW25hbWVdID0gZm47XG4gICAgfVxuICB9LFxuICB1bnJlZ2lzdGVySGVscGVyOiBmdW5jdGlvbiB1bnJlZ2lzdGVySGVscGVyKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5oZWxwZXJzW25hbWVdO1xuICB9LFxuXG4gIHJlZ2lzdGVyUGFydGlhbDogZnVuY3Rpb24gcmVnaXN0ZXJQYXJ0aWFsKG5hbWUsIHBhcnRpYWwpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMucGFydGlhbHMsIG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodHlwZW9mIHBhcnRpYWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdBdHRlbXB0aW5nIHRvIHJlZ2lzdGVyIGEgcGFydGlhbCBhcyB1bmRlZmluZWQnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGFydGlhbHNbbmFtZV0gPSBwYXJ0aWFsO1xuICAgIH1cbiAgfSxcbiAgdW5yZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uIHVucmVnaXN0ZXJQYXJ0aWFsKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5wYXJ0aWFsc1tuYW1lXTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcmVnaXN0ZXJEZWZhdWx0SGVscGVycyhpbnN0YW5jZSkge1xuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaGVscGVyTWlzc2luZycsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gQSBtaXNzaW5nIGZpZWxkIGluIGEge3tmb299fSBjb25zdHVjdC5cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNvbWVvbmUgaXMgYWN0dWFsbHkgdHJ5aW5nIHRvIGNhbGwgc29tZXRoaW5nLCBibG93IHVwLlxuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ01pc3NpbmcgaGVscGVyOiBcIicgKyBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdLm5hbWUgKyAnXCInKTtcbiAgICB9XG4gIH0pO1xuXG4gIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdibG9ja0hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBpbnZlcnNlID0gb3B0aW9ucy5pbnZlcnNlLFxuICAgICAgICBmbiA9IG9wdGlvbnMuZm47XG5cbiAgICBpZiAoY29udGV4dCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGZuKHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gZmFsc2UgfHwgY29udGV4dCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcbiAgICAgIGlmIChjb250ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaWRzKSB7XG4gICAgICAgICAgb3B0aW9ucy5pZHMgPSBbb3B0aW9ucy5uYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzLmVhY2goY29udGV4dCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmlkcykge1xuICAgICAgICB2YXIgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMubmFtZSk7XG4gICAgICAgIG9wdGlvbnMgPSB7IGRhdGE6IGRhdGEgfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZuKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ011c3QgcGFzcyBpdGVyYXRvciB0byAjZWFjaCcpO1xuICAgIH1cblxuICAgIHZhciBmbiA9IG9wdGlvbnMuZm4sXG4gICAgICAgIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICByZXQgPSAnJyxcbiAgICAgICAgZGF0YSA9IHVuZGVmaW5lZCxcbiAgICAgICAgY29udGV4dFBhdGggPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG4gICAgICBjb250ZXh0UGF0aCA9IFV0aWxzLmFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5pZHNbMF0pICsgJy4nO1xuICAgIH1cblxuICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7XG4gICAgICBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmRhdGEpIHtcbiAgICAgIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4ZWNJdGVyYXRpb24oZmllbGQsIGluZGV4LCBsYXN0KSB7XG4gICAgICBpZiAoZGF0YSkge1xuICAgICAgICBkYXRhLmtleSA9IGZpZWxkO1xuICAgICAgICBkYXRhLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIGRhdGEuZmlyc3QgPSBpbmRleCA9PT0gMDtcbiAgICAgICAgZGF0YS5sYXN0ID0gISFsYXN0O1xuXG4gICAgICAgIGlmIChjb250ZXh0UGF0aCkge1xuICAgICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBjb250ZXh0UGF0aCArIGZpZWxkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldCA9IHJldCArIGZuKGNvbnRleHRbZmllbGRdLCB7XG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIGJsb2NrUGFyYW1zOiBVdGlscy5ibG9ja1BhcmFtcyhbY29udGV4dFtmaWVsZF0sIGZpZWxkXSwgW2NvbnRleHRQYXRoICsgZmllbGQsIG51bGxdKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQgJiYgdHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgICBmb3IgKHZhciBqID0gY29udGV4dC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICBleGVjSXRlcmF0aW9uKGksIGksIGkgPT09IGNvbnRleHQubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBwcmlvcktleSA9IHVuZGVmaW5lZDtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY29udGV4dCkge1xuICAgICAgICAgIGlmIChjb250ZXh0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIC8vIFdlJ3JlIHJ1bm5pbmcgdGhlIGl0ZXJhdGlvbnMgb25lIHN0ZXAgb3V0IG9mIHN5bmMgc28gd2UgY2FuIGRldGVjdFxuICAgICAgICAgICAgLy8gdGhlIGxhc3QgaXRlcmF0aW9uIHdpdGhvdXQgaGF2ZSB0byBzY2FuIHRoZSBvYmplY3QgdHdpY2UgYW5kIGNyZWF0ZVxuICAgICAgICAgICAgLy8gYW4gaXRlcm1lZGlhdGUga2V5cyBhcnJheS5cbiAgICAgICAgICAgIGlmIChwcmlvcktleSkge1xuICAgICAgICAgICAgICBleGVjSXRlcmF0aW9uKHByaW9yS2V5LCBpIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmlvcktleSA9IGtleTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByaW9yS2V5KSB7XG4gICAgICAgICAgZXhlY0l0ZXJhdGlvbihwcmlvcktleSwgaSAtIDEsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGkgPT09IDApIHtcbiAgICAgIHJldCA9IGludmVyc2UodGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2lmJywgZnVuY3Rpb24gKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY29uZGl0aW9uYWwpKSB7XG4gICAgICBjb25kaXRpb25hbCA9IGNvbmRpdGlvbmFsLmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCBiZWhhdmlvciBpcyB0byByZW5kZXIgdGhlIHBvc2l0aXZlIHBhdGggaWYgdGhlIHZhbHVlIGlzIHRydXRoeSBhbmQgbm90IGVtcHR5LlxuICAgIC8vIFRoZSBgaW5jbHVkZVplcm9gIG9wdGlvbiBtYXkgYmUgc2V0IHRvIHRyZWF0IHRoZSBjb25kdGlvbmFsIGFzIHB1cmVseSBub3QgZW1wdHkgYmFzZWQgb24gdGhlXG4gICAgLy8gYmVoYXZpb3Igb2YgaXNFbXB0eS4gRWZmZWN0aXZlbHkgdGhpcyBkZXRlcm1pbmVzIGlmIDAgaXMgaGFuZGxlZCBieSB0aGUgcG9zaXRpdmUgcGF0aCBvciBuZWdhdGl2ZS5cbiAgICBpZiAoIW9wdGlvbnMuaGFzaC5pbmNsdWRlWmVybyAmJiAhY29uZGl0aW9uYWwgfHwgVXRpbHMuaXNFbXB0eShjb25kaXRpb25hbCkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICAgIH1cbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIGZ1bmN0aW9uIChjb25kaXRpb25hbCwgb3B0aW9ucykge1xuICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzWydpZiddLmNhbGwodGhpcywgY29uZGl0aW9uYWwsIHsgZm46IG9wdGlvbnMuaW52ZXJzZSwgaW52ZXJzZTogb3B0aW9ucy5mbiwgaGFzaDogb3B0aW9ucy5oYXNoIH0pO1xuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignd2l0aCcsIGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHtcbiAgICAgIGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgdmFyIGZuID0gb3B0aW9ucy5mbjtcblxuICAgIGlmICghVXRpbHMuaXNFbXB0eShjb250ZXh0KSkge1xuICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmlkcykge1xuICAgICAgICB2YXIgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG4gICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMuaWRzWzBdKTtcbiAgICAgICAgb3B0aW9ucyA9IHsgZGF0YTogZGF0YSB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZm4oY29udGV4dCwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG4gICAgfVxuICB9KTtcblxuICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9nJywgZnVuY3Rpb24gKG1lc3NhZ2UsIG9wdGlvbnMpIHtcbiAgICB2YXIgbGV2ZWwgPSBvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5kYXRhLmxldmVsICE9IG51bGwgPyBwYXJzZUludChvcHRpb25zLmRhdGEubGV2ZWwsIDEwKSA6IDE7XG4gICAgaW5zdGFuY2UubG9nKGxldmVsLCBtZXNzYWdlKTtcbiAgfSk7XG5cbiAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2xvb2t1cCcsIGZ1bmN0aW9uIChvYmosIGZpZWxkKSB7XG4gICAgcmV0dXJuIG9iaiAmJiBvYmpbZmllbGRdO1xuICB9KTtcbn1cblxudmFyIGxvZ2dlciA9IHtcbiAgbWV0aG9kTWFwOiB7IDA6ICdkZWJ1ZycsIDE6ICdpbmZvJywgMjogJ3dhcm4nLCAzOiAnZXJyb3InIH0sXG5cbiAgLy8gU3RhdGUgZW51bVxuICBERUJVRzogMCxcbiAgSU5GTzogMSxcbiAgV0FSTjogMixcbiAgRVJST1I6IDMsXG4gIGxldmVsOiAxLFxuXG4gIC8vIENhbiBiZSBvdmVycmlkZGVuIGluIHRoZSBob3N0IGVudmlyb25tZW50XG4gIGxvZzogZnVuY3Rpb24gbG9nKGxldmVsLCBtZXNzYWdlKSB7XG4gICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBsb2dnZXIubGV2ZWwgPD0gbGV2ZWwpIHtcbiAgICAgIHZhciBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcbiAgICAgIChjb25zb2xlW21ldGhvZF0gfHwgY29uc29sZS5sb2cpLmNhbGwoY29uc29sZSwgbWVzc2FnZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0cy5sb2dnZXIgPSBsb2dnZXI7XG52YXIgbG9nID0gbG9nZ2VyLmxvZztcblxuZXhwb3J0cy5sb2cgPSBsb2c7XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyYW1lKG9iamVjdCkge1xuICB2YXIgZnJhbWUgPSBVdGlscy5leHRlbmQoe30sIG9iamVjdCk7XG4gIGZyYW1lLl9wYXJlbnQgPSBvYmplY3Q7XG4gIHJldHVybiBmcmFtZTtcbn1cblxuLyogW2FyZ3MsIF1vcHRpb25zICovIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cbmZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlLCBub2RlKSB7XG4gIHZhciBsb2MgPSBub2RlICYmIG5vZGUubG9jLFxuICAgICAgbGluZSA9IHVuZGVmaW5lZCxcbiAgICAgIGNvbHVtbiA9IHVuZGVmaW5lZDtcbiAgaWYgKGxvYykge1xuICAgIGxpbmUgPSBsb2Muc3RhcnQubGluZTtcbiAgICBjb2x1bW4gPSBsb2Muc3RhcnQuY29sdW1uO1xuXG4gICAgbWVzc2FnZSArPSAnIC0gJyArIGxpbmUgKyAnOicgKyBjb2x1bW47XG4gIH1cblxuICB2YXIgdG1wID0gRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgLy8gVW5mb3J0dW5hdGVseSBlcnJvcnMgYXJlIG5vdCBlbnVtZXJhYmxlIGluIENocm9tZSAoYXQgbGVhc3QpLCBzbyBgZm9yIHByb3AgaW4gdG1wYCBkb2Vzbid0IHdvcmsuXG4gIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGVycm9yUHJvcHMubGVuZ3RoOyBpZHgrKykge1xuICAgIHRoaXNbZXJyb3JQcm9wc1tpZHhdXSA9IHRtcFtlcnJvclByb3BzW2lkeF1dO1xuICB9XG5cbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgRXhjZXB0aW9uKTtcbiAgfVxuXG4gIGlmIChsb2MpIHtcbiAgICB0aGlzLmxpbmVOdW1iZXIgPSBsaW5lO1xuICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICB9XG59XG5cbkV4Y2VwdGlvbi5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gRXhjZXB0aW9uO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuLypnbG9iYWwgd2luZG93ICovXG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGZ1bmN0aW9uIChIYW5kbGViYXJzKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHZhciByb290ID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB3aW5kb3csXG4gICAgICAkSGFuZGxlYmFycyA9IHJvb3QuSGFuZGxlYmFycztcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgSGFuZGxlYmFycy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChyb290LkhhbmRsZWJhcnMgPT09IEhhbmRsZWJhcnMpIHtcbiAgICAgIHJvb3QuSGFuZGxlYmFycyA9ICRIYW5kbGViYXJzO1xuICAgIH1cbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbTV2WkdWZmJXOWtkV3hsY3k5b1lXNWtiR1ZpWVhKekwyUnBjM1F2WTJwekwyaGhibVJzWldKaGNuTXZibTh0WTI5dVpteHBZM1F1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVNJc0ltWnBiR1VpT2lKblpXNWxjbUYwWldRdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lKM1Z6WlNCemRISnBZM1FuTzF4dVhHNWxlSEJ2Y25SekxsOWZaWE5OYjJSMWJHVWdQU0IwY25WbE8xeHVMeXBuYkc5aVlXd2dkMmx1Wkc5M0lDb3ZYRzVjYm1WNGNHOXlkSE5iSjJSbFptRjFiSFFuWFNBOUlHWjFibU4wYVc5dUlDaElZVzVrYkdWaVlYSnpLU0I3WEc0Z0lDOHFJR2x6ZEdGdVluVnNJR2xuYm05eVpTQnVaWGgwSUNvdlhHNGdJSFpoY2lCeWIyOTBJRDBnZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnSjNWdVpHVm1hVzVsWkNjZ1B5Qm5iRzlpWVd3Z09pQjNhVzVrYjNjc1hHNGdJQ0FnSUNBa1NHRnVaR3hsWW1GeWN5QTlJSEp2YjNRdVNHRnVaR3hsWW1GeWN6dGNiaUFnTHlvZ2FYTjBZVzVpZFd3Z2FXZHViM0psSUc1bGVIUWdLaTljYmlBZ1NHRnVaR3hsWW1GeWN5NXViME52Ym1ac2FXTjBJRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUdsbUlDaHliMjkwTGtoaGJtUnNaV0poY25NZ1BUMDlJRWhoYm1Sc1pXSmhjbk1wSUh0Y2JpQWdJQ0FnSUhKdmIzUXVTR0Z1Wkd4bFltRnljeUE5SUNSSVlXNWtiR1ZpWVhKek8xeHVJQ0FnSUgxY2JpQWdmVHRjYm4wN1hHNWNibTF2WkhWc1pTNWxlSEJ2Y25SeklEMGdaWGh3YjNKMGMxc25aR1ZtWVhWc2RDZGRPeUpkZlE9PSIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5jaGVja1JldmlzaW9uID0gY2hlY2tSZXZpc2lvbjtcblxuLy8gVE9ETzogUmVtb3ZlIHRoaXMgbGluZSBhbmQgYnJlYWsgdXAgY29tcGlsZVBhcnRpYWxcblxuZXhwb3J0cy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuZXhwb3J0cy53cmFwUHJvZ3JhbSA9IHdyYXBQcm9ncmFtO1xuZXhwb3J0cy5yZXNvbHZlUGFydGlhbCA9IHJlc29sdmVQYXJ0aWFsO1xuZXhwb3J0cy5pbnZva2VQYXJ0aWFsID0gaW52b2tlUGFydGlhbDtcbmV4cG9ydHMubm9vcCA9IG5vb3A7XG5cbnZhciBfaW1wb3J0ID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0KTtcblxudmFyIF9FeGNlcHRpb24gPSByZXF1aXJlKCcuL2V4Y2VwdGlvbicpO1xuXG52YXIgX0V4Y2VwdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfRXhjZXB0aW9uKTtcblxudmFyIF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lID0gcmVxdWlyZSgnLi9iYXNlJyk7XG5cbmZ1bmN0aW9uIGNoZWNrUmV2aXNpb24oY29tcGlsZXJJbmZvKSB7XG4gIHZhciBjb21waWxlclJldmlzaW9uID0gY29tcGlsZXJJbmZvICYmIGNvbXBpbGVySW5mb1swXSB8fCAxLFxuICAgICAgY3VycmVudFJldmlzaW9uID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuQ09NUElMRVJfUkVWSVNJT047XG5cbiAgaWYgKGNvbXBpbGVyUmV2aXNpb24gIT09IGN1cnJlbnRSZXZpc2lvbikge1xuICAgIGlmIChjb21waWxlclJldmlzaW9uIDwgY3VycmVudFJldmlzaW9uKSB7XG4gICAgICB2YXIgcnVudGltZVZlcnNpb25zID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuUkVWSVNJT05fQ0hBTkdFU1tjdXJyZW50UmV2aXNpb25dLFxuICAgICAgICAgIGNvbXBpbGVyVmVyc2lvbnMgPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5SRVZJU0lPTl9DSEFOR0VTW2NvbXBpbGVyUmV2aXNpb25dO1xuICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RlbXBsYXRlIHdhcyBwcmVjb21waWxlZCB3aXRoIGFuIG9sZGVyIHZlcnNpb24gb2YgSGFuZGxlYmFycyB0aGFuIHRoZSBjdXJyZW50IHJ1bnRpbWUuICcgKyAnUGxlYXNlIHVwZGF0ZSB5b3VyIHByZWNvbXBpbGVyIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIHJ1bnRpbWVWZXJzaW9ucyArICcpIG9yIGRvd25ncmFkZSB5b3VyIHJ1bnRpbWUgdG8gYW4gb2xkZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVyVmVyc2lvbnMgKyAnKS4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVXNlIHRoZSBlbWJlZGRlZCB2ZXJzaW9uIGluZm8gc2luY2UgdGhlIHJ1bnRpbWUgZG9lc24ndCBrbm93IGFib3V0IHRoaXMgcmV2aXNpb24geWV0XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYSBuZXdlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiAnICsgJ1BsZWFzZSB1cGRhdGUgeW91ciBydW50aW1lIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVySW5mb1sxXSArICcpLicpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZSh0ZW1wbGF0ZVNwZWMsIGVudikge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAoIWVudikge1xuICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdObyBlbnZpcm9ubWVudCBwYXNzZWQgdG8gdGVtcGxhdGUnKTtcbiAgfVxuICBpZiAoIXRlbXBsYXRlU3BlYyB8fCAhdGVtcGxhdGVTcGVjLm1haW4pIHtcbiAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVW5rbm93biB0ZW1wbGF0ZSBvYmplY3Q6ICcgKyB0eXBlb2YgdGVtcGxhdGVTcGVjKTtcbiAgfVxuXG4gIC8vIE5vdGU6IFVzaW5nIGVudi5WTSByZWZlcmVuY2VzIHJhdGhlciB0aGFuIGxvY2FsIHZhciByZWZlcmVuY2VzIHRocm91Z2hvdXQgdGhpcyBzZWN0aW9uIHRvIGFsbG93XG4gIC8vIGZvciBleHRlcm5hbCB1c2VycyB0byBvdmVycmlkZSB0aGVzZSBhcyBwc3VlZG8tc3VwcG9ydGVkIEFQSXMuXG4gIGVudi5WTS5jaGVja1JldmlzaW9uKHRlbXBsYXRlU3BlYy5jb21waWxlcik7XG5cbiAgZnVuY3Rpb24gaW52b2tlUGFydGlhbFdyYXBwZXIocGFydGlhbCwgY29udGV4dCwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmhhc2gpIHtcbiAgICAgIGNvbnRleHQgPSBVdGlscy5leHRlbmQoe30sIGNvbnRleHQsIG9wdGlvbnMuaGFzaCk7XG4gICAgfVxuXG4gICAgcGFydGlhbCA9IGVudi5WTS5yZXNvbHZlUGFydGlhbC5jYWxsKHRoaXMsIHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIHZhciByZXN1bHQgPSBlbnYuVk0uaW52b2tlUGFydGlhbC5jYWxsKHRoaXMsIHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpO1xuXG4gICAgaWYgKHJlc3VsdCA9PSBudWxsICYmIGVudi5jb21waWxlKSB7XG4gICAgICBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV0gPSBlbnYuY29tcGlsZShwYXJ0aWFsLCB0ZW1wbGF0ZVNwZWMuY29tcGlsZXJPcHRpb25zLCBlbnYpO1xuICAgICAgcmVzdWx0ID0gb3B0aW9ucy5wYXJ0aWFsc1tvcHRpb25zLm5hbWVdKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0ICE9IG51bGwpIHtcbiAgICAgIGlmIChvcHRpb25zLmluZGVudCkge1xuICAgICAgICB2YXIgbGluZXMgPSByZXN1bHQuc3BsaXQoJ1xcbicpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpbmVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIGlmICghbGluZXNbaV0gJiYgaSArIDEgPT09IGwpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpbmVzW2ldID0gb3B0aW9ucy5pbmRlbnQgKyBsaW5lc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBsaW5lcy5qb2luKCdcXG4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUaGUgcGFydGlhbCAnICsgb3B0aW9ucy5uYW1lICsgJyBjb3VsZCBub3QgYmUgY29tcGlsZWQgd2hlbiBydW5uaW5nIGluIHJ1bnRpbWUtb25seSBtb2RlJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gSnVzdCBhZGQgd2F0ZXJcbiAgdmFyIGNvbnRhaW5lciA9IHtcbiAgICBzdHJpY3Q6IGZ1bmN0aW9uIHN0cmljdChvYmosIG5hbWUpIHtcbiAgICAgIGlmICghKG5hbWUgaW4gb2JqKSkge1xuICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnXCInICsgbmFtZSArICdcIiBub3QgZGVmaW5lZCBpbiAnICsgb2JqKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmpbbmFtZV07XG4gICAgfSxcbiAgICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChkZXB0aHMsIG5hbWUpIHtcbiAgICAgIHZhciBsZW4gPSBkZXB0aHMubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAoZGVwdGhzW2ldICYmIGRlcHRoc1tpXVtuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGRlcHRoc1tpXVtuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgbGFtYmRhOiBmdW5jdGlvbiBsYW1iZGEoY3VycmVudCwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiBjdXJyZW50ID09PSAnZnVuY3Rpb24nID8gY3VycmVudC5jYWxsKGNvbnRleHQpIDogY3VycmVudDtcbiAgICB9LFxuXG4gICAgZXNjYXBlRXhwcmVzc2lvbjogVXRpbHMuZXNjYXBlRXhwcmVzc2lvbixcbiAgICBpbnZva2VQYXJ0aWFsOiBpbnZva2VQYXJ0aWFsV3JhcHBlcixcblxuICAgIGZuOiBmdW5jdGlvbiBmbihpKSB7XG4gICAgICByZXR1cm4gdGVtcGxhdGVTcGVjW2ldO1xuICAgIH0sXG5cbiAgICBwcm9ncmFtczogW10sXG4gICAgcHJvZ3JhbTogZnVuY3Rpb24gcHJvZ3JhbShpLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG4gICAgICB2YXIgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldLFxuICAgICAgICAgIGZuID0gdGhpcy5mbihpKTtcbiAgICAgIGlmIChkYXRhIHx8IGRlcHRocyB8fCBibG9ja1BhcmFtcyB8fCBkZWNsYXJlZEJsb2NrUGFyYW1zKSB7XG4gICAgICAgIHByb2dyYW1XcmFwcGVyID0gd3JhcFByb2dyYW0odGhpcywgaSwgZm4sIGRhdGEsIGRlY2xhcmVkQmxvY2tQYXJhbXMsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuICAgICAgfSBlbHNlIGlmICghcHJvZ3JhbVdyYXBwZXIpIHtcbiAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldID0gd3JhcFByb2dyYW0odGhpcywgaSwgZm4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb2dyYW1XcmFwcGVyO1xuICAgIH0sXG5cbiAgICBkYXRhOiBmdW5jdGlvbiBkYXRhKHZhbHVlLCBkZXB0aCkge1xuICAgICAgd2hpbGUgKHZhbHVlICYmIGRlcHRoLS0pIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5fcGFyZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG4gICAgbWVyZ2U6IGZ1bmN0aW9uIG1lcmdlKHBhcmFtLCBjb21tb24pIHtcbiAgICAgIHZhciBvYmogPSBwYXJhbSB8fCBjb21tb247XG5cbiAgICAgIGlmIChwYXJhbSAmJiBjb21tb24gJiYgcGFyYW0gIT09IGNvbW1vbikge1xuICAgICAgICBvYmogPSBVdGlscy5leHRlbmQoe30sIGNvbW1vbiwgcGFyYW0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICBub29wOiBlbnYuVk0ubm9vcCxcbiAgICBjb21waWxlckluZm86IHRlbXBsYXRlU3BlYy5jb21waWxlclxuICB9O1xuXG4gIGZ1bmN0aW9uIHJldChjb250ZXh0KSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG4gICAgdmFyIGRhdGEgPSBvcHRpb25zLmRhdGE7XG5cbiAgICByZXQuX3NldHVwKG9wdGlvbnMpO1xuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsICYmIHRlbXBsYXRlU3BlYy51c2VEYXRhKSB7XG4gICAgICBkYXRhID0gaW5pdERhdGEoY29udGV4dCwgZGF0YSk7XG4gICAgfVxuICAgIHZhciBkZXB0aHMgPSB1bmRlZmluZWQsXG4gICAgICAgIGJsb2NrUGFyYW1zID0gdGVtcGxhdGVTcGVjLnVzZUJsb2NrUGFyYW1zID8gW10gOiB1bmRlZmluZWQ7XG4gICAgaWYgKHRlbXBsYXRlU3BlYy51c2VEZXB0aHMpIHtcbiAgICAgIGRlcHRocyA9IG9wdGlvbnMuZGVwdGhzID8gW2NvbnRleHRdLmNvbmNhdChvcHRpb25zLmRlcHRocykgOiBbY29udGV4dF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHRlbXBsYXRlU3BlYy5tYWluLmNhbGwoY29udGFpbmVyLCBjb250ZXh0LCBjb250YWluZXIuaGVscGVycywgY29udGFpbmVyLnBhcnRpYWxzLCBkYXRhLCBibG9ja1BhcmFtcywgZGVwdGhzKTtcbiAgfVxuICByZXQuaXNUb3AgPSB0cnVlO1xuXG4gIHJldC5fc2V0dXAgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG4gICAgICBjb250YWluZXIuaGVscGVycyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLmhlbHBlcnMsIGVudi5oZWxwZXJzKTtcblxuICAgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VQYXJ0aWFsKSB7XG4gICAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLnBhcnRpYWxzLCBlbnYucGFydGlhbHMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb250YWluZXIuaGVscGVycyA9IG9wdGlvbnMuaGVscGVycztcbiAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IG9wdGlvbnMucGFydGlhbHM7XG4gICAgfVxuICB9O1xuXG4gIHJldC5fY2hpbGQgPSBmdW5jdGlvbiAoaSwgZGF0YSwgYmxvY2tQYXJhbXMsIGRlcHRocykge1xuICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlQmxvY2tQYXJhbXMgJiYgIWJsb2NrUGFyYW1zKSB7XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIGJsb2NrIHBhcmFtcycpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGVTcGVjLnVzZURlcHRocyAmJiAhZGVwdGhzKSB7XG4gICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIHBhcmVudCBkZXB0aHMnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gd3JhcFByb2dyYW0oY29udGFpbmVyLCBpLCB0ZW1wbGF0ZVNwZWNbaV0sIGRhdGEsIDAsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuICB9O1xuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiB3cmFwUHJvZ3JhbShjb250YWluZXIsIGksIGZuLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG4gIGZ1bmN0aW9uIHByb2coY29udGV4dCkge1xuICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1sxXTtcblxuICAgIHJldHVybiBmbi5jYWxsKGNvbnRhaW5lciwgY29udGV4dCwgY29udGFpbmVyLmhlbHBlcnMsIGNvbnRhaW5lci5wYXJ0aWFscywgb3B0aW9ucy5kYXRhIHx8IGRhdGEsIGJsb2NrUGFyYW1zICYmIFtvcHRpb25zLmJsb2NrUGFyYW1zXS5jb25jYXQoYmxvY2tQYXJhbXMpLCBkZXB0aHMgJiYgW2NvbnRleHRdLmNvbmNhdChkZXB0aHMpKTtcbiAgfVxuICBwcm9nLnByb2dyYW0gPSBpO1xuICBwcm9nLmRlcHRoID0gZGVwdGhzID8gZGVwdGhzLmxlbmd0aCA6IDA7XG4gIHByb2cuYmxvY2tQYXJhbXMgPSBkZWNsYXJlZEJsb2NrUGFyYW1zIHx8IDA7XG4gIHJldHVybiBwcm9nO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlUGFydGlhbChwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gIGlmICghcGFydGlhbCkge1xuICAgIHBhcnRpYWwgPSBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV07XG4gIH0gZWxzZSBpZiAoIXBhcnRpYWwuY2FsbCAmJiAhb3B0aW9ucy5uYW1lKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWMgcGFydGlhbCB0aGF0IHJldHVybmVkIGEgc3RyaW5nXG4gICAgb3B0aW9ucy5uYW1lID0gcGFydGlhbDtcbiAgICBwYXJ0aWFsID0gb3B0aW9ucy5wYXJ0aWFsc1twYXJ0aWFsXTtcbiAgfVxuICByZXR1cm4gcGFydGlhbDtcbn1cblxuZnVuY3Rpb24gaW52b2tlUGFydGlhbChwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMucGFydGlhbCA9IHRydWU7XG5cbiAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUaGUgcGFydGlhbCAnICsgb3B0aW9ucy5uYW1lICsgJyBjb3VsZCBub3QgYmUgZm91bmQnKTtcbiAgfSBlbHNlIGlmIChwYXJ0aWFsIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gcGFydGlhbChjb250ZXh0LCBvcHRpb25zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBub29wKCkge1xuICByZXR1cm4gJyc7XG59XG5cbmZ1bmN0aW9uIGluaXREYXRhKGNvbnRleHQsIGRhdGEpIHtcbiAgaWYgKCFkYXRhIHx8ICEoJ3Jvb3QnIGluIGRhdGEpKSB7XG4gICAgZGF0YSA9IGRhdGEgPyBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5jcmVhdGVGcmFtZShkYXRhKSA6IHt9O1xuICAgIGRhdGEucm9vdCA9IGNvbnRleHQ7XG4gIH1cbiAgcmV0dXJuIGRhdGE7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuLy8gQnVpbGQgb3V0IG91ciBiYXNpYyBTYWZlU3RyaW5nIHR5cGVcbmZ1bmN0aW9uIFNhZmVTdHJpbmcoc3RyaW5nKSB7XG4gIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xufVxuXG5TYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IFNhZmVTdHJpbmcucHJvdG90eXBlLnRvSFRNTCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICcnICsgdGhpcy5zdHJpbmc7XG59O1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBTYWZlU3RyaW5nO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7XG5cbi8vIE9sZGVyIElFIHZlcnNpb25zIGRvIG5vdCBkaXJlY3RseSBzdXBwb3J0IGluZGV4T2Ygc28gd2UgbXVzdCBpbXBsZW1lbnQgb3VyIG93biwgc2FkbHkuXG5leHBvcnRzLmluZGV4T2YgPSBpbmRleE9mO1xuZXhwb3J0cy5lc2NhcGVFeHByZXNzaW9uID0gZXNjYXBlRXhwcmVzc2lvbjtcbmV4cG9ydHMuaXNFbXB0eSA9IGlzRW1wdHk7XG5leHBvcnRzLmJsb2NrUGFyYW1zID0gYmxvY2tQYXJhbXM7XG5leHBvcnRzLmFwcGVuZENvbnRleHRQYXRoID0gYXBwZW5kQ29udGV4dFBhdGg7XG52YXIgZXNjYXBlID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90OycsXG4gICdcXCcnOiAnJiN4Mjc7JyxcbiAgJ2AnOiAnJiN4NjA7J1xufTtcblxudmFyIGJhZENoYXJzID0gL1smPD5cIidgXS9nLFxuICAgIHBvc3NpYmxlID0gL1smPD5cIidgXS87XG5cbmZ1bmN0aW9uIGVzY2FwZUNoYXIoY2hyKSB7XG4gIHJldHVybiBlc2NhcGVbY2hyXTtcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKG9iaiAvKiAsIC4uLnNvdXJjZSAqLykge1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGZvciAodmFyIGtleSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXJndW1lbnRzW2ldLCBrZXkpKSB7XG4gICAgICAgIG9ialtrZXldID0gYXJndW1lbnRzW2ldW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn1cblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuZXhwb3J0cy50b1N0cmluZyA9IHRvU3RyaW5nO1xuLy8gU291cmNlZCBmcm9tIGxvZGFzaFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Jlc3RpZWpzL2xvZGFzaC9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dFxuLyplc2xpbnQtZGlzYWJsZSBmdW5jLXN0eWxlLCBuby12YXIgKi9cbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufTtcbi8vIGZhbGxiYWNrIGZvciBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaVxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmlmIChpc0Z1bmN0aW9uKC94LykpIHtcbiAgZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG4gIH07XG59XG52YXIgaXNGdW5jdGlvbjtcbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG4vKmVzbGludC1lbmFibGUgZnVuYy1zdHlsZSwgbm8tdmFyICovXG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcbn07ZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaW5kZXhPZihhcnJheSwgdmFsdWUpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGFycmF5W2ldID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlRXhwcmVzc2lvbihzdHJpbmcpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gZG9uJ3QgZXNjYXBlIFNhZmVTdHJpbmdzLCBzaW5jZSB0aGV5J3JlIGFscmVhZHkgc2FmZVxuICAgIGlmIChzdHJpbmcgJiYgc3RyaW5nLnRvSFRNTCkge1xuICAgICAgcmV0dXJuIHN0cmluZy50b0hUTUwoKTtcbiAgICB9IGVsc2UgaWYgKHN0cmluZyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfSBlbHNlIGlmICghc3RyaW5nKSB7XG4gICAgICByZXR1cm4gc3RyaW5nICsgJyc7XG4gICAgfVxuXG4gICAgLy8gRm9yY2UgYSBzdHJpbmcgY29udmVyc2lvbiBhcyB0aGlzIHdpbGwgYmUgZG9uZSBieSB0aGUgYXBwZW5kIHJlZ2FyZGxlc3MgYW5kXG4gICAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG4gICAgLy8gYW4gb2JqZWN0J3MgdG8gc3RyaW5nIGhhcyBlc2NhcGVkIGNoYXJhY3RlcnMgaW4gaXQuXG4gICAgc3RyaW5nID0gJycgKyBzdHJpbmc7XG4gIH1cblxuICBpZiAoIXBvc3NpYmxlLnRlc3Qoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmc7XG4gIH1cbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKGJhZENoYXJzLCBlc2NhcGVDaGFyKTtcbn1cblxuZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICBpZiAoIXZhbHVlICYmIHZhbHVlICE9PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJsb2NrUGFyYW1zKHBhcmFtcywgaWRzKSB7XG4gIHBhcmFtcy5wYXRoID0gaWRzO1xuICByZXR1cm4gcGFyYW1zO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRDb250ZXh0UGF0aChjb250ZXh0UGF0aCwgaWQpIHtcbiAgcmV0dXJuIChjb250ZXh0UGF0aCA/IGNvbnRleHRQYXRoICsgJy4nIDogJycpICsgaWQ7XG59IiwiLy8gQ3JlYXRlIGEgc2ltcGxlIHBhdGggYWxpYXMgdG8gYWxsb3cgYnJvd3NlcmlmeSB0byByZXNvbHZlXG4vLyB0aGUgcnVudGltZSBvbiBhIHN1cHBvcnRlZCBwYXRoLlxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2Rpc3QvY2pzL2hhbmRsZWJhcnMucnVudGltZScpWydkZWZhdWx0J107XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJoYW5kbGViYXJzL3J1bnRpbWVcIilbXCJkZWZhdWx0XCJdO1xuIiwidmFyIHRlbXBsYXRlLCBBcHBMYXlvdXQ7XG5cbnRlbXBsYXRlID0gcmVxdWlyZSgnLi9sYXlvdXQnKTtcbi8qKlxuICogQXBwIExheW91dFxuICovXG5BcHBMYXlvdXQgPSBNYXJpb25ldHRlLkxheW91dFZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICBlbDogJ2JvZHknLFxuICByZWdpb25zOiB7XG4gICAgbWFpbiAgOiAnI21haW4nLFxuICAgIG1lbnUgIDogJyNtZW51J1xuICB9XG59KTtcbm1vZHVsZS5leHBvcnRzID0gQXBwTGF5b3V0O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBuZXcgTWFyaW9uZXR0ZS5BcHBsaWNhdGlvbigpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5XcmVxci5yYWRpby5jaGFubmVsKCdldmVudHMnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuV3JlcXIucmFkaW8uY2hhbm5lbCgnbWVudScpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5XcmVxci5yYWRpby5jaGFubmVsKCdwcmVzZW50ZXInKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuV3JlcXIucmFkaW8uY2hhbm5lbCgndHJlbmRzJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXBpOiB7XG4gICAgdXJsIDogJ19fYXBpX18nXG4gIH0sXG4gIG1heF9yb3dzOiA2LFxuICBtYXhfY29sdW1uczogNixcbiAgbWluX2RlbGF5OiA1MDAwLFxuICBtYXhfZGVsYXk6IDE1MDAwXG59O1xuIiwidmFyIG1haW4gICAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9tYWluJyksXG4gICAgbWVudSAgICAgID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NvbnRyb2xsZXJzL21lbnUnKSxcbiAgICBwcmVzZW50ZXIgICAgID0gcmVxdWlyZSgnLi9jb21tb25zL2NoYW5uZWxzL3ByZXNlbnRlcicpLFxuICAgIHJvdXRlcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9yb3V0ZXMnKSxcbiAgICBldmVudHMgICAgICAgID0gcmVxdWlyZSgnLi9jb21tb25zL2NoYW5uZWxzL2V2ZW50cycpLFxuICAgIEFwcENvbnRyb2xsZXI7XG5cbkFwcENvbnRyb2xsZXIgPSBNYXJpb25ldHRlLk9iamVjdC5leHRlbmQoe1xuICBhcHA6IG51bGwsXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGFwcGxpY2F0aW9uIGZvciBjb250cm9sbGVyXG4gICAqIEBwYXJhbSBhcHAgTWFyaW9uZXR0ZS5BcHBsaWNhdGlvblxuICAgKi9cbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHByZXNlbnRlci5yZXFyZXMuc2V0SGFuZGxlcihcImxheW91dFwiLCB0aGlzLmdldEFwcExheW91dC5iaW5kKHRoaXMpKTtcbiAgfSxcbiAgLyoqXG4gICAqIEdldHMgdGhlIGFwcGxpY2F0aW9uIExheW91dFxuICAgKiBAcmV0dXJuIE1hcmlvbmV0dGUuTGF5b3V0Vmlld1xuICAgKi9cbiAgZ2V0QXBwTGF5b3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXBwLmxheW91dDtcbiAgfSxcbiAgLyoqXG4gICAqIFN0YXJ0IG9mIGFwcGxpY2F0aW9uXG4gICAqL1xuICBzdGFydDogZnVuY3Rpb24gKGFwcCwgcm91dGVyKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5yb3V0ZXIgPSByb3V0ZXI7XG4gICAgbWFpbi5zdGFydCh0aGlzLnJvdXRlcik7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcENvbnRyb2xsZXI7XG4iLCJ2YXIgbWVudUNoYW5uZWwgPSByZXF1aXJlKCcuLi9jb21tb25zL2NoYW5uZWxzL21lbnUnKSxcbiAgICBhcHBDb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKSxcbiAgICB0cmVuZHNDaGFubmVsID0gcmVxdWlyZSgnLi4vY29tbW9ucy9jaGFubmVscy90cmVuZHMnKSxcbiAgICBNZW51TW9kZWw7XG5cbk1lbnVNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XG4gIGRlZmF1bHRzOiB7XG4gICAgcm93czogMSxcbiAgICBjb2xzOiAxXG4gIH0sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICBtZW51Q2hhbm5lbC5jb21tYW5kcy5zZXRIYW5kbGVyKCdjaGFuZ2U6c2l6ZScsIHRoaXMuY2hhbmdlVHJlbmRzU2l6ZS5iaW5kKHRoaXMpKTtcbiAgICBtZW51Q2hhbm5lbC5yZXFyZXMuc2V0SGFuZGxlcignc2l6ZScsIHRoaXMuZ2V0U2l6ZS5iaW5kKHRoaXMpKTtcbiAgfSxcbiAgZ2V0U2l6ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb2xzOiB0aGlzLmdldCgnY29scycpLFxuICAgICAgcm93czogdGhpcy5nZXQoJ3Jvd3MnKVxuICAgIH07XG4gIH0sXG4gIGNoYW5nZVRyZW5kc1NpemU6IGZ1bmN0aW9uIChzaXplKSB7XG4gICAgdmFyIGNvbHMgPSBzaXplID8gc2l6ZS5jb2xzIDogMCxcbiAgICAgICAgcm93cyA9IHNpemUgPyBzaXplLnJvd3MgOiAwO1xuICAgIC8vQ29udHJvbCBNaW4gVmFsdWVzXG4gICAgaWYgKGNvbHMgPCAxKSB7XG4gICAgICBjb2xzID0gMTtcbiAgICB9XG4gICAgaWYgKHJvd3MgPCAxKSB7XG4gICAgICByb3dzID0gMTtcbiAgICB9XG4gICAgLy9Db250cm9sIE1heCBWYWx1ZXNcbiAgICBpZiAoY29scyA+IGFwcENvbmZpZy5tYXhfY29sdW1ucykge1xuICAgICAgY29scyA9IGFwcENvbmZpZy5ncmlkLm1heF9jb2x1bW5zO1xuICAgIH1cbiAgICBpZiAocm93cyA+IGFwcENvbmZpZy5tYXhfcm93cykge1xuICAgICAgcm93cyA9IGFwcENvbmZpZy5ncmlkLm1heF9yb3dzO1xuICAgIH1cblxuICAgIHRoaXMuc2V0KCdyb3dzJywgcm93cyk7XG4gICAgdGhpcy5zZXQoJ2NvbHMnLCBjb2xzKTtcblxuICAgIHRyZW5kc0NoYW5uZWwudmVudC50cmlnZ2VyKCdncmlkOmNoYW5nZWQnLCB0aGlzLnRvSlNPTigpKTtcbiAgfVxufSk7XG5tb2R1bGUuZXhwb3J0cyA9IE1lbnVNb2RlbDtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzQ29tcGlsZXIgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnNDb21waWxlci50ZW1wbGF0ZSh7XCJjb21waWxlclwiOls2LFwiPj0gMi4wLjAtYmV0YS4xXCJdLFwibWFpblwiOmZ1bmN0aW9uKGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICByZXR1cm4gXCI8ZGl2IGlkPVxcXCJtZW51XFxcIiBjbGFzcz1cXFwibWVudS1yZWdpb24tY29udGFpbmVyXFxcIj48L2Rpdj5cXG48ZGl2IGlkPVxcXCJtYWluXFxcIiBjbGFzcz1cXFwibWFpbi1yZWdpb24tY29udGFpbmVyXFxcIj48L2Rpdj5cXG5cIjtcbn0sXCJ1c2VEYXRhXCI6dHJ1ZX0pO1xuIiwidmFyIG1vY2sgPSBbXSxcbiAgICBjYXRlZ29yaWVzID0gW1xuICAgICAgJ2FydHMnLFxuICAgICAgJ2VudGVydGFpbm1lbnQnLFxuICAgICAgJ2dlb2dyYXBoeScsXG4gICAgICAnaGlzdG9yeScsXG4gICAgICAnc2NpZW5jZScsXG4gICAgICAnc3BvcnRzJ1xuICAgIF07XG5cbmZvciAodmFyIGkgPSAwOyBpIDwgMTAwMDsgaSsrKSB7XG4gIG1vY2sucHVzaCh7XG4gICAgdGV4dDogJ3RyZW5kICcgKyBpLFxuICAgIGNhdGVnb3J5OiBjYXRlZ29yaWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNhdGVnb3JpZXMubGVuZ3RoKV0sXG4gICAgdmlzaWJsZTogZmFsc2VcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbW9jaztcbiIsInZhciBUcmVuZHMgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG4gIHBvaW50ZXI6IDAsXG5cbiAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKCsrdGhpcy5wb2ludGVyID49IHRoaXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLnBvaW50ZXIgPSAwO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmF0KHRoaXMucG9pbnRlcik7XG4gIH0sXG5cbiAgcHJldjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKC0tdGhpcy5wb2ludGVyIDw9IDApIHtcbiAgICAgIHRoaXMucG9pbnRlciA9IHRoaXMubGVuZ3RoIC0gMTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5hdCh0aGlzLnBvaW50ZXIpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmVuZHM7XG4iLCJ2YXIgTWVudUl0ZW1WaWV3ID0gcmVxdWlyZSgnLi4vdmlld3MvQ29tbW9ucy9pdGVtVmlld3MvTWVudScpLFxuICAgIG1lbnVDaGFubmVsID0gcmVxdWlyZSgnLi4vLi4vY29tbW9ucy9jaGFubmVscy9tZW51JyksXG4gICAgbGF5b3V0ID0gcmVxdWlyZSgnLi4vLi4vY29tbW9ucy9jaGFubmVscy9wcmVzZW50ZXInKSxcbiAgICBUcmVuZHNNb2RlbCA9IHJlcXVpcmUoJy4uLy4uL2VudGl0aWVzL1RyZW5kcycpLFxuICAgIE1lbnU7XG5cbk1lbnUgPSBNYXJpb25ldHRlLk9iamVjdC5leHRlbmQoe1xuICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByZXNlbnRlciA9IGxheW91dC5yZXFyZXMucmVxdWVzdCgnbGF5b3V0Jyk7XG4gICAgdGhpcy5tb2RlbCA9IG5ldyBUcmVuZHNNb2RlbCgpO1xuICAgIHRoaXMubWVudUl0ZW1WaWV3ID0gbmV3IE1lbnVJdGVtVmlldygpO1xuICAgIHByZXNlbnRlci5tZW51LnNob3codGhpcy5tZW51SXRlbVZpZXcpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgTWVudSgpO1xuIiwidmFyIG1vY2sgPSByZXF1aXJlKCcuLi8uLi9tb2NrJyksXG4gICAgVHJlbmRzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4uL2NvbGxlY3Rpb25zL1RyZW5kcycpLFxuICAgIG1lbnUgPSByZXF1aXJlKCcuLi8uLi9jb21tb25zL2NoYW5uZWxzL21lbnUnKSxcbiAgICB0cmVuZHMgPSByZXF1aXJlKCcuLi8uLi9jb21tb25zL2NoYW5uZWxzL3RyZW5kcycpLFxuICAgIGxheW91dCA9IHJlcXVpcmUoJy4uLy4uL2NvbW1vbnMvY2hhbm5lbHMvcHJlc2VudGVyJyksXG4gICAgdHJlbmRzQ2hhbm5lbCA9IHJlcXVpcmUoJy4uLy4uL2NvbW1vbnMvY2hhbm5lbHMvdHJlbmRzJyksXG4gICAgQ2VsbHNDb2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJy4uL3ZpZXdzL0NvbW1vbnMvY29sbGVjdGlvblZpZXdzL0NlbGxzJyksXG4gICAgVHJlbmRzO1xuXG5UcmVuZHMgPSBNYXJpb25ldHRlLkNvbnRyb2xsZXIuZXh0ZW5kKHtcbiAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcmVzZW50ZXIgPSBsYXlvdXQucmVxcmVzLnJlcXVlc3QoJ2xheW91dCcpO1xuXG4gICAgdHJlbmRzLnJlcXJlcy5zZXRIYW5kbGVyKCd0cmVuZHMnLCB0aGlzLmdldFRyZW5kcy5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuY2VsbHNDb2xsZWN0aW9uVmlldyA9IG5ldyBDZWxsc0NvbGxlY3Rpb25WaWV3KHsgY29sbGVjdGlvbjogbmV3IEJhY2tib25lLkNvbGxlY3Rpb24oKSB9KTtcblxuICAgIHByZXNlbnRlci5tYWluLnNob3codGhpcy5jZWxsc0NvbGxlY3Rpb25WaWV3KTtcbiAgICB0cmVuZHNDaGFubmVsLnZlbnQub24oJ2dyaWQ6Y2hhbmdlZCcsIHRoaXMub25DaGFuZ2VHcmlkLCB0aGlzKTtcbiAgfSxcbiAgZ2V0VHJlbmRzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBUcmVuZHNDb2xsZWN0aW9uKF8uc2h1ZmZsZShtb2NrKSk7XG4gIH0sXG5cbiAgb25DaGFuZ2VHcmlkOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2VsbHMgPSBbXSxcbiAgICBzaXplID0gbWVudS5yZXFyZXMucmVxdWVzdCgnc2l6ZScpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplLmNvbHM7IGkrKykge1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzaXplLnJvd3M7IGorKykge1xuICAgICAgICBjZWxscy5wdXNoKHtcbiAgICAgICAgICBpZDogJycgKyBpICsgJy0nICsgaixcbiAgICAgICAgICBzaXplOiB7XG4gICAgICAgICAgICBjb2xzOiBzaXplLmNvbHMsXG4gICAgICAgICAgICByb3dzOiBzaXplLnJvd3NcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNlbGxzQ29sbGVjdGlvblZpZXcuY29sbGVjdGlvbi5zZXQoY2VsbHMpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVHJlbmRzKCk7XG4iLCJ2YXIgcm91dGVzVG9Db250cm9sID0gcmVxdWlyZSgnLi9yb3V0ZXMnKSxcbiAgICBDZWxscyA9IHJlcXVpcmUoJy4vdmlld3MvQ29tbW9ucy9jb2xsZWN0aW9uVmlld3MvQ2VsbHMnKSxcbiAgICBtb2NrID0gcmVxdWlyZSgnLi4vbW9jaycpLFxuICAgIFRyZW5kcyA9IHJlcXVpcmUoJy4vY29sbGVjdGlvbnMvVHJlbmRzJyksXG4gICAgdHJlbmRzQ3RsciA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvdHJlbmRzJyksXG4gICAgbWVudUN0bHIgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL21lbnUnKSxcbiAgICBhcHBDb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKSxcbiAgICBwcmVzZW50ZXIgPSByZXF1aXJlKCcuLi9jb21tb25zL2NoYW5uZWxzL3ByZXNlbnRlcicpLFxuICAgIG1lbnUgPSByZXF1aXJlKCcuLi9jb21tb25zL2NoYW5uZWxzL21lbnUnKSxcbiAgICBNYWluQ29udHJvbGxlcjtcblxuTWFpbkNvbnRyb2xsZXIgPSBNYXJpb25ldHRlLk9iamVjdC5leHRlbmQoe1xuICBzdGFydDogZnVuY3Rpb24ocm91dGVyKSB7XG4gICAgdHJlbmRzQ3Rsci5zdGFydCgpO1xuICAgIG1lbnVDdGxyLnN0YXJ0KCk7XG4gICAgcm91dGVyLnByb2Nlc3NBcHBSb3V0ZXModGhpcywgcm91dGVzVG9Db250cm9sKTtcbiAgfSxcbiAgaW5pdFJvdXRlOiBmdW5jdGlvbigpIHtcbiAgICBCYWNrYm9uZS5oaXN0b3J5Lm5hdmlnYXRlKCdob21lJywgeyB0cmlnZ2VyOiB0cnVlIH0pO1xuICB9LFxuICBzaG93VHJlbmRzOiBmdW5jdGlvbihjb2xzLCByb3dzKSB7XG4gICAgbWVudS5jb21tYW5kcy5leGVjdXRlKCdjaGFuZ2U6c2l6ZScsIHsgY29sczogY29scywgcm93czogcm93c30pO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgTWFpbkNvbnRyb2xsZXIoKTtcbiIsInZhciByb3V0ZXMgPSB7XG4gICcnOiAnaW5pdFJvdXRlJyxcbiAgJ2hvbWUoLzpyb3dzLzpjb2xzKSc6ICdzaG93VHJlbmRzJyxcbiAgJyphY3Rpb24nOiAnaW5pdFJvdXRlJ1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSByb3V0ZXM7XG4iLCIvLyBoYnNmeSBjb21waWxlZCBIYW5kbGViYXJzIHRlbXBsYXRlXG52YXIgSGFuZGxlYmFyc0NvbXBpbGVyID0gcmVxdWlyZSgnaGJzZnkvcnVudGltZScpO1xubW9kdWxlLmV4cG9ydHMgPSBIYW5kbGViYXJzQ29tcGlsZXIudGVtcGxhdGUoe1wiY29tcGlsZXJcIjpbNixcIj49IDIuMC4wLWJldGEuMVwiXSxcIm1haW5cIjpmdW5jdGlvbihkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gICAgcmV0dXJuIFwiXCI7XG59LFwidXNlRGF0YVwiOnRydWV9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzQ29tcGlsZXIgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnNDb21waWxlci50ZW1wbGF0ZSh7XCIxXCI6ZnVuY3Rpb24oZGVwdGgwLGhlbHBlcnMscGFydGlhbHMsZGF0YSkge1xuICAgIHZhciBoZWxwZXIsIGFsaWFzMT1oZWxwZXJzLmhlbHBlck1pc3NpbmcsIGFsaWFzMj1cImZ1bmN0aW9uXCIsIGFsaWFzMz10aGlzLmVzY2FwZUV4cHJlc3Npb247XG5cbiAgcmV0dXJuIFwiICAgICAgICAgICAgICA8YSBocmVmPVxcXCIjaG9tZS9cIlxuICAgICsgYWxpYXMzKCgoaGVscGVyID0gKGhlbHBlciA9IGhlbHBlcnMuaiB8fCAoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuaiA6IGRlcHRoMCkpICE9IG51bGwgPyBoZWxwZXIgOiBhbGlhczEpLCh0eXBlb2YgaGVscGVyID09PSBhbGlhczIgPyBoZWxwZXIuY2FsbChkZXB0aDAse1wibmFtZVwiOlwialwiLFwiaGFzaFwiOnt9LFwiZGF0YVwiOmRhdGF9KSA6IGhlbHBlcikpKVxuICAgICsgXCIvXCJcbiAgICArIGFsaWFzMygoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmkgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmkgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMxKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMyID8gaGVscGVyLmNhbGwoZGVwdGgwLHtcIm5hbWVcIjpcImlcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiXFxcIiBkYXRhLWNvbD1cXFwiXCJcbiAgICArIGFsaWFzMygoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmogfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmogOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMxKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMyID8gaGVscGVyLmNhbGwoZGVwdGgwLHtcIm5hbWVcIjpcImpcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiXFxcIiBkYXRhLXJvdz1cXFwiXCJcbiAgICArIGFsaWFzMygoKGhlbHBlciA9IChoZWxwZXIgPSBoZWxwZXJzLmkgfHwgKGRlcHRoMCAhPSBudWxsID8gZGVwdGgwLmkgOiBkZXB0aDApKSAhPSBudWxsID8gaGVscGVyIDogYWxpYXMxKSwodHlwZW9mIGhlbHBlciA9PT0gYWxpYXMyID8gaGVscGVyLmNhbGwoZGVwdGgwLHtcIm5hbWVcIjpcImlcIixcImhhc2hcIjp7fSxcImRhdGFcIjpkYXRhfSkgOiBoZWxwZXIpKSlcbiAgICArIFwiXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0IGJ0bi14cyBjZWxsXFxcIj48L2E+XFxuXCI7XG59LFwiY29tcGlsZXJcIjpbNixcIj49IDIuMC4wLWJldGEuMVwiXSxcIm1haW5cIjpmdW5jdGlvbihkZXB0aDAsaGVscGVycyxwYXJ0aWFscyxkYXRhKSB7XG4gICAgdmFyIHN0YWNrMTtcblxuICByZXR1cm4gXCI8ZGl2IGNsYXNzPVxcXCJuYXZiYXItaGVhZGVyXFxcIj5cXG4gIDxidXR0b24gdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwibmF2YmFyLXRvZ2dsZSBjb2xsYXBzZWRcXFwiIGRhdGEtdG9nZ2xlPVxcXCJjb2xsYXBzZVxcXCIgZGF0YS10YXJnZXQ9XFxcIiNuYXZiYXItY29sbGFwc2VcXFwiPlxcbiAgICA8c3BhbiBjbGFzcz1cXFwiaWNvbi1iYXJcXFwiPjwvc3Bhbj5cXG4gICAgPHNwYW4gY2xhc3M9XFxcImljb24tYmFyXFxcIj48L3NwYW4+XFxuICAgIDxzcGFuIGNsYXNzPVxcXCJpY29uLWJhclxcXCI+PC9zcGFuPlxcbiAgPC9idXR0b24+XFxuPC9kaXY+XFxuPGRpdiBjbGFzcz1cXFwiY29sbGFwc2UgbmF2YmFyLWNvbGxhcHNlXFxcIiBpZD1cXFwibmF2YmFyLWNvbGxhcHNlXFxcIj5cXG4gIDx1bCBjbGFzcz1cXFwibmF2IG5hdmJhci1uYXZcXFwiPlxcbiAgICA8bGkgY2xhc3M9XFxcImFjdGl2ZVxcXCI+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwiYnRuIGJ0bi1saW5rIG5hdmJhci1idG4gYnRuLWdyaWRcXFwiPjxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLXRoXFxcIj48L3NwYW4+PC9kaXY+XFxuICAgICAgPGRpdiBjbGFzcz1cXFwicG9wb3Zlci1jb250ZW50IGhpZGRlblxcXCI+XFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJidG4tZ3JvdXBcXFwiPlxcblwiXG4gICAgKyAoKHN0YWNrMSA9IGhlbHBlcnMuZWFjaC5jYWxsKGRlcHRoMCwoZGVwdGgwICE9IG51bGwgPyBkZXB0aDAuY2VsbHMgOiBkZXB0aDApLHtcIm5hbWVcIjpcImVhY2hcIixcImhhc2hcIjp7fSxcImZuXCI6dGhpcy5wcm9ncmFtKDEsIGRhdGEsIDApLFwiaW52ZXJzZVwiOnRoaXMubm9vcCxcImRhdGFcIjpkYXRhfSkpICE9IG51bGwgPyBzdGFjazEgOiBcIlwiKVxuICAgICsgXCIgICAgICA8L2Rpdj5cXG4gICAgPC9saT5cXG4gIDwvdWw+XFxuPC9kaXY+XFxuXCI7XG59LFwidXNlRGF0YVwiOnRydWV9KTtcbiIsIi8vIGhic2Z5IGNvbXBpbGVkIEhhbmRsZWJhcnMgdGVtcGxhdGVcbnZhciBIYW5kbGViYXJzQ29tcGlsZXIgPSByZXF1aXJlKCdoYnNmeS9ydW50aW1lJyk7XG5tb2R1bGUuZXhwb3J0cyA9IEhhbmRsZWJhcnNDb21waWxlci50ZW1wbGF0ZSh7XCJjb21waWxlclwiOls2LFwiPj0gMi4wLjAtYmV0YS4xXCJdLFwibWFpblwiOmZ1bmN0aW9uKGRlcHRoMCxoZWxwZXJzLHBhcnRpYWxzLGRhdGEpIHtcbiAgICByZXR1cm4gXCI8aDE+PC9oMT5cXG5cIjtcbn0sXCJ1c2VEYXRhXCI6dHJ1ZX0pO1xuIiwidmFyIENlbGxJdGVtVmlldyA9IHJlcXVpcmUoJy4uL2l0ZW1WaWV3cy9DZWxsJyksXG5DZWxscztcblxuQ2VsbHMgPSBNYXJpb25ldHRlLkNvbGxlY3Rpb25WaWV3LmV4dGVuZCh7XG4gIGNoaWxkVmlldzogQ2VsbEl0ZW1WaWV3LFxuICBjbGFzc05hbWU6ICdyb3cnXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDZWxscztcbiIsInZhciBUcmVuZHNDZWxsSXRlbVZpZXcgPSByZXF1aXJlKCcuLi8uLi9UcmVuZHMvaXRlbVZpZXdzL1RyZW5kc0NlbGwnKSxcbm1lbnUgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi9jb21tb25zL2NoYW5uZWxzL21lbnUnKSxcbnRyZW5kc0NoYW5uZWwgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi9jb21tb25zL2NoYW5uZWxzL3RyZW5kcycpLFxuYXBwQ29uZmlnID0gcmVxdWlyZSgnLi4vLi4vLi4vLi4vY29uZmlnJyksXG5DZWxsO1xuXG5DZWxsID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZSgnJyksXG5cbiAgbW9kZWxFdmVudHM6IHtcbiAgICAnY2hhbmdlIHNpemUnOiAnb25DaGFuZ2VTaXplJ1xuICB9LFxuXG4gIG9uQ2hhbmdlU2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNpemUgPSBtZW51LnJlcXJlcy5yZXF1ZXN0KCdzaXplJyk7XG4gICAgdGhpcy4kZWwucmVtb3ZlQ2xhc3MoKTtcbiAgICB0aGlzLiRlbC5hZGRDbGFzcygnY2VsbCBjZWxsLScgKyBzaXplLmNvbHMgKyAnLScgKyBzaXplLnJvd3MpO1xuICB9LFxuXG4gIG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgdHJlbmRzID0gdHJlbmRzQ2hhbm5lbC5yZXFyZXMucmVxdWVzdCgndHJlbmRzJyksXG4gICAgdHJlbmRzQ2VsbEl0ZW1WaWV3O1xuXG4gICAgdHJlbmRzQ2VsbEl0ZW1WaWV3ID0gbmV3IFRyZW5kc0NlbGxJdGVtVmlldyh7IGNvbGxlY3Rpb246IHRyZW5kcyB9KTtcblxuICAgIHRoaXMuJGVsLmh0bWwodHJlbmRzQ2VsbEl0ZW1WaWV3LiRlbCk7XG4gICAgdGhpcy5vbkNoYW5nZVNpemUoKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2VsbDtcbiIsInZhciBhcHBDb25maWcgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi9jb25maWcnKSxcbiAgICBtZW51Q2hhbm5lbCA9IHJlcXVpcmUoJy4uLy4uLy4uLy4uL2NvbW1vbnMvY2hhbm5lbHMvbWVudScpLFxuICAgIG1lbnVUZW1wbGF0ZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3RlbXBsYXRlcy9Db21tb25zL21lbnUnKSxcbiAgICBNZW51O1xuXG5NZW51ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogbWVudVRlbXBsYXRlLFxuICBjbGFzc05hbWU6ICdjb250YWluZXItZmx1aWQnLFxuXG4gIHVpOiB7XG4gICAgYnRuX2dyaWQ6ICcuYnRuLWdyaWQnLFxuICAgIHBvcG92ZXJfY29udGVudDogJy5wb3BvdmVyLWNvbnRlbnQnXG4gIH0sXG5cbiAgb25PdmVyQ2VsbDogZnVuY3Rpb24oZXZ0KSB7XG4gICAgdmFyIGNlbGwgPSAkKGV2dC5jdXJyZW50VGFyZ2V0KSxcbiAgICAgICAgY29sdW1uID0gK2NlbGwuZGF0YSgnY29sJyk7XG5cbiAgICAkKCcucG9wb3ZlciA+IC5wb3BvdmVyLWNvbnRlbnQgLmNlbGwnKS5yZW1vdmVDbGFzcygnYnRuLXByaW1hcnknKTtcblxuICAgIGNlbGwuYWRkQ2xhc3MoJ2J0bi1wcmltYXJ5Jyk7XG4gICAgZm9yICh2YXIgaSA9IGNvbHVtbjsgaSA+IDA7IGktLSkge1xuICAgICAgY2VsbC5wcmV2QWxsKCc6bnRoLWNoaWxkKDZuKycgKyBpICsgJyknKS5hZGRDbGFzcygnYnRuLXByaW1hcnknKTtcbiAgICB9XG4gIH0sXG5cbiAgb25DbGlja0NlbGw6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudWkuYnRuX2dyaWQucG9wb3ZlcignaGlkZScpO1xuICB9LFxuXG4gIG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICBfLmRlZmVyKGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51aS5idG5fZ3JpZC5wb3BvdmVyKHtcbiAgICAgICAgaHRtbDogdHJ1ZSxcbiAgICAgICAgY29udGVudDogdGhpcy51aS5wb3BvdmVyX2NvbnRlbnQuaHRtbCgpLFxuICAgICAgICB2aWV3cG9ydDogeyBzZWxlY3RvcjogJ2JvZHknLCBwYWRkaW5nOiAnMTAnIH0sXG4gICAgICAgIHBsYWNlbWVudDogJ2JvdHRvbScsXG4gICAgICAgIHRvZ2dsZTogJ3BvcG92ZXInXG4gICAgICB9KTtcblxuICAgICAgdGhpcy51aS5idG5fZ3JpZC5vbignc2hvd24uYnMucG9wb3ZlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcucG9wb3ZlciA+IC5wb3BvdmVyLWNvbnRlbnQgLmNlbGwnKVxuICAgICAgICAgIC5vbignbW91c2VvdmVyJywgdGhpcy5vbk92ZXJDZWxsLmJpbmQodGhpcykpXG4gICAgICAgICAgLm9uZSgnY2xpY2snLCB0aGlzLm9uQ2xpY2tDZWxsLmJpbmQodGhpcykpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LFxuXG4gIHNlcmlhbGl6ZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzaXplID0gbWVudUNoYW5uZWwucmVxcmVzLnJlcXVlc3QoJ3NpemUnKSwgY2VsbHMgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IGFwcENvbmZpZy5tYXhfcm93czsgaSsrKSB7XG4gICAgICBmb3IodmFyIGogPSAxOyBqIDw9IGFwcENvbmZpZy5tYXhfY29sdW1uczsgaisrKSB7XG4gICAgICAgIGNlbGxzLnB1c2goe1xuICAgICAgICAgIGk6IGksXG4gICAgICAgICAgajogalxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGNlbGxzOiBjZWxsc1xuICAgIH07XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnU7XG4iLCJ2YXIgdHJlbmRUZW1wbGF0ZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3RlbXBsYXRlcy9UcmVuZHMvdHJlbmQnKSxcblRyZW5kO1xuXG5UcmVuZCA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IHRyZW5kVGVtcGxhdGUsXG4gIGNsYXNzTmFtZTogJ3RyZW5kJyxcbiAgdWk6IHtcbiAgICB0ZXh0OiAnaDEnXG4gIH0sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH0sXG4gIG9uUmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiRlbC5hZGRDbGFzcygnYmctJyArIHRoaXMubW9kZWwuZ2V0KCdjYXRlZ29yeScpKTtcbiAgICB0aGlzLnVpLnRleHQudHlwZWQoe1xuICAgICAgc3RyaW5nczogW3RoaXMubW9kZWwuZ2V0KCd0ZXh0JykgKyAnJ10sXG4gICAgICBzdGFydERlbGF5OiA1MDAsXG4gICAgICBzaG93Q3Vyc29yOiBmYWxzZVxuICAgIH0pO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmVuZDtcbiIsInZhciBUcmVuZEl0ZW1WaWV3ID0gcmVxdWlyZSgnLi9UcmVuZCcpLFxuYXBwQ29uZmlnID0gcmVxdWlyZSgnLi4vLi4vLi4vLi4vY29uZmlnJyksXG5jZWxsVGVtcGxhdGUgPSByZXF1aXJlKCcuLi8uLi8uLi90ZW1wbGF0ZXMvQ2VsbHMvY2VsbCcpLFxuVHJlbmRzQ2VsbDtcblxuVHJlbmRzQ2VsbCA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IGNlbGxUZW1wbGF0ZSxcbiAgY2xhc3NOYW1lOiAndHJlbmRzLWNlbGwnLFxuXG4gIHN0YXJ0VGltZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhcnRfdGltZSA9IG51bGw7XG4gICAgdGhpcy5lbmRfdGltZSA9IF8ucmFuZG9tKGFwcENvbmZpZy5taW5fZGVsYXksIGFwcENvbmZpZy5tYXhfZGVsYXkpO1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnRpY2suYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgdGljazogZnVuY3Rpb24odGltZXN0YW1wKSB7XG4gICAgaWYgKCF0aGlzLnN0YXJ0X3RpbWUpIHtcbiAgICAgIHRoaXMuc3RhcnRfdGltZSA9IHRpbWVzdGFtcDtcbiAgICB9XG5cbiAgICB2YXIgZGVsdGEgPSB0aW1lc3RhbXAgLSB0aGlzLnN0YXJ0X3RpbWU7XG5cbiAgICBpZiAoZGVsdGEgPCB0aGlzLmVuZF90aW1lKSB7XG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy50aWNrLmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN3aXRjaFRyZW5kKCk7XG4gICAgfVxuICB9LFxuXG4gIHN3aXRjaFRyZW5kOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm5ld190cmVuZCA9IHRoaXMuY3JlYXRlVHJlbmQoKTtcblxuICAgIHN3aXRjaChfLnJhbmRvbSgzKSkge1xuICAgICAgY2FzZSAwOiAvLyBzbGlkZSByaWdodFxuICAgICAgICB0aGlzLnNsaWRlUmlnaHQoKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTogLy8gc2xpZGUgbGVmdFxuICAgICAgICB0aGlzLnNsaWRlTGVmdCgpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAyOiAvLyBzbGlkZSB1cFxuICAgICAgICB0aGlzLnNsaWRlVXAoKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzogLy8gc2xpZGUgZG93blxuICAgICAgICB0aGlzLnNsaWRlRG93bigpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICB0aGlzLiRlbC5vbmUoJ3dlYmtpdFRyYW5zaXRpb25FbmQgdHJhbnNpdGlvbmVuZCBvVHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudXBkYXRlVHJlbmRzQ2VsbCgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgY3JlYXRlVHJlbmQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0cmVuZE1vZGVsID0gdGhpcy5jb2xsZWN0aW9uLm5leHQoKSxcbiAgICAgICAgdHJlbmRJdGVtVmlldyA9IG5ldyBUcmVuZEl0ZW1WaWV3KHsgbW9kZWw6IHRyZW5kTW9kZWwgfSk7XG5cbiAgICByZXR1cm4gdHJlbmRJdGVtVmlldztcbiAgfSxcblxuICB1cGRhdGVUcmVuZHNDZWxsOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jdXJyZW50X3RyZW5kKSB7XG4gICAgICB0aGlzLmN1cnJlbnRfdHJlbmQuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIHRoaXMuY3VycmVudF90cmVuZCA9IHRoaXMubmV3X3RyZW5kO1xuXG4gICAgdGhpcy4kZWwucmVtb3ZlQ2xhc3MoJ2hvcml6b250YWwgdmVydGljYWwgc2xpZGUgcmlnaHQgbGVmdCB1cCBkb3duJyk7XG4gICAgdGhpcy5zdGFydFRpbWVyKCk7XG4gIH0sXG5cbiAgc2xpZGVSaWdodDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy4kZWwucHJlcGVuZCh0aGlzLm5ld190cmVuZC4kZWwpXG4gICAgICAuYWRkQ2xhc3MoJ2hvcml6b250YWwgc2xpZGUgcmlnaHQnKTtcbiAgfSxcblxuICBzbGlkZUxlZnQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJGVsLmFwcGVuZCh0aGlzLm5ld190cmVuZC4kZWwpXG4gICAgICAuYWRkQ2xhc3MoJ2hvcml6b250YWwgc2xpZGUgbGVmdCcpO1xuICB9LFxuXG4gIHNsaWRlVXA6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuJGVsLmFwcGVuZCh0aGlzLm5ld190cmVuZC4kZWwpXG4gICAgICAuYWRkQ2xhc3MoJ3ZlcnRpY2FsIHNsaWRlIHVwJyk7XG4gIH0sXG5cbiAgc2xpZGVEb3duOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiRlbC5wcmVwZW5kKHRoaXMubmV3X3RyZW5kLiRlbClcbiAgICAgIC5hZGRDbGFzcygndmVydGljYWwgc2xpZGUgZG93bicpO1xuICB9LFxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9LFxuICBvblJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5uZXdfdHJlbmQgPSB0aGlzLmNyZWF0ZVRyZW5kKCk7XG4gICAgdGhpcy4kZWwuYXBwZW5kKHRoaXMubmV3X3RyZW5kLiRlbCk7XG4gICAgdGhpcy51cGRhdGVUcmVuZHNDZWxsKCk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZW5kc0NlbGw7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IE1hcmlvbmV0dGUuQXBwUm91dGVyLmV4dGVuZCh7fSk7XG4iXX0=
