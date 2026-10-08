import crypto from 'node:crypto';
import DBLocal from 'db-local';

// Repositorio de productos en la base local
const { Schema } = new DBLocal({ path: './db' });

const Product = Schema('Product', {
  _id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  description: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export class ProductRepository {
  static async list() {
    return Product.find({}).sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getById(id) {
    return Product.findOne(id);
  }

  static async create(data) {
    Validation.product(data);

    const existing = await Product.findOne({ name: data.name.trim() });
    if (existing) {
      throw new Error('A product with the same name already exists');
    }

    const product = Product.create({
      _id: crypto.randomUUID(),
      name: data.name.trim(),
      category: data.category.trim(),
      price: Number(data.price),
      stock: Number(data.stock),
      description: String(data.description || '').trim()
    }).save();

    return product;
  }

  static async update(id, data) {
    Validation.product(data);

    const product = await Product.findOne(id);
    if (!product) {
      throw new Error('Product not found');
    }

    const duplicate = await Product.findOne({ name: data.name.trim() });
    if (duplicate && duplicate._id !== id) {
      throw new Error('A product with the same name already exists');
    }

    product.name = data.name.trim();
    product.category = data.category.trim();
    product.price = Number(data.price);
    product.stock = Number(data.stock);
    product.description = String(data.description || '').trim();
    product.save();

    return product;
  }

  static async remove(id) {
    const product = await Product.findOne(id);
    if (!product) {
      throw new Error('Product not found');
    }

    product.remove();
    return true;
  }
}

class Validation {
  static product({ name, category, price, stock, description }) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      throw new Error('The product name must have at least 2 characters');
    }

    if (typeof category !== 'string' || category.trim().length < 2) {
      throw new Error('The category must have at least 2 characters');
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      throw new Error('The price must be a positive number');
    }

    const numericStock = Number(stock);
    if (!Number.isInteger(numericStock) || numericStock < 0) {
      throw new Error('The stock must be a non-negative integer');
    }

    if (typeof description !== 'undefined' && description !== null && typeof description !== 'string') {
      throw new Error('The description must be a string');
    }
  }
}
