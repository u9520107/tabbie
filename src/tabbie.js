import uuid from 'uuid';
import Emitter from 'component-emitter';
import { sleep } from './utils';

const symbols = {
  enabled: Symbol(),
  id: Symbol(),
  heartbeat: Symbol(),
  emitter: Symbol(),
  prefix: Symbol(),
  gc: Symbol(),
  beatRegex: Symbol(),
  beatKey: Symbol(),
  mainTabKey: Symbol(),
};


const HEARTBEAT_INTERVAL = 1000;
// heatbeat older than HEARTBEAT_EXPIRE will be gc'ed
const HEARTBEAT_EXPIRE = 2000;
const GC_INTERVAL = 5000;

const FIGHT_TIMEOUT = 20;

/* global window localStorage */


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
  const expiredCut = Date.now() - HEARTBEAT_EXPIRE;
  this::storageKeys().forEach(key => {
    if (this[symbols.beatRegex].test(key) && localStorage.getItem(key) < expiredCut) {
      localStorage.removeItem(key);
    }
  });
}

function setAsMain() {
  localStorage.setItem(this[symbols.mainTabKey], this.id);
  this[symbols.emitter].emit('mainTabIdChanged', this.id);
}
async function fightForMain(originalMainTabId) {
  await sleep(FIGHT_TIMEOUT);
  if (localStorage.getItem(this[symbols.mainTabKey]) === originalMainTabId) {
    this::setAsMain();
  }
}


export default class Tabbie {
  constructor(
    prefix = 'tabbie',
  ) {
    this[symbols.prefix] = prefix;
    this[symbols.enabled] = typeof window !== 'undefined';
    this[symbols.id] = uuid.v4();
    this[symbols.emitter] = new Emitter();
    this[symbols.beatKey] = `${prefix}-beat-${this.id}`;
    this[symbols.beatRegex] = new RegExp(`^${prefix}-beat-`);
    this[symbols.mainTabKey] = `${prefix}-main-tab-id`;

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
        } else if (this[symbols.beatRegex].test(e.key) && e.newValue === null) {
          const mainTabId = await this.getMainTabId();
          if (e.key.replace(this[symbols.beatRegex], '') === mainTabId) {
            // main tab closed itself, fight to be the main tab
            this::fightForMain(mainTabId);
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

  async getMainTabId() {
    const mainTabId = localStorage.getItem(this[symbols.mainTabKey]);
    if (mainTabId) return mainTabId;

    return new Promise(resolve => {
      this.on('mainTabIdChanged', resolve);
    });
  }

  get prefix() {
    return this[symbols.prefix];
  }

  get isVisible() {
    return !(this.isEnabled && document.hidden);
  }


  emit(event, ...args) {
    // emit through own emitter first
    this[symbols.emitter].emit(event, ...args);

    if (this.isEnabled) {
      // emit to other tabs via localStorage event
      const id = uuid.v4();
      const key = `tabbie-event-${id}`;
      const payload = [event, ...args];
      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.removeItem(key);
    }
  }

  on(...args) {
    this[symbols.emitter].on(...args);
  }
  off(...args) {
    this[symbols.emitter].off(...args);
  }
  addEventListener(...args) {
    this[symbols.emitter].addEventListener(...args);
  }
  removeEventListener(...args) {
    this[symbols.emitter].removeEventListener(...args);
  }
  once(...args) {
    this[symbols.emitter].once(...args);
  }

}
