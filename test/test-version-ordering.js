const lifter = require('../jake/sails-lifter');
const _ = require('lodash');
const should = require('chai').should()

describe('Version ordering', function() {
  this.timeout(30000);
  before(function(done) {
    lifter.lift(function(err, sails) {
      this.sails = sails;
      done()
    });
  })

  it('should order versions properly', (done) => {
    var versions = ['0.43-8', '1.4.1.1', '1.10', '1.2a.1', '1.1-0'];
    var expected = [ '1.10', '1.4.1.1', '1.2a.1', '1.1-0', '0.43-8' ];
    versions.should.deep.equal(expected);
    done()
  })
})
