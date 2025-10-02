import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("driver"), // 'admin' or 'driver'
  status: text("status").notNull().default("active"), // 'active' or 'inactive'
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Trucks table
export const trucks = pgTable("trucks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  truckNumber: text("truck_number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  status: text("status").notNull().default("available"), // 'available' or 'busy'
});

export const insertTruckSchema = createInsertSchema(trucks).omit({
  id: true,
});

export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type Truck = typeof trucks.$inferSelect;

// Routes table
export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  routeName: text("route_name"),
  notes: text("notes"),
  crateCount: integer("crate_count").notNull().default(100),
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
});

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

// Trips table
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  truckId: varchar("truck_id").notNull().references(() => trucks.id),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  routeId: varchar("route_id").notNull().references(() => routes.id),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  distanceTravelled: decimal("distance_travelled", { precision: 10, scale: 2 }).default("0"),
  avgSpeed: decimal("avg_speed", { precision: 10, scale: 2 }).default("0"),
  currentLocation: text("current_location"),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'ongoing', or 'completed'
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
});

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

// Crates table
export const crates = pgTable("crates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id),
  initialCount: integer("initial_count").notNull(),
  remainingCount: integer("remaining_count").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertCrateSchema = createInsertSchema(crates).omit({
  id: true,
  lastUpdated: true,
});

export type InsertCrate = z.infer<typeof insertCrateSchema>;
export type Crate = typeof crates.$inferSelect;

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // 'text' or 'image'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type MessageWithSender = Message & {
  senderName: string;
};
