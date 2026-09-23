import request from 'supertest';
import bcrypt from 'bcryptjs';

import app from '../app';
import Booking from '../models/Booking';
import Salon from '../models/Salon';
import Service from '../models/Service';
import User from '../models/User';
import {
  clearDatabase,
  closeTestDatabase,
  connectToTestDatabase
} from './mongoTestUtils';

describe('real MongoDB integration tests', () => {
  let salon: InstanceType<typeof Salon>;
  let service: InstanceType<typeof Service>;
  let stylist: InstanceType<typeof User>;

  beforeAll(connectToTestDatabase);
  afterAll(closeTestDatabase);

  beforeEach(async () => {
    await clearDatabase();

    // Seed the same records the endpoint reads from MongoDB.
    salon = await Salon.create({
      name: 'Integration Salon',
      location: 'London',
      openTime: '09:00',
      closeTime: '17:00'
    });
    service = await Service.create({
      name: 'Haircut',
      duration: 60,
      price: 35,
      salonId: salon._id
    });
    stylist = await User.create({
      name: 'Alex Stylist',
      email: `stylist-${Date.now()}@example.com`,
      password: await bcrypt.hash('Password123!', 10),
      role: 'stylist'
    });
  });

  it('returns slots from real salon, service, stylist, and booking documents', async () => {
    const response = await request(app)
      .get(`/api/salons/${salon._id}/available-slots`)
      .query({ date: '2026-10-01', serviceId: service._id.toString() });

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('Haircut');
    expect(response.body.availableSlots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          time: '09:00',
          stylistId: stylist._id.toString(),
          stylistName: 'Alex Stylist'
        })
      ])
    );
  });

  it('removes a slot when a real booking overlaps it', async () => {
    await Booking.create({
      salonId: salon._id,
      stylistId: stylist._id,
      customerId: stylist._id,
      serviceId: service._id,
      date: '2026-10-01',
      startTime: '09:00',
      endTime: '10:00',
      status: 'booked'
    });

    const response = await request(app)
      .get(`/api/salons/${salon._id}/available-slots`)
      .query({ date: '2026-10-01', serviceId: service._id.toString() });

    expect(response.status).toBe(200);
    expect(response.body.availableSlots).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ time: '09:00' })])
    );
    expect(response.body.availableSlots).toEqual(
      expect.arrayContaining([expect.objectContaining({ time: '10:00' })])
    );
  });
});
