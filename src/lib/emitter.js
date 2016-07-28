import EventEmitter from 'event-emitter';

const emitter = Symbol();

export default class Emitter {
  constructor() {
    this[emitter] = new EventEmitter();
  }

  /**
   * @function
   * @param {String} event
   * @param {Function} handler
   * @return {Function} Unregister function.
   */
  on(event, handler) {
    this[emitter].on(event, handler);
    return () => {
      this[emitter].off(event, handler);
    };
  }
  /**
   * @function
   * @param {String} event
   * @param {Function)} handler
   * @return {Function} Unregister function.
   */
  once(event, handler) {
    this[emitter].once(event, handler);
    return () => {
      this[emitter].off(event, handler);
    };
  }
  /**
   * @function
   * @param {String} event
   * @param {...args} args
   */
  emit(event, ...args) {
    this[emitter].emit(event, ...args);
  }
  /**
   * @function
   * @param {String} event
   * @param {Function} handler
   */
  off(event, handler) {
    this[emitter].off(event, handler);
  }
}
