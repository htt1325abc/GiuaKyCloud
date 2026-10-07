const session = require('express-session');
const MongoStore = require('connect-mongo');

const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function requireValue(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}.`);
  }

  return value;
}

function createSessionMiddleware(options = {}) {
  const storeFactory = options.storeFactory ?? ((storeOptions) => MongoStore.create(storeOptions));
  const mongoUrl = requireValue('SESSION_MONGO_URI');
  const dbName = requireValue('DB_NAME');
  const secret = requireValue('SESSION_SECRET');
  const isProduction = process.env.NODE_ENV === 'production';

  const store = storeFactory({
    mongoUrl,
    dbName,
    collectionName: 'sessions',
    ttl: ONE_DAY_IN_MILLISECONDS / 1000,
    autoRemove: 'native',
  });

  store.on?.('error', (error) => {
    console.error(`MongoDB session store gặp lỗi: ${error.message}`);
  });

  return session({
    name: 'cloud.books.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    store,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: ONE_DAY_IN_MILLISECONDS,
    },
  });
}

function countSessionVisit(req, res, next) {
  const isBookPage = req.method === 'GET' && (req.path === '/' || req.path === '/books');

  if (isBookPage) {
    req.session.views = Number(req.session.views ?? 0) + 1;
    res.locals.sessionViews = req.session.views;
  }

  next();
}

module.exports = {
  ONE_DAY_IN_MILLISECONDS,
  createSessionMiddleware,
  countSessionVisit,
};
