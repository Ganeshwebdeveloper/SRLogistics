import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, lt, gte, lte, between, desc, inArray, sql as sqlQuery } from "drizzle-orm";
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
  CrateDailyBalance,
  InsertCrateDailyBalance,
  CrateAdjustment,
  InsertCrateAdjustment,
  DailyBalanceWithRoute,
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
  deleteRoute(id: string): Promise<boolean>;
  getAllRoutes(): Promise<Route[]>;
  getAvailableRoutes(): Promise<Route[]>;
  
  // Trip operations
  getTrip(id: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, trip: Partial<Trip>): Promise<Trip | undefined>;
  deleteTrip(id: string): Promise<boolean>;
  getAllTrips(): Promise<Trip[]>;
  getTripsByDriver(driverId: string): Promise<Trip[]>;
  getOngoingTrips(): Promise<Trip[]>;
  
  // Crate operations (attendance tracking)
  getCrate(id: string): Promise<Crate | undefined>;
  getCratesByRoute(routeId: string): Promise<Crate[]>;
  getCratesByDriver(driverId: string): Promise<Crate[]>;
  getAllCrates(): Promise<Crate[]>;
  createCrate(crate: InsertCrate): Promise<Crate>;
  updateCrate(id: string, crate: Partial<Crate>): Promise<Crate | undefined>;
  
  // Message operations
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getAllMessages(): Promise<MessageWithSender[]>;
  deleteMessage(id: string): Promise<boolean>;
  deleteOldImageMessages(hours: number): Promise<number>;
  deleteOldMessages(days: number): Promise<number>;
  
  // Crate Daily Balance operations
  getDailyBalance(routeId: string, date: Date): Promise<CrateDailyBalance | undefined>;
  getDailyBalancesByDateRange(routeIds: string[], startDate: Date, endDate: Date): Promise<DailyBalanceWithRoute[]>;
  createOrUpdateDailyBalance(balance: InsertCrateDailyBalance): Promise<CrateDailyBalance>;
  
  // Crate Adjustment operations
  createAdjustment(adjustment: InsertCrateAdjustment): Promise<CrateAdjustment>;
  getAdjustmentsByBalance(dailyBalanceId: string): Promise<CrateAdjustment[]>;
  
  // Combined operation for adjusting crate count
  adjustCrateCount(routeId: string, date: Date, delta: number, actorId: string, remarks?: string): Promise<CrateDailyBalance>;
  
  // Set exact crate count value
  setCrateCount(routeId: string, date: Date, count: number, actorId: string, remarks?: string): Promise<CrateDailyBalance>;
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

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id)).returning();
    return result.length > 0;
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

  async deleteTruck(id: string): Promise<boolean> {
    const result = await db.delete(schema.trucks).where(eq(schema.trucks.id, id)).returning();
    return result.length > 0;
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

  async deleteRoute(id: string): Promise<boolean> {
    const result = await db.delete(schema.routes).where(eq(schema.routes.id, id)).returning();
    return result.length > 0;
  }

  async getAllRoutes(): Promise<Route[]> {
    return await db.select().from(schema.routes);
  }

  async getAvailableRoutes(): Promise<Route[]> {
    return await db.select().from(schema.routes).where(eq(schema.routes.status, "available"));
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

  async deleteTrip(id: string): Promise<boolean> {
    const result = await db.delete(schema.trips).where(eq(schema.trips.id, id)).returning();
    return result.length > 0;
  }

  // Crate operations (attendance tracking)
  async getCrate(id: string): Promise<Crate | undefined> {
    const result = await db.select().from(schema.crates).where(eq(schema.crates.id, id));
    return result[0];
  }

  async getCratesByRoute(routeId: string): Promise<Crate[]> {
    return await db.select().from(schema.crates).where(eq(schema.crates.routeId, routeId));
  }

  async getCratesByDriver(driverId: string): Promise<Crate[]> {
    return await db.select().from(schema.crates).where(eq(schema.crates.driverId, driverId));
  }

  async getAllCrates(): Promise<Crate[]> {
    return await db.select().from(schema.crates);
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
        senderRole: schema.users.role,
        content: schema.messages.content,
        type: schema.messages.type,
        createdAt: schema.messages.createdAt,
      })
      .from(schema.messages)
      .leftJoin(schema.users, eq(schema.messages.senderId, schema.users.id))
      .orderBy(schema.messages.createdAt);
    
    return messages as MessageWithSender[];
  }
  
  async deleteOldImageMessages(hours: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    
    const result = await db
      .delete(schema.messages)
      .where(
        and(
          eq(schema.messages.type, "image"),
          lt(schema.messages.createdAt, cutoffDate)
        )
      )
      .returning();
    
    return result.length;
  }

  async deleteOldMessages(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await db
      .delete(schema.messages)
      .where(lt(schema.messages.createdAt, cutoffDate))
      .returning();
    
    return result.length;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await db.delete(schema.messages).where(eq(schema.messages.id, id)).returning();
    return result.length > 0;
  }

  // Crate Daily Balance operations
  async getDailyBalance(routeId: string, date: Date): Promise<CrateDailyBalance | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select()
      .from(schema.crateDailyBalances)
      .where(
        and(
          eq(schema.crateDailyBalances.routeId, routeId),
          gte(schema.crateDailyBalances.date, startOfDay),
          lte(schema.crateDailyBalances.date, endOfDay)
        )
      );
    return result[0];
  }

  async getDailyBalancesByDateRange(
    routeIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyBalanceWithRoute[]> {
    if (routeIds.length === 0) return [];

    const balances = await db
      .select({
        id: schema.crateDailyBalances.id,
        routeId: schema.crateDailyBalances.routeId,
        routeName: schema.routes.routeName,
        date: schema.crateDailyBalances.date,
        openingCount: schema.crateDailyBalances.openingCount,
        closingCount: schema.crateDailyBalances.closingCount,
        createdAt: schema.crateDailyBalances.createdAt,
        updatedAt: schema.crateDailyBalances.updatedAt,
      })
      .from(schema.crateDailyBalances)
      .leftJoin(schema.routes, eq(schema.crateDailyBalances.routeId, schema.routes.id))
      .where(
        and(
          inArray(schema.crateDailyBalances.routeId, routeIds),
          gte(schema.crateDailyBalances.date, startDate),
          lte(schema.crateDailyBalances.date, endDate)
        )
      )
      .orderBy(schema.crateDailyBalances.date);

    return balances as DailyBalanceWithRoute[];
  }

  async createOrUpdateDailyBalance(balance: InsertCrateDailyBalance): Promise<CrateDailyBalance> {
    const existing = await this.getDailyBalance(balance.routeId, balance.date);

    if (existing) {
      const result = await db
        .update(schema.crateDailyBalances)
        .set({ ...balance, updatedAt: new Date() })
        .where(eq(schema.crateDailyBalances.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(schema.crateDailyBalances)
        .values(balance)
        .returning();
      return result[0];
    }
  }

  // Crate Adjustment operations
  async createAdjustment(adjustment: InsertCrateAdjustment): Promise<CrateAdjustment> {
    const result = await db
      .insert(schema.crateAdjustments)
      .values(adjustment)
      .returning();
    return result[0];
  }

  async getAdjustmentsByBalance(dailyBalanceId: string): Promise<CrateAdjustment[]> {
    return await db
      .select()
      .from(schema.crateAdjustments)
      .where(eq(schema.crateAdjustments.dailyBalanceId, dailyBalanceId))
      .orderBy(desc(schema.crateAdjustments.createdAt));
  }

  // Combined operation for adjusting crate count
  async adjustCrateCount(
    routeId: string,
    date: Date,
    delta: number,
    actorId: string,
    remarks?: string
  ): Promise<CrateDailyBalance> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const existingBalance = await this.getDailyBalance(routeId, normalizedDate);
    
    let openingCount: number;
    let closingCount: number;
    
    if (existingBalance) {
      openingCount = existingBalance.openingCount;
      closingCount = existingBalance.closingCount + delta;
    } else {
      const route = await this.getRoute(routeId);
      openingCount = route?.crateCount || 100;
      closingCount = openingCount + delta;
    }

    const balance = await this.createOrUpdateDailyBalance({
      routeId,
      date: normalizedDate,
      openingCount,
      closingCount,
    });

    await this.createAdjustment({
      dailyBalanceId: balance.id,
      delta,
      actorId,
      remarks: remarks || null,
    });

    return balance;
  }

  // Set exact crate count value
  async setCrateCount(
    routeId: string,
    date: Date,
    count: number,
    actorId: string,
    remarks?: string
  ): Promise<CrateDailyBalance> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const existingBalance = await this.getDailyBalance(routeId, normalizedDate);
    
    let openingCount: number;
    let delta: number;
    
    if (existingBalance) {
      openingCount = existingBalance.openingCount;
      delta = count - existingBalance.closingCount;
    } else {
      const route = await this.getRoute(routeId);
      openingCount = route?.crateCount || 100;
      delta = count - openingCount;
    }

    const balance = await this.createOrUpdateDailyBalance({
      routeId,
      date: normalizedDate,
      openingCount,
      closingCount: count,
    });

    if (delta !== 0) {
      await this.createAdjustment({
        dailyBalanceId: balance.id,
        delta,
        actorId,
        remarks: remarks || null,
      });
    }

    return balance;
  }
}

export const storage = new DbStorage();
