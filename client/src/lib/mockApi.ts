import MockAdapter from 'axios-mock-adapter';
import api from './api';

const mock = new MockAdapter(api, { delayResponse: 500 });

// MOCK DATA
const mockUser = { id: 'user-1', email: 'admin@transitops.io', firstName: 'Jenil', lastName: 'Soni', role: 'ADMIN' };
const mockVehicles = [
  { id: 'v1', registrationNumber: 'MH12AB1234', make: 'Tata', model: 'Prima', year: 2022, type: 'Truck', fuelType: 'DIESEL', maxLoadCapacity: 28000, currentOdometer: 45230, status: 'AVAILABLE', healthScore: 92 },
  { id: 'v2', registrationNumber: 'GJ05CD5678', make: 'Ashok Leyland', model: 'Dost+', year: 2021, type: 'Van', fuelType: 'DIESEL', maxLoadCapacity: 1800, currentOdometer: 72100, status: 'AVAILABLE', healthScore: 78 },
  { id: 'v3', registrationNumber: 'DL8CK9012', make: 'Mahindra', model: 'Supro', year: 2023, type: 'Van', fuelType: 'CNG', maxLoadCapacity: 750, currentOdometer: 12400, status: 'IN_SHOP', healthScore: 98 },
];
const mockDrivers = [
  { id: 'd1', licenseNumber: 'MH12-2010-1234567', firstName: 'Rajesh', lastName: 'Yadav', phone: '+91 9876543210', status: 'AVAILABLE', safetyScore: 85 },
  { id: 'd2', licenseNumber: 'GJ05-2015-7654321', firstName: 'Suresh', lastName: 'Patel', phone: '+91 9876543211', status: 'AVAILABLE', safetyScore: 92 },
];
const mockTrips = [
  { id: 't1', status: 'IN_PROGRESS', source: 'Mumbai', destination: 'Pune', cargoWeight: 15000, revenue: 45000, vehicle: mockVehicles[0], driver: mockDrivers[0] },
];
const mockStats = {
  totalVehicles: 15, availableVehicles: 8, vehiclesInShop: 2, vehiclesOnTrip: 5,
  activeTrips: 5, pendingTrips: 3, completedTrips: 12,
  activeDrivers: 10, availableDrivers: 4,
  fleetUtilization: 75,
  revenue: { currentMonth: 450000, previousMonth: 420000 },
  fuelCost: { currentMonth: 120000, previousMonth: 115000 },
  maintenanceCost: { currentMonth: 25000, previousMonth: 30000 },
};

// AUTH
mock.onPost('/auth/login').reply((config) => {
  const { email, password } = JSON.parse(config.data);
  
  if (email === 'admin@transitops.io' && password === 'Admin@123') {
    return [200, { token: 'mock-jwt-admin', user: { id: 'u1', email, firstName: 'Jenil', lastName: 'Soni', role: 'ADMIN' } }];
  }
  if (email === 'fleet@transitops.io' && password === 'Fleet@123') {
    return [200, { token: 'mock-jwt-fleet', user: { id: 'u2', email, firstName: 'Priya', lastName: 'Sharma', role: 'FLEET_MANAGER' } }];
  }
  if (email === 'dispatch@transitops.io' && password === 'Dispatch@123') {
    return [200, { token: 'mock-jwt-dispatch', user: { id: 'u3', email, firstName: 'Rohit', lastName: 'Kumar', role: 'DISPATCHER' } }];
  }

  return [401, { error: 'Invalid credentials. Use a valid demo account.' }];
});

mock.onGet('/auth/me').reply((config) => {
  const token = config.headers?.Authorization;
  if (token === 'Bearer mock-jwt-fleet') {
    return [200, { id: 'u2', email: 'fleet@transitops.io', firstName: 'Priya', lastName: 'Sharma', role: 'FLEET_MANAGER' }];
  }
  if (token === 'Bearer mock-jwt-dispatch') {
    return [200, { id: 'u3', email: 'dispatch@transitops.io', firstName: 'Rohit', lastName: 'Kumar', role: 'DISPATCHER' }];
  }
  return [200, { id: 'u1', email: 'admin@transitops.io', firstName: 'Jenil', lastName: 'Soni', role: 'ADMIN' }];
});

// DASHBOARD
mock.onGet('/dashboard/stats').reply(200, mockStats);

// VEHICLES
mock.onGet(/\/vehicles.*/).reply(200, mockVehicles);
mock.onPost('/vehicles').reply(201, mockVehicles[0]);
mock.onPut(/\/vehicles\/.+/).reply(200, mockVehicles[0]);

// DRIVERS
mock.onGet(/\/drivers.*/).reply(200, mockDrivers);
mock.onPost('/drivers').reply(201, mockDrivers[0]);
mock.onPut(/\/drivers\/.+/).reply(200, mockDrivers[0]);

// TRIPS
mock.onGet(/\/trips.*/).reply(200, mockTrips);
mock.onPost('/trips').reply(201, mockTrips[0]);

// MAINTENANCE
mock.onGet(/\/maintenance.*/).reply(200, []);

// FUEL & EXPENSES
mock.onGet(/\/fuel.*/).reply(200, []);
mock.onGet(/\/expenses.*/).reply(200, []);

// NOTIFICATIONS
mock.onGet(/\/notifications.*/).reply(200, [
  { id: 'n1', type: 'WARNING', title: 'License Expiring', message: 'Driver Rajesh Yadav license expires in 7 days.', read: false, createdAt: new Date().toISOString() }
]);

// SEARCH
mock.onGet(/\/search.*/).reply(200, { vehicles: mockVehicles, drivers: mockDrivers, trips: mockTrips });

console.log('🚀 Mock API enabled via axios-mock-adapter (Vercel Demo Mode)');
