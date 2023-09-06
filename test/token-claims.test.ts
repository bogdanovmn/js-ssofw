import { Role, TokenClaims } from '../src/token-claims';

import * as mocha from 'mocha';
import * as chai from 'chai';

const expect = chai.expect;
describe('TokenClaims object methods', () => {

  it('hasRole method' , () => {
    const tc = new TokenClaims()
    tc.roles = ['any:admin', 'any:user', 'md:moderator']
    expect(tc.hasRole(Role.admin, "some-app")).to.be.true;
    expect(tc.hasRole(Role.user, "some-app")).to.be.true;
    expect(tc.hasRole(Role.moderator, "some-app")).to.be.false;
    expect(tc.hasRole(Role.moderator, "md")).to.be.true;
  });

});