const { MongoClient } = require('mongodb');

let readClient;
let writeClient;
let readDb;
let writeDb;

function requireValue(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}.`);
  }

  return value;
}

async function connectDB() {
  if (readDb && writeDb) {
    return { readClient, writeClient, readDb, writeDb };
  }

  const dbName = requireValue('DB_NAME');
  const readUri = requireValue('READ_MONGO_URI');
  const writeUri = requireValue('WRITE_MONGO_URI');

  const nextReadClient = new MongoClient(readUri, {
    appName: 'books-reader-23IT293',
    serverSelectionTimeoutMS: 10000,
  });
  const nextWriteClient = new MongoClient(writeUri, {
    appName: 'books-writer-23IT293',
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await Promise.all([nextReadClient.connect(), nextWriteClient.connect()]);

    readClient = nextReadClient;
    writeClient = nextWriteClient;
    readDb = readClient.db(dbName);
    writeDb = writeClient.db(dbName);

    console.log(`Đã kết nối MongoDB cho luồng đọc và ghi trên database ${dbName}.`);
    return { readClient, writeClient, readDb, writeDb };
  } catch (error) {
    await Promise.allSettled([nextReadClient.close(), nextWriteClient.close()]);
    throw new Error('Không thể kết nối các tài khoản MongoDB đã cấu hình.', {
      cause: error,
    });
  }
}

async function closeDB() {
  await Promise.allSettled([readClient?.close(), writeClient?.close()]);

  readClient = undefined;
  writeClient = undefined;
  readDb = undefined;
  writeDb = undefined;
}

module.exports = {
  connectDB,
  closeDB,
  get readClient() {
    return readClient;
  },
  get writeClient() {
    return writeClient;
  },
  get readDb() {
    return readDb;
  },
  get writeDb() {
    return writeDb;
  },
};
