import uuid from 'uuid';
import Emitter from './emitter';
import SymbolMap from 'data-types/symbol-map';
import Loganberry from 'loganberry';
import { sleep } from './utils';

const symbols = new SymbolMap([
  'enabled',
  'id',
  'heartbeat',
  'emitter',
  'prefix',
  'gc',
  'beatRegex',
  'beatKey',
  'mainTabKey',
  'eventRegex',
]);

const logger = new Loganberry({
  prefix: 'tabbie',
});


const HEARTBEAT_INTERVAL = 1000;
// heatbeat older than HEARTBEAT_EXPIRE will be gc'ed
const HEARTBEAT_EXPIRE = 2000;
const GC_INTERVAL = 5000;

const FIGHT_TIMEOUT = 20;

/**
 * @function
 */
function heartbeat() {
  localStorage.setItem(this[symbols.beatKey], Date.now());
}

/**
 * @function
 * @return {String|Array} Array of available keys in the storage
 */
function storageKeys() {
  const length = localStorage.length;
  const keys = new Set();
  for (let i = 0; i < length; i++) {
    const key = localStorage.key(i);
    if (key !== null) keys.add(key);
  }
  return [...keys];
}

/**
 * @function
 * @description Search storage for expired tab heartbeat keys and delete them
 */
function gc() {
  logger.trace('gc start');
  const expiredCut = Date.now() - HEARTBEAT_EXPIRE;
  this::storageKeys().forEach(key => {
    if (this[symbols.beatRegex].test(key) && localStorage.getItem(key) < expiredCut) {
      localStorage.removeItem(key);
      logger.trace(`gc: remove key ${key}`);
    }
  });
  logger.trace('gc done');
}

function setAsMain() {
  logger.trace('setAsMain()');
  localStorage.setItem(this[symbols.mainTabKey], this.id);
  this.emit('mainTabIdChanged', this.id);
}

async function fightForMain(originalMainTabId) {
  logger.trace('fightForMain()');
  await sleep(FIGHT_TIMEOUT);
  if (localStorage.getItem(this[symbols.mainTabKey]) === originalMainTabId) {
    this::setAsMain();
  }
}

/**
 * @class Tabbie
 */
export default class Tabbie extends Emitter {
  constructor(
    prefix = 'tabbie',
  ) {
    super();
    this[symbols.prefix] = prefix;
    this[symbols.enabled] = typeof window !== 'undefined'
      && typeof document.visibilityState !== 'undefined'
      && typeof localStorage !== 'undefined';
    this[symbols.id] = uuid.v4();
    this[symbols.emitter] = new Emitter();
    this[symbols.beatKey] = `${prefix}-beat-${this.id}`;
    this[symbols.beatRegex] = new RegExp(`^${prefix}-beat-`);
    this[symbols.mainTabKey] = `${prefix}-main-tab-id`;
    this[symbols.eventRegex] = new RegExp(`^${prefix}-event-`);

    if (this.isEnabled) {
      // setup heartbeat;
      this[symbols.heartbeat] = setInterval(this::heartbeat, HEARTBEAT_INTERVAL);
      this::heartbeat();

      this[symbols.gc] = setInterval(this::gc, GC_INTERVAL);

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this::setAsMain();
      });
      window.addEventListener('storage', async e => {
        if (e.key === this[symbols.mainTabKey]) {
          this.emit('mainTabIdChanged', e.newValue);
          logger.trace('mainTabIdChanged', e.newValue);
        } else if (
          this[symbols.beatRegex].test(e.key) &&
          (e.newValue === null || e.newValue === '')
        ) {
          const mainTabId = await this.getMainTabId();
          if (e.key.replace(this[symbols.beatRegex], '') === mainTabId) {
            // main tab closed itself, fight to be the main tab
            this::fightForMain(mainTabId);
          }
        } else if (
          this[symbols.eventRegex].test(e.key) &&
          e.newValue !== null && e.newValue !== ''
        ) {
          const payload = JSON.parse(e.newValue);
          const [id, event, ...args] = payload;
          if (id !== this.id) { // ie fires storage event on original
            logger.trace(`received event: ${event}`);
            this.emit(event, ...args);
          }
        }
      });
      window.addEventListener('beforeunload', () => {
        localStorage.removeItem(this[symbols.beatKey]);
      });


      if (!document.hidden) {
        this::setAsMain();
      }
    }
  }
  get isEnabled() {
    return this[symbols.enabled];
  }

  async isMain() {
    return (await this.getMainTabId() === this.id);
  }

  get id() {
    return this[symbols.id];
  }

  /**
   * @function
   * @return {Promise} - Resolves to current main tab id
   */
  async getMainTabId() {
    const mainTabId = localStorage.getItem(this[symbols.mainTabKey]);
    if (mainTabId) return mainTabId;

    return new Promise(resolve => {
      this.once('mainTabIdChanged', resolve);
    });
  }

  get prefix() {
    return this[symbols.prefix];
  }

  get isVisible() {
    return !(this.isEnabled && document.hidden);
  }


  send(event, ...args) {
    if (this.isEnabled) {
      logger.trace(`send('${event}', ...)`);
      // send to other tabs via localStorage event
      const id = uuid.v4();
      const key = `${this.prefix}-event-${id}`;
      const payload = [this.id, event, ...args];
      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.removeItem(key);
    }
  }
}
