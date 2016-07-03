'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _componentEmitter = require('component-emitter');

var _componentEmitter2 = _interopRequireDefault(_componentEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var symbols = {
  visibility: (0, _symbol2.default)(),
  storage: (0, _symbol2.default)(),
  window: (0, _symbol2.default)(),
  enabled: (0, _symbol2.default)(),
  id: (0, _symbol2.default)(),
  heartbeat: (0, _symbol2.default)(),
  emitter: (0, _symbol2.default)(),
  prefix: (0, _symbol2.default)(),
  gc: (0, _symbol2.default)()
};

var HEARTBEAT_INTERVAL = 500;
// heatbeat older than HEARTBEAT_EXPIRE will be gc'ed
var HEARTBEAT_EXPIRE = 2000;
var GC_INTERVAL = 5000;

/* global window Visibility localStorage */

/**
 * @function
 */
function heartbeat() {
  this[symbols.storage].setItem(this.prefix + '-beat-' + this.id, Date.now());
}
/**
 * @function
 * @return {String|Array} Array of available keys in the storage
 */
function storageKeys() {
  var length = this.storage.length;
  var keys = new _set2.default();
  for (var i = 0; i < length; i++) {
    var key = this.storage.key(i);
    if (key !== null) keys.add(key);
  }
  return [].concat((0, _toConsumableArray3.default)(keys));
}
/**
 * @function
 * @description Search storage for expired tab heartbeat keys and delete them
 */
function gc() {
  var _this = this;

  var expiredCut = Date.now() - HEARTBEAT_EXPIRE;
  var regex = new RegExp('^' + this.prefix + '-beat');
  storageKeys.call(this).forEach(function (key) {
    if (regex.test(key) && _this.storage.getItem(key) < expiredCut) {
      _this.storage.removeItem(key);
    }
  });
}

var Tabbie = function () {
  function Tabbie(_ref) {
    var visibility = _ref.visibility;
    var storage = _ref.storage;
    var windowObject = _ref.windowObject;
    var _ref$prefix = _ref.prefix;
    var prefix = _ref$prefix === undefined ? 'tabbie' : _ref$prefix;
    (0, _classCallCheck3.default)(this, Tabbie);

    if (visibility) {
      this[symbols.visibility] = visibility;
    } else if (typeof Visibility !== 'undefined') {
      this[symbols.visibility] = Visibility;
    }

    if (storage) {
      this[symbols.storage] = storage;
    } else if (typeof localStorage !== 'undefined') {
      this[symbols.storage] = localStorage;
    }

    if (windowObject) {
      this[symbols.window] = windowObject;
    } else if (typeof window !== 'undefined') {
      this[symbols.window] = window;
    }

    this[symbols.prefix] = prefix;

    this[symbols.enabled] = !!(this[symbols.visibility] && this[symbols.storage] && this[symbols.window]);

    this[symbols.id] = _uuid2.default.v4();
    this[symbols.emitter] = new _componentEmitter2.default();

    if (this.isEnabled) {
      // setup heartbeat;
      this[symbols.heartbeat] = setInterval(heartbeat.bind(this), HEARTBEAT_INTERVAL);
      heartbeat.call(this);

      this[symbols.gc] = setInterval(gc.bind(this), GC_INTERVAL);
    }
  }

  (0, _createClass3.default)(Tabbie, [{
    key: 'emit',
    value: function emit(event) {
      if (this.isEnabled) {
        var id = _uuid2.default.v4();
        var key = 'tabbie-event-' + id;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        var payload = [event].concat(args);
        this.storage.setItem(key, (0, _stringify2.default)(payload));
        this.storage.removeItem(key);
      }
    }
  }, {
    key: 'on',
    value: function on() {
      var _symbols$emitter;

      (_symbols$emitter = this[symbols.emitter]).on.apply(_symbols$emitter, arguments);
    }
  }, {
    key: 'off',
    value: function off() {
      var _symbols$emitter2;

      (_symbols$emitter2 = this[symbols.emitter]).off.apply(_symbols$emitter2, arguments);
    }
  }, {
    key: 'addEventListener',
    value: function addEventListener() {
      var _symbols$emitter3;

      (_symbols$emitter3 = this[symbols.emitter]).addEventListener.apply(_symbols$emitter3, arguments);
    }
  }, {
    key: 'removeEventListener',
    value: function removeEventListener() {
      var _symbols$emitter4;

      (_symbols$emitter4 = this[symbols.emitter]).removeEventListener.apply(_symbols$emitter4, arguments);
    }
  }, {
    key: 'once',
    value: function once() {
      var _symbols$emitter5;

      (_symbols$emitter5 = this[symbols.emitter]).once.apply(_symbols$emitter5, arguments);
    }
  }, {
    key: 'isEnabled',
    get: function get() {
      return this[symbols.enabled];
    }
    // get isActive() {
    //   return this[]
    // }

  }, {
    key: 'id',
    get: function get() {
      return this[symbols.id];
    }
  }, {
    key: 'storage',
    get: function get() {
      return this[symbols.storage];
    }
  }, {
    key: 'prefix',
    get: function get() {
      return this[symbols.prefix];
    }
  }]);
  return Tabbie;
}();

exports.default = Tabbie;
//# sourceMappingURL=tabbie.js.map
