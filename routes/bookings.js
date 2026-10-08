import express from 'express';
import { ProductRepository } from '../product-repository.js';
import { BookingRepository } from '../booking-repository.js';
import { wantsJson } from '../middleware/auth.js';

// Rutas para gestionar reservas
const router = express.Router();

const parseBookingPayload = (req) => ({
  productId: String(req.body.productId || ''),
  userId: req.session.user.id,
  userName: req.session.user.username,
  bookingDate: String(req.body.bookingDate || ''),
  startTime: String(req.body.startTime || ''),
  endTime: String(req.body.endTime || ''),
  status: String(req.body.status || 'confirmed'),
  notes: String(req.body.notes || '')
});

const listBookings = async (req, res) => {
  try {
    const [bookings, products] = await Promise.all([
      BookingRepository.list(),
      ProductRepository.list()
    ]);

    if (wantsJson(req)) {
      return res.json({ bookings, products });
    }

    return res.render('bookings', {
      bookings,
      products,
      user: req.session.user
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const payload = parseBookingPayload(req);
    const booking = await BookingRepository.create(payload);

    if (wantsJson(req)) {
      return res.status(201).json({ success: true, booking });
    }

    return res.redirect('/bookings');
  } catch (error) {
    const products = await ProductRepository.list();

    if (wantsJson(req)) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(400).render('bookings', {
      products,
      bookings: [],
      user: req.session.user,
      error: error.message
    });
  }
};

const editBookingForm = async (req, res) => {
  try {
    const [booking, products] = await Promise.all([
      BookingRepository.getById(req.params.id),
      ProductRepository.list()
    ]);

    if (!booking) {
      return res.status(404).send('Reservation not found');
    }

    return res.render('edit-booking', {
      booking,
      products,
      user: req.session.user
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

const updateBooking = async (req, res) => {
  try {
    const booking = await BookingRepository.update(req.params.id, parseBookingPayload(req));

    if (wantsJson(req)) {
      return res.json({ success: true, booking });
    }

    return res.redirect('/bookings');
  } catch (error) {
    if (wantsJson(req)) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(400).send(error.message);
  }
};

const deleteBooking = async (req, res) => {
  try {
    await BookingRepository.remove(req.params.id);

    if (wantsJson(req)) {
      return res.json({ success: true });
    }

    return res.redirect('/bookings');
  } catch (error) {
    if (wantsJson(req)) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(400).send(error.message);
  }
};

router.get('/', listBookings);
router.post('/', createBooking);
router.get('/:id/edit', editBookingForm);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;
