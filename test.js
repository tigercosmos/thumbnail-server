const supertest = require('supertest');
const { assert } = require('chai');

const { app, server } = require('./main.js');

describe('Integration tests', function () {

  let request;

  before(function (done) {
    request = supertest.agent(app)
    setTimeout(() => { done() }, 1000);
  })

  after(function (done) {
    server.then(s => s.close(() => {
      console.log("server close!")
      done();
    }));
  })

  it('get /', function (done) {
    request
      .get('/')
      .expect(200, done);
  });


  let check_url;

  it('get /api', function (done) {
    request
      .get('/api')
      .expect(202)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        assert.equal(res.body.status, "in_process");
        assert.isString(res.body.url);
        check_url = res.body.url;
        return done();
      });
  });


  it('get /check', function (done) {
    setTimeout(() => {
      request
        .get(check_url)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          assert.equal(res.body.status, "done");
          return done();
        });
    }, 500);

  });
});
