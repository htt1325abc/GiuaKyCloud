const { createBookDocument } = require('../domain/book');

async function listBooks(readDb) {
  if (!readDb) {
    throw new Error('Kết nối đọc MongoDB chưa sẵn sàng.');
  }

  return readDb
    .collection('books')
    .find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(100)
    .toArray();
}

async function addBook(writeDb, input, settings) {
  if (!writeDb) {
    throw new Error('Kết nối ghi MongoDB chưa sẵn sàng.');
  }

  const document = createBookDocument(input, settings);
  const result = await writeDb.collection('books').insertOne(document);

  return { ...document, _id: result.insertedId };
}

module.exports = { listBooks, addBook };
