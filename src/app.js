require('dotenv').config({ quiet: true });

const path = require('node:path');
const express = require('express');
const { engine } = require('express-handlebars');
const db = require('./config/db');
const { createBookRouter } = require('./routes/bookRoutes');
const {
  createSessionMiddleware,
  countSessionVisit,
} = require('./config/session');

function readNumberSetting(name) {
  const value = Number(process.env[name]);

  if (!Number.isFinite(value)) {
    throw new Error(`Biến môi trường ${name} phải là một số.`);
  }

  return value;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function createApp(options = {}) {
  const app = express();

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.engine(
    'hbs',
    engine({
      extname: '.hbs',
      defaultLayout: 'main',
      helpers: { formatCurrency },
    }),
  );
  app.set('view engine', 'hbs');
  app.set('views', path.join(__dirname, '..', 'views'));

  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(options.sessionMiddleware ?? createSessionMiddleware());
  app.use(countSessionVisit);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const productPrefix = options.productPrefix ?? process.env.PRODUCT_PREFIX?.trim() ?? '293';
  const vatRate = options.vatRate ?? readNumberSetting('VAT_RATE');
  const getReadDb = options.getReadDb ?? (() => db.readDb);
  const getWriteDb = options.getWriteDb ?? (() => db.writeDb);

  app.use(
    createBookRouter({
      getReadDb,
      getWriteDb,
      productPrefix,
      vatRate,
    }),
  );

  app.use((_req, res) => {
    res.status(404).render('error', {
      title: 'Không tìm thấy trang',
      message: 'Trang bạn yêu cầu không tồn tại.',
    });
  });

  app.use((error, _req, res, _next) => {
    console.error('Yêu cầu thất bại:', error.message);
    res.status(500).render('error', {
      title: 'Không thể xử lý yêu cầu',
      message: 'Ứng dụng chưa thể xử lý yêu cầu. Vui lòng thử lại sau.',
    });
  });

  return app;
}

async function startServer() {
  try {
    await db.connectDB();
    const app = createApp();
    const port = Number(process.env.PORT) || 3000;

    const server = app.listen(port, () => {
      console.log(`Server đang chạy tại cổng ${port}.`);
    });

    async function shutdown(signal) {
      console.log(`Đang dừng ứng dụng (${signal})...`);
      server.close(async () => {
        await db.closeDB();
        process.exit(0);
      });
    }

    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    await db.closeDB();
    throw error;
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Không thể khởi động ứng dụng: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { createApp, startServer };
