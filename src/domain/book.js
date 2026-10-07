class BookValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BookValidationError';
  }
}

function normalizeSettings(settings = {}) {
  const productPrefix = String(settings.productPrefix ?? '').trim();
  const vatRate = Number(settings.vatRate);

  if (!productPrefix) {
    throw new Error('PRODUCT_PREFIX chưa được cấu hình.');
  }

  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw new Error('VAT_RATE phải là một số từ 0 đến 100.');
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

  if (!code.startsWith(productPrefix)) {
    throw new BookValidationError(
      `Mã sản phẩm phải bắt đầu bằng ${productPrefix}.`,
    );
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
  const priceAfterTax = Math.round(
    normalizedPrice * (1 + vatRate / 100),
  );

  return {
    code,
    title,
    ...(author ? { author } : {}),
    priceBeforeTax: normalizedPrice,
    vatRate,
    priceAfterTax,
    createdAt: settings.now ?? new Date(),
  };
}

module.exports = {
  BookValidationError,
  createBookDocument,
};
