const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BookValidationError,
  createBookDocument,
} = require('../src/domain/book');
const { listBooks, addBook } = require('../src/services/bookService');

const settings = {
  productPrefix: '293',
  vatRate: 9,
  now: new Date('2026-10-07T00:00:00.000Z'),
};

test('tạo sách hợp lệ với prefix 293 và tính VAT 9%', () => {
  const document = createBookDocument(
    {
      code: '293001',
      title: 'Điện toán đám mây',
      author: 'Huỳnh Tuấn Tú',
      priceBeforeTax: '100000',
    },
    settings,
  );

  assert.deepEqual(document, {
    code: '293001',
    title: 'Điện toán đám mây',
    author: 'Huỳnh Tuấn Tú',
    priceBeforeTax: 100000,
    vatRate: 9,
    priceAfterTax: 109000,
    createdAt: settings.now,
  });
});

test('từ chối mã sai prefix trước khi ghi', async () => {
  let insertCalled = false;
  const fakeWriteDb = {
    collection() {
      return {
        async insertOne() {
          insertCalled = true;
          return { insertedId: 'unexpected' };
        },
      };
    },
  };

  await assert.rejects(
    addBook(
      fakeWriteDb,
      { code: '123001', title: 'Sai prefix', priceBeforeTax: '100000' },
      settings,
    ),
    (error) => {
      assert.equal(error instanceof BookValidationError, true);
      assert.equal(error.message, 'Mã sản phẩm phải bắt đầu bằng 293.');
      return true;
    },
  );
  assert.equal(insertCalled, false);
});

test('luồng thêm sách gọi collection books của writeDb', async () => {
  const inserted = [];
  const fakeWriteDb = {
    collection(name) {
      assert.equal(name, 'books');
      return {
        async insertOne(document) {
          inserted.push(document);
          return { insertedId: 'book-id' };
        },
      };
    },
  };

  const result = await addBook(
    fakeWriteDb,
    { code: '293BOOK01', title: 'Cloud', priceBeforeTax: '100000' },
    settings,
  );

  assert.equal(inserted.length, 1);
  assert.equal(result._id, 'book-id');
  assert.equal(result.priceAfterTax, 109000);
});

test('luồng danh sách đọc books, sắp xếp mới nhất và giới hạn 100', async () => {
  const calls = [];
  const expectedBooks = [{ code: '293001' }];
  const cursor = {
    sort(specification) {
      calls.push(['sort', specification]);
      return this;
    },
    limit(value) {
      calls.push(['limit', value]);
      return this;
    },
    async toArray() {
      calls.push(['toArray']);
      return expectedBooks;
    },
  };
  const fakeReadDb = {
    collection(name) {
      calls.push(['collection', name]);
      return {
        find(query) {
          calls.push(['find', query]);
          return cursor;
        },
      };
    },
  };

  const books = await listBooks(fakeReadDb);

  assert.equal(books, expectedBooks);
  assert.deepEqual(calls, [
    ['collection', 'books'],
    ['find', {}],
    ['sort', { createdAt: -1, _id: -1 }],
    ['limit', 100],
    ['toArray'],
  ]);
});
