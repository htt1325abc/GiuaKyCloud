require('dotenv').config();

const path = require('node:path');
const express = require('express');
const { engine } = require('express-handlebars');

function createApp() {
  const app = express();

  app.engine(
    'hbs',
    engine({
      extname: '.hbs',
      defaultLayout: 'main',
    }),
  );
  app.set('view engine', 'hbs');
  app.set('views', path.join(__dirname, '..', 'views'));

  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/', (_req, res) => {
    res.render('home', {
      title: 'Ứng dụng Quản lý Sách',
    });
  });

  return app;
}

function startServer() {
  const app = createApp();
  const port = Number(process.env.PORT) || 3000;

  return app.listen(port, () => {
    console.log(`Server đang chạy tại cổng ${port}.`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
