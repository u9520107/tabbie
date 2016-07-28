/* global describe before after it */

import { expect } from 'chai';
import Tabbie from '../src/lib/tabbie';

describe('tabbie', async () => {
  it('is a function', () => {
    expect(Tabbie).to.be.a('function');
  });
});
