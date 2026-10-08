import crypto from 'node:crypto';
import DBLocal from 'db-local';
import { ProductRepository } from './product-repository.js';

// Repositorio de reservas y control de disponibilidad
const { Schema } = new DBLocal({ path: './db' });

const Booking = Schema('Booking', {
  _id: { type: String, required: true },
  productId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  bookingDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, default: 'confirmed' },
  notes: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export class BookingRepository {
  static async list() {
    const bookings = Booking.find({});
    return bookings.sort((a, b) => `${a.bookingDate} ${a.startTime}`.localeCompare(`${b.bookingDate} ${b.startTime}`));
  }

  static async getById(id) {
    return Booking.findOne(id);
  }

  static async create(data) {
    Validation.booking(data);
    const product = await ProductRepository.getById(data.productId);
    if (!product) {
      throw new Error('Selected product not found');
    }
    await this.ensureAvailability(data);

    const booking = Booking.create({
      _id: crypto.randomUUID(),
      productId: data.productId,
      userId: data.userId,
      userName: data.userName,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status || 'confirmed',
      notes: String(data.notes || '').trim()
    }).save();

    return booking;
  }

  static async update(id, data) {
    Validation.booking(data);

    const booking = await Booking.findOne(id);
    if (!booking) {
      throw new Error('Reservation not found');
    }

    const product = await ProductRepository.getById(data.productId);
    if (!product) {
      throw new Error('Selected product not found');
    }

    await this.ensureAvailability({ ...data, productId: data.productId, userId: booking.userId }, id);

    booking.productId = data.productId;
    booking.userId = booking.userId;
    booking.userName = data.userName;
    booking.bookingDate = data.bookingDate;
    booking.startTime = data.startTime;
    booking.endTime = data.endTime;
    booking.status = data.status || booking.status;
    booking.notes = String(data.notes || '').trim();
    booking.save();

    return booking;
  }

  static async remove(id) {
    const booking = await Booking.findOne(id);
    if (!booking) {
      throw new Error('Reservation not found');
    }

    booking.remove();
    return true;
  }

  static async ensureAvailability(data, ignoreId = null) {
    const bookings = await Booking.find({ productId: data.productId });

    for (const booking of bookings) {
      if (booking._id === ignoreId) continue;
      if (booking.bookingDate !== data.bookingDate) continue;

      if (this.hasOverlap(booking.startTime, booking.endTime, data.startTime, data.endTime)) {
        throw new Error('The selected time overlaps with another reservation for the same product');
      }
    }
  }

  static hasOverlap(startA, endA, startB, endB) {
    const startMinutesA = this.toMinutes(startA);
    const endMinutesA = this.toMinutes(endA);
    const startMinutesB = this.toMinutes(startB);
    const endMinutesB = this.toMinutes(endB);

    return startMinutesA < endMinutesB && startMinutesB < endMinutesA;
  }

  static toMinutes(time) {
    const [hours, minutes] = String(time).split(':').map(Number);
    return (hours * 60) + minutes;
  }
}

class Validation {
  static booking({ productId, userId, userName, bookingDate, startTime, endTime, notes }) {
    if (!productId || typeof productId !== 'string') {
      throw new Error('A valid product ID is required');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('A valid user ID is required');
    }

    if (!userName || typeof userName !== 'string' || userName.trim().length < 2) {
      throw new Error('A valid username is required');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(bookingDate)) {
      throw new Error('The booking date must follow the YYYY-MM-DD format');
    }

    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      throw new Error('The start and end time must follow the HH:MM format');
    }

    if (BookingRepository.toMinutes(startTime) >= BookingRepository.toMinutes(endTime)) {
      throw new Error('The end time must be later than the start time');
    }

    if (typeof notes !== 'undefined' && notes !== null && typeof notes !== 'string') {
      throw new Error('The notes field must be a string');
    }
  }
}
