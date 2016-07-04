/* global describe before after it */

import { expect } from 'chai';
import Tabbie from '../src/tabbie';

describe('tabbie', async () => {
  it('is a function', () => {
    expect(Tabbie).to.be.a('function');
  });
});
