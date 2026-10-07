class BookValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BookValidationError';
  }
}

function normalizeSettings(settings = {}) {
  const productPrefix = String(settings.productPrefix ?? '').trim();
  const vatRate = Number(settings.vatRate);

  if (productPrefix !== '293') {
    throw new Error('PRODUCT_PREFIX phải bằng 293.');
  }

  if (vatRate !== 9) {
    throw new Error('VAT_RATE phải bằng 9.');
  }

  return { productPrefix, vatRate };
}

function createBookDocument(input = {}, settings = {}) {
  const { productPrefix, vatRate } = normalizeSettings(settings);
  const code = String(input.code ?? '').trim();
  const title = String(input.title ?? '').trim();
  const author = String(input.author ?? '').trim();
  const priceBeforeTax = Number(input.priceBeforeTax);

  if (!code) {
    throw new BookValidationError('Vui lòng nhập mã sách.');
  }

  if (!code.startsWith('293')) {
    throw new BookValidationError('Mã sản phẩm phải bắt đầu bằng 293.');
  }

  if (!title) {
    throw new BookValidationError('Vui lòng nhập tên sách.');
  }

  if (!Number.isFinite(priceBeforeTax) || priceBeforeTax <= 0) {
    throw new BookValidationError('Giá trước thuế phải là số lớn hơn 0.');
  }

  if (!Number.isSafeInteger(Math.round(priceBeforeTax))) {
    throw new BookValidationError('Giá trước thuế vượt quá giới hạn cho phép.');
  }

  const normalizedPrice = Math.round(priceBeforeTax);
  const priceAfterTax = Math.round(normalizedPrice * (1 + 9 / 100));

  return {
    code,
    title,
    ...(author ? { author } : {}),
    priceBeforeTax: normalizedPrice,
    vatRate: 9,
    priceAfterTax,
    createdAt: settings.now ?? new Date(),
  };
}

module.exports = {
  BookValidationError,
  createBookDocument,
};
