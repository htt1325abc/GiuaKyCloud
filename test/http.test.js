const test = require('node:test');
const assert = require('node:assert/strict');

process.env.VAT_RATE = '9';

const { createApp } = require('../src/app');

function createFakeDatabases() {
  const books = [];

  const readDb = {
    collection(name) {
      assert.equal(name, 'books');
      return {
        find() {
          return {
            sort() {
              return this;
            },
            limit() {
              return this;
            },
            async toArray() {
              return [...books].reverse();
            },
          };
        },
      };
    },
  };

  const writeDb = {
    collection(name) {
      assert.equal(name, 'books');
      return {
        async insertOne(document) {
          books.push(document);
          return { insertedId: `book-${books.length}` };
        },
      };
    },
  };

  return { books, readDb, writeDb };
}

function fakeSessionMiddleware(req, _res, next) {
  req.session = { views: 0 };
  next();
}

async function withServer(run) {
  const databases = createFakeDatabases();
  const app = createApp({
    sessionMiddleware: fakeSessionMiddleware,
    getReadDb: () => databases.readDb,
    getWriteDb: () => databases.writeDb,
    productPrefix: '293',
    vatRate: 9,
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();

  try {
    await run(`http://127.0.0.1:${address.port}`, databases);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('GET / render giao diện bằng dữ liệu từ readDb', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Ứng dụng/);
    assert.match(html, /Quản lý Sách/);
    assert.match(html, /reader_23IT293/);
    assert.match(html, /1 lượt truy cập/);
  });
});

test('POST /books ghi sách hợp lệ và backend tính giá sau VAT', async () => {
  await withServer(async (baseUrl, databases) => {
    const response = await fetch(`${baseUrl}/books`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: '293001',
        title: 'Điện toán đám mây',
        author: 'Huỳnh Tuấn Tú',
        priceBeforeTax: '100000',
      }),
    });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/?added=1');
    assert.equal(databases.books.length, 1);
    assert.equal(databases.books[0].vatRate, 9);
    assert.equal(databases.books[0].priceAfterTax, 109000);
  });
});

test('POST /books từ chối prefix sai và không ghi dữ liệu', async () => {
  await withServer(async (baseUrl, databases) => {
    const response = await fetch(`${baseUrl}/books`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: '123001',
        title: 'Mã không hợp lệ',
        priceBeforeTax: '100000',
      }),
    });
    const html = await response.text();

    assert.equal(response.status, 422);
    assert.equal(databases.books.length, 0);
    assert.match(html, /Mã sản phẩm phải bắt đầu bằng 293/);
  });
});
