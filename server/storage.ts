import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Truck,
  InsertTruck,
  Route,
  InsertRoute,
  Trip,
  InsertTrip,
  Crate,
  InsertCrate,
  Message,
  InsertMessage,
  MessageWithSender,
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getDrivers(): Promise<User[]>;
  
  // Truck operations
  getTruck(id: string): Promise<Truck | undefined>;
  getTruckByNumber(truckNumber: string): Promise<Truck | undefined>;
  createTruck(truck: InsertTruck): Promise<Truck>;
  updateTruck(id: string, truck: Partial<Truck>): Promise<Truck | undefined>;
  deleteTruck(id: string): Promise<boolean>;
  getAllTrucks(): Promise<Truck[]>;
  getAvailableTrucks(): Promise<Truck[]>;
  
  // Route operations
  getRoute(id: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: string, route: Partial<Route>): Promise<Route | undefined>;
  getAllRoutes(): Promise<Route[]>;
  
  // Trip operations
  getTrip(id: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, trip: Partial<Trip>): Promise<Trip | undefined>;
  deleteTrip(id: string): Promise<boolean>;
  getAllTrips(): Promise<Trip[]>;
  getTripsByDriver(driverId: string): Promise<Trip[]>;
  getOngoingTrips(): Promise<Trip[]>;
  
  // Crate operations
  getCrate(id: string): Promise<Crate | undefined>;
  getCrateByTrip(tripId: string): Promise<Crate | undefined>;
  createCrate(crate: InsertCrate): Promise<Crate>;
  updateCrate(id: string, crate: Partial<Crate>): Promise<Crate | undefined>;
  
  // Message operations
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getAllMessages(): Promise<MessageWithSender[]>;
  deleteMessage(id: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async getDrivers(): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.role, "driver"));
  }

  // Truck operations
  async getTruck(id: string): Promise<Truck | undefined> {
    const result = await db.select().from(schema.trucks).where(eq(schema.trucks.id, id));
    return result[0];
  }

  async getTruckByNumber(truckNumber: string): Promise<Truck | undefined> {
    const result = await db.select().from(schema.trucks).where(eq(schema.trucks.truckNumber, truckNumber));
    return result[0];
  }

  async createTruck(truck: InsertTruck): Promise<Truck> {
    const result = await db.insert(schema.trucks).values(truck).returning();
    return result[0];
  }

  async updateTruck(id: string, truck: Partial<Truck>): Promise<Truck | undefined> {
    const result = await db.update(schema.trucks).set(truck).where(eq(schema.trucks.id, id)).returning();
    return result[0];
  }

  async getAllTrucks(): Promise<Truck[]> {
    return await db.select().from(schema.trucks);
  }

  async getAvailableTrucks(): Promise<Truck[]> {
    return await db.select().from(schema.trucks).where(eq(schema.trucks.status, "available"));
  }

  // Route operations
  async getRoute(id: string): Promise<Route | undefined> {
    const result = await db.select().from(schema.routes).where(eq(schema.routes.id, id));
    return result[0];
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const result = await db.insert(schema.routes).values(route).returning();
    return result[0];
  }

  async updateRoute(id: string, route: Partial<Route>): Promise<Route | undefined> {
    const result = await db.update(schema.routes).set(route).where(eq(schema.routes.id, id)).returning();
    return result[0];
  }

  async getAllRoutes(): Promise<Route[]> {
    return await db.select().from(schema.routes);
  }

  // Trip operations
  async getTrip(id: string): Promise<Trip | undefined> {
    const result = await db.select().from(schema.trips).where(eq(schema.trips.id, id));
    return result[0];
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const result = await db.insert(schema.trips).values(trip).returning();
    return result[0];
  }

  async updateTrip(id: string, trip: Partial<Trip>): Promise<Trip | undefined> {
    const result = await db.update(schema.trips).set(trip).where(eq(schema.trips.id, id)).returning();
    return result[0];
  }

  async getAllTrips(): Promise<Trip[]> {
    return await db.select().from(schema.trips);
  }

  async getTripsByDriver(driverId: string): Promise<Trip[]> {
    return await db.select().from(schema.trips).where(eq(schema.trips.driverId, driverId));
  }

  async getOngoingTrips(): Promise<Trip[]> {
    return await db.select().from(schema.trips).where(eq(schema.trips.status, "ongoing"));
  }

  // Crate operations
  async getCrate(id: string): Promise<Crate | undefined> {
    const result = await db.select().from(schema.crates).where(eq(schema.crates.id, id));
    return result[0];
  }

  async getCrateByTrip(tripId: string): Promise<Crate | undefined> {
    const result = await db.select().from(schema.crates).where(eq(schema.crates.tripId, tripId));
    return result[0];
  }

  async createCrate(crate: InsertCrate): Promise<Crate> {
    const result = await db.insert(schema.crates).values(crate).returning();
    return result[0];
  }

  async updateCrate(id: string, crate: Partial<Crate>): Promise<Crate | undefined> {
    const result = await db.update(schema.crates).set({ ...crate, lastUpdated: new Date() }).where(eq(schema.crates.id, id)).returning();
    return result[0];
  }

  // Message operations
  async getMessage(id: string): Promise<Message | undefined> {
    const result = await db.select().from(schema.messages).where(eq(schema.messages.id, id));
    return result[0];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(schema.messages).values(message).returning();
    return result[0];
  }

  async getAllMessages(): Promise<MessageWithSender[]> {
    const messages = await db
      .select({
        id: schema.messages.id,
        senderId: schema.messages.senderId,
        senderName: schema.users.name,
        content: schema.messages.content,
        type: schema.messages.type,
        createdAt: schema.messages.createdAt,
      })
      .from(schema.messages)
      .leftJoin(schema.users, eq(schema.messages.senderId, schema.users.id))
      .orderBy(schema.messages.createdAt);
    
    return messages as MessageWithSender[];
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await db.delete(schema.messages).where(eq(schema.messages.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
