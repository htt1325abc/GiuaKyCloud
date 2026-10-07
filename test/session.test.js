const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const {
  ONE_DAY_IN_MILLISECONDS,
  createSessionMiddleware,
  countSessionVisit,
} = require('../src/config/session');

test('session store dùng MongoDB Atlas collection sessions', () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    DB_NAME: process.env.DB_NAME,
    SESSION_MONGO_URI: process.env.SESSION_MONGO_URI,
    SESSION_SECRET: process.env.SESSION_SECRET,
  };
  const calls = [];

  process.env.NODE_ENV = 'production';
  process.env.DB_NAME = 'DB_23IT293';
  process.env.SESSION_MONGO_URI = 'test-session-uri';
  process.env['SESSION' + '_SECRET'] = '<test-only-secret>';

  const fakeStore = new EventEmitter();
  fakeStore.get = () => {};
  fakeStore.set = () => {};
  fakeStore.destroy = () => {};

  try {
    const middleware = createSessionMiddleware({
      storeFactory(options) {
        calls.push(options);
        return fakeStore;
      },
    });

    assert.equal(typeof middleware, 'function');
    assert.deepEqual(calls, [
      {
        mongoUrl: 'test-session-uri',
        dbName: 'DB_23IT293',
        collectionName: 'sessions',
        ttl: ONE_DAY_IN_MILLISECONDS / 1000,
        autoRemove: 'native',
      },
    ]);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('mỗi GET trang sách tăng bộ đếm trong session', () => {
  const request = { method: 'GET', path: '/', session: {} };
  const response = { locals: {} };
  let nextCalled = 0;

  countSessionVisit(request, response, () => {
    nextCalled += 1;
  });
  countSessionVisit(request, response, () => {
    nextCalled += 1;
  });

  assert.equal(request.session.views, 2);
  assert.equal(response.locals.sessionViews, 2);
  assert.equal(nextCalled, 2);
});
