const express = require('express');
const { BookValidationError } = require('../domain/book');
const { listBooks, addBook } = require('../services/bookService');

function createBookRouter({ getReadDb, getWriteDb, productPrefix, vatRate }) {
  const router = express.Router();

  async function renderBookList(res, options = {}) {
    const books = await listBooks(getReadDb());

    return res.status(options.status ?? 200).render('books', {
      title: 'Ứng dụng Quản lý Sách',
      books,
      productPrefix,
      vatRate,
      error: options.error,
      success: options.success,
      values: options.values ?? {},
    });
  }

  router.get(['/', '/books'], async (req, res, next) => {
    try {
      await renderBookList(res, {
        success: req.query.added === '1' ? 'Đã thêm sách thành công.' : undefined,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/books', async (req, res, next) => {
    const values = {
      code: String(req.body.code ?? '').trim(),
      title: String(req.body.title ?? '').trim(),
      author: String(req.body.author ?? '').trim(),
      priceBeforeTax: String(req.body.priceBeforeTax ?? '').trim(),
    };

    try {
      await addBook(getWriteDb(), values, { productPrefix, vatRate });
      res.redirect('/?added=1');
    } catch (error) {
      if (error instanceof BookValidationError) {
        try {
          await renderBookList(res, {
            status: 422,
            error: error.message,
            values,
          });
        } catch (readError) {
          next(readError);
        }
        return;
      }

      next(error);
    }
  });

  return router;
}

module.exports = { createBookRouter };
