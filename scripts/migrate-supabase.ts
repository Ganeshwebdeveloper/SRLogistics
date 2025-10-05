import pkg from "pg";
const { Client } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to Supabase database");

    // Enable UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);
    
    console.log("Creating tables...");

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'driver',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Users table created");

    // Trucks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trucks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        truck_number VARCHAR(50) UNIQUE NOT NULL,
        capacity INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'available'
      );
    `);
    console.log("✓ Trucks table created");

    // Routes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS routes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        route_name VARCHAR(255) NOT NULL,
        notes TEXT
      );
    `);
    console.log("✓ Routes table created");

    // Trips table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        truck_id UUID REFERENCES trucks(id),
        driver_id UUID REFERENCES users(id),
        route_id UUID REFERENCES routes(id),
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        distance_travelled NUMERIC(10, 2),
        avg_speed NUMERIC(10, 2),
        current_location TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'ongoing'
      );
    `);
    console.log("✓ Trips table created");

    // Crates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS crates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id),
        initial_count INTEGER NOT NULL,
        remaining_count INTEGER NOT NULL,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Crates table created");

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id),
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'text',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Messages table created");

    // Crate daily balance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS crate_daily_balance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        route_id UUID REFERENCES routes(id),
        date DATE NOT NULL,
        opening_balance INTEGER NOT NULL DEFAULT 0,
        closing_balance INTEGER NOT NULL DEFAULT 0,
        UNIQUE(route_id, date)
      );
    `);
    console.log("✓ Crate daily balance table created");

    // Crate adjustments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS crate_adjustments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        daily_balance_id UUID REFERENCES crate_daily_balance(id),
        adjustment_type VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Crate adjustments table created");

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
      CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_crate_daily_balance_date ON crate_daily_balance(date);
    `);
    console.log("✓ Indexes created");

    console.log("\n✅ All tables created successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
