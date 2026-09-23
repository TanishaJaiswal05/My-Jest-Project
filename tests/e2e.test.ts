import request from 'supertest';
import bcrypt from 'bcryptjs';

import app from '../app';
import Salon from '../models/Salon';
import Service from '../models/Service';
import User from '../models/User';
import {
  clearDatabase,
  closeTestDatabase,
  connectToTestDatabase
} from './mongoTestUtils';

describe('real MongoDB E2E booking workflow', () => {
  beforeAll(connectToTestDatabase);
  afterAll(closeTestDatabase);
  beforeEach(clearDatabase);

  it('registers, logs in, books, and cancels using persisted records', async () => {
    const email = `customer-${Date.now()}@example.com`;
    const stylist = await User.create({
      name: 'E2E Stylist',
      email: `e2e-stylist-${Date.now()}@example.com`,
      password: await bcrypt.hash('Password123!', 10),
      role: 'stylist'
    });
    const salon = await Salon.create({
      name: 'E2E Salon',
      location: 'Paris',
      openTime: '09:00',
      closeTime: '17:00'
    });
    const service = await Service.create({
      name: 'Colour',
      duration: 90,
      price: 80,
      salonId: salon._id
    });

    // Register and then verify that MongoDB contains the new customer.
    const registerResponse = await request(app).post('/api/register').send({
      name: 'E2E Customer',
      email,
      password: 'Password123!'
    });
    expect(registerResponse.status).toBe(201);
    const customer = await User.findOne({ email }).select('+password');
    expect(customer).not.toBeNull();

    // Login uses the persisted password and returns a real JWT.
    const loginResponse = await request(app).post('/api/login').send({
      email,
      password: 'Password123!'
    });
    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token;

    // Booking is authenticated with that JWT and persisted in MongoDB.
    const bookingResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        salonId: salon._id.toString(),
        stylistId: stylist._id.toString(),
        serviceId: service._id.toString(),
        slotTime: '10:00',
        date: '2026-10-01'
      });

    expect(bookingResponse.status).toBe(201);
    const bookingId = bookingResponse.body.booking._id;
    expect(bookingResponse.body.booking.endTime).toBe('11:30');

    // Cancellation updates the same persisted booking instead of a mock object.
    const cancelResponse = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelResponse.status).toBe(200);
    const cancelledBooking = await import('../models/Booking').then(({ default: Booking }) =>
      Booking.findById(bookingId)
    );
    expect(cancelledBooking?.status).toBe('cancelled');
    expect(customer?._id.toString()).toBe(bookingResponse.body.booking.customerId.toString());
  });
});
