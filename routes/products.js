import express from 'express';
import { ProductRepository } from '../product-repository.js';
import { wantsJson } from '../middleware/auth.js';

// Rutas para gestionar productos
const router = express.Router();

const renderProductList = async (req, res) => {
  const products = await ProductRepository.list();

  if (wantsJson(req)) {
    return res.json(products);
  }

  return res.render('products', {
    products,
    user: req.session.user
  });
};

const createProduct = async (req, res) => {
  try {
    const product = await ProductRepository.create({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
      description: req.body.description
    });

    if (wantsJson(req)) {
      return res.status(201).json({ success: true, product });
    }

    return res.redirect('/products');
  } catch (error) {
    const products = await ProductRepository.list();

    if (wantsJson(req)) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(400).render('products', {
      products,
      user: req.session.user,
      error: error.message
    });
  }
};

const editProductForm = async (req, res) => {
  const product = await ProductRepository.getById(req.params.id);

  if (!product) {
    return res.status(404).send('Product not found');
  }

  return res.render('edit-product', {
    product,
    user: req.session.user
  });
};

const updateProduct = async (req, res) => {
  try {
    const product = await ProductRepository.update(req.params.id, {
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
      description: req.body.description
    });

    if (wantsJson(req)) {
      return res.json({ success: true, product });
    }

    return res.redirect('/products');
  } catch (error) {
    if (wantsJson(req)) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(400).send(error.message);
  }
};

const deleteProduct = async (req, res) => {
  try {
    await ProductRepository.remove(req.params.id);

    if (wantsJson(req)) {
      return res.json({ success: true });
    }

    return res.redirect('/products');
  } catch (error) {
    if (wantsJson(req)) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(400).send(error.message);
  }
};

router.get('/', renderProductList);
router.post('/', createProduct);
router.get('/:id/edit', editProductForm);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
