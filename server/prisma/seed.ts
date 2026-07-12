import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://jenilrevaliya@localhost:5432/transitops_dev';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });



async function seed() {
  console.log('🌱 Seeding TransitOps database...');

  // ── Users ──────────────────────────────────────────────────────────────
  const hashedPassword = async (p: string) => bcrypt.hash(p, 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@transitops.io' },
      update: {},
      create: { email: 'admin@transitops.io', password: await hashedPassword('Admin@123'), firstName: 'Arjun', lastName: 'Patel', role: 'ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'fleet@transitops.io' },
      update: {},
      create: { email: 'fleet@transitops.io', password: await hashedPassword('Fleet@123'), firstName: 'Priya', lastName: 'Sharma', role: 'FLEET_MANAGER' },
    }),
    prisma.user.upsert({
      where: { email: 'dispatch@transitops.io' },
      update: {},
      create: { email: 'dispatch@transitops.io', password: await hashedPassword('Dispatch@123'), firstName: 'Rohit', lastName: 'Kumar', role: 'DISPATCHER' },
    }),
    prisma.user.upsert({
      where: { email: 'safety@transitops.io' },
      update: {},
      create: { email: 'safety@transitops.io', password: await hashedPassword('Safety@123'), firstName: 'Meera', lastName: 'Desai', role: 'SAFETY_OFFICER' },
    }),
    prisma.user.upsert({
      where: { email: 'finance@transitops.io' },
      update: {},
      create: { email: 'finance@transitops.io', password: await hashedPassword('Finance@123'), firstName: 'Vikram', lastName: 'Singh', role: 'FINANCE_MANAGER' },
    }),
    prisma.user.upsert({
      where: { email: 'driver@transitops.io' },
      update: {},
      create: { email: 'driver@transitops.io', password: await hashedPassword('Driver@123'), firstName: 'Rajesh', lastName: 'Yadav', role: 'DRIVER' },
    }),
  ]);
  console.log(`  Created ${users.length} users`);

  // ── Vehicles ───────────────────────────────────────────────────────────
  const vehicleData = [
    { registrationNumber: 'MH12AB1234', make: 'Tata', model: 'Prima 4028', year: 2022, type: 'Truck', fuelType: 'DIESEL' as const, maxLoadCapacity: 28000, currentOdometer: 45230, acquisitionCost: 3500000, healthScore: 92 },
    { registrationNumber: 'GJ05CD5678', make: 'Ashok Leyland', model: 'Dost+', year: 2021, type: 'Van', fuelType: 'DIESEL' as const, maxLoadCapacity: 1800, currentOdometer: 72100, acquisitionCost: 950000, healthScore: 78 },
    { registrationNumber: 'DL8CK9012', make: 'Mahindra', model: 'Supro', year: 2023, type: 'Van', fuelType: 'CNG' as const, maxLoadCapacity: 750, currentOdometer: 12400, acquisitionCost: 620000, healthScore: 98 },
    { registrationNumber: 'MH04EF3456', make: 'Eicher', model: 'Pro 2095', year: 2020, type: 'Truck', fuelType: 'DIESEL' as const, maxLoadCapacity: 9500, currentOdometer: 98700, acquisitionCost: 1650000, healthScore: 65, status: 'IN_SHOP' as const },
    { registrationNumber: 'KA02GH7890', make: 'Volvo', model: 'B11R', year: 2022, type: 'Bus', fuelType: 'DIESEL' as const, maxLoadCapacity: 0, currentOdometer: 38600, acquisitionCost: 7200000, healthScore: 88 },
    { registrationNumber: 'TN09IJ2345', make: 'Toyota', model: 'Innova Crysta', year: 2023, type: 'Car', fuelType: 'PETROL' as const, maxLoadCapacity: 500, currentOdometer: 18900, acquisitionCost: 1950000, healthScore: 95 },
    { registrationNumber: 'MH14KL6789', make: 'Force', model: 'Traveller 3700', year: 2021, type: 'Van', fuelType: 'DIESEL' as const, maxLoadCapacity: 1500, currentOdometer: 54300, acquisitionCost: 890000, healthScore: 82 },
    { registrationNumber: 'GJ01MN0123', make: 'Tata', model: 'Ace Gold', year: 2022, type: 'Truck', fuelType: 'DIESEL' as const, maxLoadCapacity: 740, currentOdometer: 31200, acquisitionCost: 680000, healthScore: 90 },
    { registrationNumber: 'RJ14OP4567', make: 'Ashok Leyland', model: 'Viking', year: 2019, type: 'Bus', fuelType: 'DIESEL' as const, maxLoadCapacity: 0, currentOdometer: 145000, acquisitionCost: 4800000, healthScore: 58, status: 'IN_SHOP' as const },
    { registrationNumber: 'UP32QR8901', make: 'Mahindra', model: 'Bolero Pik-Up', year: 2021, type: 'Truck', fuelType: 'DIESEL' as const, maxLoadCapacity: 1400, currentOdometer: 67800, acquisitionCost: 820000, healthScore: 74 },
    { registrationNumber: 'MH01ST2345', make: 'Tata', model: 'Winger', year: 2023, type: 'Van', fuelType: 'DIESEL' as const, maxLoadCapacity: 1200, currentOdometer: 9600, acquisitionCost: 780000, healthScore: 99 },
    { registrationNumber: 'HR26UV6789', make: 'Maruti', model: 'Eeco', year: 2022, type: 'Van', fuelType: 'CNG' as const, maxLoadCapacity: 600, currentOdometer: 24500, acquisitionCost: 560000, healthScore: 87 },
    { registrationNumber: 'PB10WX0123', make: 'BYD', model: 'T3', year: 2023, type: 'Van', fuelType: 'ELECTRIC' as const, maxLoadCapacity: 1000, currentOdometer: 8200, acquisitionCost: 1200000, healthScore: 100 },
    { registrationNumber: 'MH02YZ4567', make: 'Tata', model: 'Starbus Ultra', year: 2022, type: 'Bus', fuelType: 'DIESEL' as const, maxLoadCapacity: 0, currentOdometer: 41700, acquisitionCost: 5600000, healthScore: 85 },
    { registrationNumber: 'GJ06AB8901', make: 'Eicher', model: 'Pro 3018', year: 2021, type: 'Truck', fuelType: 'DIESEL' as const, maxLoadCapacity: 18000, currentOdometer: 86400, acquisitionCost: 2100000, healthScore: 72 },
  ];

  const vehicles = [];
  for (const v of vehicleData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { registrationNumber: v.registrationNumber },
      update: {},
      create: {
        ...v,
        status: (v as any).status || 'AVAILABLE',
        insuranceExpiry: new Date('2025-12-31'),
        registrationExpiry: new Date('2026-03-31'),
        fitnessExpiry: new Date('2025-09-30'),
      },
    });
    vehicles.push(vehicle);
  }
  console.log(`  Created ${vehicles.length} vehicles`);

  // ── Drivers ────────────────────────────────────────────────────────────
  const driverData = [
    { firstName: 'Rajesh', lastName: 'Yadav', phone: '9876543210', licenseNumber: 'MH1420180012345', licenseCategory: 'HTV', licenseExpiry: new Date('2027-06-15'), safetyScore: 94 },
    { firstName: 'Suresh', lastName: 'Patil', phone: '9876543211', licenseNumber: 'GJ0520190023456', licenseCategory: 'HTV', licenseExpiry: new Date('2026-09-20'), safetyScore: 87 },
    { firstName: 'Mohan', lastName: 'Verma', phone: '9876543212', licenseNumber: 'DL0120200034567', licenseCategory: 'LTV', licenseExpiry: new Date('2025-08-10'), safetyScore: 79 },
    { firstName: 'Ravi', lastName: 'Singh', phone: '9876543213', licenseNumber: 'KA0220180045678', licenseCategory: 'HTV', licenseExpiry: new Date('2026-03-05'), safetyScore: 96 },
    { firstName: 'Anand', lastName: 'Mehta', phone: '9876543214', licenseNumber: 'TN0920210056789', licenseCategory: 'LTV', licenseExpiry: new Date('2028-01-25'), safetyScore: 91 },
    { firstName: 'Vinod', lastName: 'Joshi', phone: '9876543215', licenseNumber: 'MH1420190067890', licenseCategory: 'HTV', licenseExpiry: new Date('2025-11-30'), safetyScore: 68 },
    { firstName: 'Prakash', lastName: 'Nair', phone: '9876543216', licenseNumber: 'KL0820200078901', licenseCategory: 'HTV', licenseExpiry: new Date('2027-04-18'), safetyScore: 85 },
    { firstName: 'Dinesh', lastName: 'Shah', phone: '9876543217', licenseNumber: 'GJ0120210089012', licenseCategory: 'LTV', licenseExpiry: new Date('2026-07-22'), safetyScore: 77 },
    { firstName: 'Ramesh', lastName: 'Gupta', phone: '9876543218', licenseNumber: 'UP3220180090123', licenseCategory: 'HTV', licenseExpiry: new Date('2025-05-14'), safetyScore: 61 },
    { firstName: 'Harish', lastName: 'Pillai', phone: '9876543219', licenseNumber: 'MH0120220001234', licenseCategory: 'HTV', licenseExpiry: new Date('2029-02-28'), safetyScore: 98 },
  ];

  const drivers = [];
  for (const d of driverData) {
    const driver = await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: {},
      create: d,
    });
    drivers.push(driver);
  }
  console.log(`  Created ${drivers.length} drivers`);

  // ── Trips ──────────────────────────────────────────────────────────────
  const tripStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'IN_PROGRESS', 'DISPATCHED', 'SCHEDULED', 'DRAFT', 'CANCELLED'];
  const routes = [
    { source: 'Mumbai, Maharashtra', sourceLat: 19.076, sourceLng: 72.8777, destination: 'Pune, Maharashtra', destLat: 18.5204, destLng: 73.8567, distancePlanned: 148 },
    { source: 'Ahmedabad, Gujarat', sourceLat: 23.0225, sourceLng: 72.5714, destination: 'Surat, Gujarat', destLat: 21.1702, destLng: 72.8311, distancePlanned: 265 },
    { source: 'Delhi, NCR', sourceLat: 28.6139, sourceLng: 77.209, destination: 'Jaipur, Rajasthan', destLat: 26.9124, destLng: 75.7873, distancePlanned: 282 },
    { source: 'Bengaluru, Karnataka', sourceLat: 12.9716, sourceLng: 77.5946, destination: 'Chennai, Tamil Nadu', destLat: 13.0827, destLng: 80.2707, distancePlanned: 346 },
    { source: 'Hyderabad, Telangana', sourceLat: 17.385, sourceLng: 78.4867, destination: 'Vijayawada, AP', destLat: 16.5062, destLng: 80.648, distancePlanned: 275 },
  ];

  const adminUser = users[0];
  const trips = [];
  for (let i = 0; i < 12; i++) {
    const status = tripStatuses[i % tripStatuses.length] as any;
    const route = routes[i % routes.length];
    const vehicle = vehicles[i % vehicles.length];
    const driver = drivers[i % drivers.length];
    const tripNum = `TR26${String(i + 1).padStart(4, '0')}`;

    const existing = await prisma.trip.findUnique({ where: { tripNumber: tripNum } });
    if (existing) { trips.push(existing); continue; }

    const trip = await prisma.trip.create({
      data: {
        tripNumber: tripNum,
        vehicleId: vehicle.id,
        driverId: driver.id,
        dispatcherId: adminUser.id,
        ...route,
        cargoType: ['General Goods', 'Perishables', 'Electronics', 'Auto Parts', 'Textiles'][i % 5],
        cargoWeight: [5000, 1200, 800, 3000, 1500][i % 5],
        status,
        scheduledStart: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        actualStart: ['COMPLETED', 'IN_PROGRESS'].includes(status) ? new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + 3600000) : null,
        actualEnd: status === 'COMPLETED' ? new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + 18000000) : null,
        revenue: [45000, 12000, 8500, 32000, 15000][i % 5],
        trackingToken: `track-${Math.random().toString(36).slice(2)}`,
      },
    });
    trips.push(trip);
  }
  console.log(`  Created ${trips.length} trips`);

  // ── Maintenance ────────────────────────────────────────────────────────
  const maintenanceData = [
    { vehicleId: vehicles[3].id, type: 'CORRECTIVE' as const, description: 'Engine oil leak repair', status: 'IN_PROGRESS' as const, cost: 25000, scheduledDate: new Date() },
    { vehicleId: vehicles[8].id, type: 'PREVENTIVE' as const, description: 'Scheduled 50,000 km service', status: 'SCHEDULED' as const, cost: 18000, scheduledDate: new Date(Date.now() + 86400000 * 2) },
    { vehicleId: vehicles[0].id, type: 'INSPECTION' as const, description: 'Annual fitness certificate renewal', status: 'COMPLETED' as const, cost: 5000, completedAt: new Date(Date.now() - 86400000 * 5) },
    { vehicleId: vehicles[1].id, type: 'PREVENTIVE' as const, description: 'Brake pad replacement', status: 'COMPLETED' as const, cost: 8500, completedAt: new Date(Date.now() - 86400000 * 10) },
    { vehicleId: vehicles[4].id, type: 'EMERGENCY' as const, description: 'Tyre blowout, 2 tyres replaced', status: 'COMPLETED' as const, cost: 32000, completedAt: new Date(Date.now() - 86400000 * 3) },
  ];

  for (const m of maintenanceData) {
    await prisma.maintenance.create({ data: m });
  }
  console.log(`  Created ${maintenanceData.length} maintenance records`);

  // ── Fuel Logs ──────────────────────────────────────────────────────────
  const adminId = adminUser.id;
  for (let i = 0; i < 20; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const qty = 50 + Math.random() * 150;
    const cpu = 90 + Math.random() * 20;
    await prisma.fuelLog.create({
      data: {
        vehicleId: vehicle.id,
        loggedById: adminId,
        quantity: Math.round(qty * 10) / 10,
        costPerUnit: Math.round(cpu * 100) / 100,
        totalCost: Math.round(qty * cpu),
        odometer: vehicle.currentOdometer + i * 200,
        station: ['HP Fuel Station', 'Indian Oil Pump', 'BPCL Station', 'Shell Outlet'][i % 4],
        isAnomaly: i === 7 || i === 15,
        createdAt: new Date(Date.now() - i * 36 * 3600000),
      },
    });
  }
  console.log(`  Created 20 fuel logs`);

  // ── Expenses ───────────────────────────────────────────────────────────
  const expenseCategories: any[] = ['TOLL', 'MAINTENANCE', 'INSURANCE', 'TOLL', 'OTHER', 'TOLL', 'MAINTENANCE'];
  for (let i = 0; i < 15; i++) {
    await prisma.expense.create({
      data: {
        loggedById: adminId,
        category: expenseCategories[i % expenseCategories.length],
        amount: [350, 5000, 45000, 280, 1200, 420, 8500][i % 7],
        description: ['NH Highway Toll', 'AC Repair', 'Annual Insurance', 'Expressway Toll', 'Parking', 'State Highway Toll', 'Battery Replacement'][i % 7],
        createdAt: new Date(Date.now() - i * 2 * 24 * 3600000),
      },
    });
  }
  console.log(`  Created 15 expenses`);

  // ── Notifications ──────────────────────────────────────────────────────
  const notifData = [
    { type: 'LICENSE_EXPIRY', title: 'License Expiry Warning', message: 'Driver Vinod Joshi license expires in 18 days (MH1420190067890)', isRead: false },
    { type: 'LICENSE_EXPIRY', title: 'License Expiry Warning', message: 'Driver Ramesh Gupta license expires in 35 days (UP3220180090123)', isRead: false },
    { type: 'MAINTENANCE_DUE', title: 'Preventive Maintenance Due', message: 'Vehicle GJ05CD5678 is approaching 75,000 km service interval', isRead: false },
    { type: 'FUEL_ANOMALY', title: 'Fuel Anomaly Detected', message: 'Unusually high fuel cost logged for MH14KL6789 on July 10', isRead: false },
    { type: 'INSPECTION_FAILED', title: 'Inspection Failed', message: 'Vehicle RJ14OP4567 failed fitness check - brake system', isRead: true },
    { type: 'TRIP_UPDATE', title: 'Trip Completed', message: 'Trip TR260003 Mumbai to Pune completed successfully', isRead: true },
    { type: 'SYSTEM', title: 'System Health', message: 'Fleet utilization is at 72% - above target threshold', isRead: true },
    { type: 'MAINTENANCE_DUE', title: 'Insurance Renewal Due', message: 'Vehicle MH04EF3456 insurance expires on Sep 30, 2025', isRead: false },
  ];

  for (const n of notifData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`  Created ${notifData.length} notifications`);

  // ── Vehicle Timelines ──────────────────────────────────────────────────
  for (let i = 0; i < vehicles.length; i++) {
    await prisma.vehicleTimeline.create({
      data: { vehicleId: vehicles[i].id, eventType: 'CREATED', title: 'Vehicle registered in fleet', createdAt: new Date(Date.now() - 90 * 24 * 3600000) },
    });
  }
  for (let i = 0; i < Math.min(trips.length, 8); i++) {
    const trip = trips[i];
    if (['COMPLETED', 'IN_PROGRESS'].includes(trip.status)) {
      await prisma.vehicleTimeline.create({
        data: { vehicleId: trip.vehicleId, eventType: 'TRIP_STARTED', title: `Trip ${trip.tripNumber} started`, details: `${trip.source} to ${trip.destination}`, createdAt: trip.actualStart || new Date() },
      });
    }
    if (trip.status === 'COMPLETED') {
      await prisma.vehicleTimeline.create({
        data: { vehicleId: trip.vehicleId, eventType: 'TRIP_COMPLETED', title: `Trip ${trip.tripNumber} completed`, details: `Distance: ${trip.distancePlanned} km`, createdAt: trip.actualEnd || new Date() },
      });
    }
  }
  console.log(`  Created vehicle timeline events`);

  console.log('\n✅ Seeding complete!\n');
  console.log('Demo Accounts:');
  console.log('  admin@transitops.io    | Admin@123    | ADMIN');
  console.log('  fleet@transitops.io    | Fleet@123    | FLEET_MANAGER');
  console.log('  dispatch@transitops.io | Dispatch@123 | DISPATCHER');
  console.log('  safety@transitops.io   | Safety@123   | SAFETY_OFFICER');
  console.log('  finance@transitops.io  | Finance@123  | FINANCE_MANAGER');
  console.log('  driver@transitops.io   | Driver@123   | DRIVER\n');
}

seed()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
