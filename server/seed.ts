import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";
import ws from "ws";

// Configure Neon to use WebSocket (works with standard PostgreSQL URLs)
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Check and create admin user
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    let admin = await db.query.users.findFirst({
      where: eq(schema.users.email, "admin@srlogistics.com")
    });
    
    if (!admin) {
      [admin] = await db.insert(schema.users).values({
        name: "Admin User",
        email: "admin@srlogistics.com",
        password: hashedAdminPassword,
        role: "admin",
        status: "active",
      }).returning();
      console.log("✓ Created admin user:", admin.email);
    } else {
      console.log("✓ Admin user already exists:", admin.email);
    }

    // Check and create driver users
    const hashedDriverPassword = await bcrypt.hash("driver123", 10);
    let driver1 = await db.query.users.findFirst({
      where: eq(schema.users.email, "john@srlogistics.com")
    });
    
    if (!driver1) {
      [driver1] = await db.insert(schema.users).values({
        name: "John Driver",
        email: "john@srlogistics.com",
        password: hashedDriverPassword,
        role: "driver",
        status: "active",
      }).returning();
      console.log("✓ Created driver:", driver1.email);
    } else {
      console.log("✓ Driver already exists:", driver1.email);
    }

    let driver2 = await db.query.users.findFirst({
      where: eq(schema.users.email, "sarah@srlogistics.com")
    });
    
    if (!driver2) {
      [driver2] = await db.insert(schema.users).values({
        name: "Sarah Driver",
        email: "sarah@srlogistics.com",
        password: hashedDriverPassword,
        role: "driver",
        status: "active",
      }).returning();
      console.log("✓ Created driver:", driver2.email);
    } else {
      console.log("✓ Driver already exists:", driver2.email);
    }

    // Create trucks
    const [truck1] = await db.insert(schema.trucks).values({
      truckNumber: "TRK-001",
      capacity: 500,
      status: "available",
    }).returning();
    console.log("✓ Created truck:", truck1.truckNumber);

    const [truck2] = await db.insert(schema.trucks).values({
      truckNumber: "TRK-002",
      capacity: 600,
      status: "available",
    }).returning();
    console.log("✓ Created truck:", truck2.truckNumber);

    // Create route
    const [route1] = await db.insert(schema.routes).values({
      origin: "Main Warehouse",
      destination: "City Center",
      routeName: "City Center Route",
      notes: "Main delivery route covering downtown area",
      status: "available",
    }).returning();
    console.log("✓ Created route:", route1.routeName);

    // Create a sample trip
    const [trip1] = await db.insert(schema.trips).values({
      truckId: truck1.id,
      driverId: driver1.id,
      routeId: route1.id,
      rupees: "1500.00",
      startTime: new Date(),
      currentLocation: "Starting Point",
      status: "ongoing",
    }).returning();
    console.log("✓ Created trip for driver:", driver1.name);

    // Update truck status to busy
    await db.update(schema.trucks)
      .set({ status: "busy" })
      .where(eq(schema.trucks.id, truck1.id));

    // Create crates for the route (attendance tracking)
    const [crate1] = await db.insert(schema.crates).values({
      routeId: route1.id,
      driverId: driver1.id,
      vehicleId: truck1.id,
      date: new Date(),
      initialCount: 100,
      remainingCount: 100,
      remarks: "First day delivery",
    }).returning();
    console.log("✓ Created crate attendance record for route");

    // Create sample message
    const [message1] = await db.insert(schema.messages).values({
      senderId: admin.id,
      content: "Welcome to SR Logistics! Group chat is now active.",
      type: "text",
    }).returning();
    console.log("✓ Created welcome message");

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nLogin credentials:");
    console.log("Admin - Email: admin@srlogistics.com, Password: admin123");
    console.log("Driver 1 - Email: john@srlogistics.com, Password: driver123");
    console.log("Driver 2 - Email: sarah@srlogistics.com, Password: driver123");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
