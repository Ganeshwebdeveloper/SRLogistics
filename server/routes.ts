import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { z } from "zod";
import { insertUserSchema, insertTruckSchema, insertRouteSchema, insertTripSchema, insertCrateSchema, insertMessageSchema } from "@shared/schema";
import { requireAuth, requireAdmin } from "./middleware";
import "./types";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;
    
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        cookies[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
    return cookies;
  };

  const getSessionFromRequest = (req: any): Promise<any> => {
    return new Promise((resolve) => {
      const sessionStore = app.get("sessionStore");
      if (!sessionStore) {
        console.error("Session store not available");
        return resolve(null);
      }

      const cookies = parseCookies(req.headers.cookie);
      const sessionCookieName = 'connect.sid';
      const sessionId = cookies[sessionCookieName];
      
      if (!sessionId) {
        return resolve(null);
      }

      const sessionIdWithoutSig = sessionId.split('.')[0].replace('s:', '');
      
      sessionStore.get(sessionIdWithoutSig, (err: any, session: any) => {
        if (err || !session) {
          resolve(null);
        } else {
          resolve(session);
        }
      });
    });
  };
  
  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Map<string, WebSocket>();

  wss.on("connection", async (ws, req) => {
    const session = await getSessionFromRequest(req);
    
    if (!session || !session.userId) {
      console.log("WebSocket connection rejected: No valid session");
      ws.close(1008, "Unauthorized");
      return;
    }

    const userId = session.userId;
    clients.set(userId, ws);
    console.log(`User ${userId} connected to WebSocket`);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "chat") {
          const newMessage = await storage.createMessage({
            senderId: userId,
            content: message.content,
            type: message.messageType || "text",
          });

          const sender = await storage.getUser(userId);
          const messageWithSender = {
            ...newMessage,
            senderName: sender?.name || "Unknown",
          };

          // Broadcast to all connected clients
          const broadcastData = JSON.stringify(messageWithSender);
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        } else if (message.type === "location_update") {
          // Handle location updates from drivers
          const { tripId, latitude, longitude, timestamp } = message;
          
          if (!tripId || latitude === undefined || longitude === undefined || !timestamp) {
            console.error("Invalid location_update message: missing required fields", message);
            return;
          }

          try {
            // Fetch the trip to verify authorization
            const trip = await storage.getTrip(tripId);

            if (!trip) {
              console.error(`Trip not found for location update: ${tripId}`);
              ws.send(JSON.stringify({
                type: "error",
                message: "Trip not found"
              }));
              return;
            }

            // Verify that the user is the assigned driver for this trip
            if (trip.driverId !== userId) {
              console.warn(`Unauthorized location update attempt: User ${userId} tried to update trip ${tripId}`);
              ws.send(JSON.stringify({
                type: "error",
                message: "Unauthorized: You are not the assigned driver for this trip"
              }));
              return;
            }

            // Create location data object
            const locationData = {
              latitude,
              longitude,
              timestamp,
            };

            // Update the trip's currentLocation field with JSON string
            const updatedTrip = await storage.updateTrip(tripId, {
              currentLocation: JSON.stringify(locationData),
            });

            if (!updatedTrip) {
              console.error(`Failed to update trip location: ${tripId}`);
              return;
            }

            console.log(`Location updated for trip ${tripId}:`, locationData);

            // Broadcast location update to all connected clients
            const broadcastMessage = {
              type: "location_update",
              tripId,
              latitude,
              longitude,
              timestamp,
            };

            const broadcastData = JSON.stringify(broadcastMessage);
            clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(broadcastData);
              }
            });
          } catch (error) {
            console.error("Error processing location update:", error);
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`User ${userId} disconnected from WebSocket`);
    });
  });

  // Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user ID in session
      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get user" });
    }
  });

  // User endpoints (protected)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch users" });
    }
  });

  app.get("/api/users/drivers", requireAuth, async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      const driversWithoutPasswords = drivers.map(({ password, ...user }) => user);
      res.json(driversWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch drivers" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      // Create update schema that excludes password and validates allowed fields
      const updateUserSchema = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "driver"]).optional(),
        status: z.enum(["available", "on_trip", "on_leave"]).optional(),
      });
      
      const validatedData = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete user" });
    }
  });

  // Separate endpoint for password change with proper hashing
  app.patch("/api/users/:id/password", requireAuth, async (req, res) => {
    try {
      const passwordSchema = z.object({
        newPassword: z.string().min(6),
      });
      
      const { newPassword } = passwordSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const user = await storage.updateUser(req.params.id, { password: hashedPassword });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update password" });
    }
  });

  // Truck endpoints (protected)
  app.get("/api/trucks", requireAuth, async (req, res) => {
    try {
      const trucks = await storage.getAllTrucks();
      res.json(trucks);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch trucks" });
    }
  });

  app.get("/api/trucks/available", requireAuth, async (req, res) => {
    try {
      const trucks = await storage.getAvailableTrucks();
      res.json(trucks);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch available trucks" });
    }
  });

  app.get("/api/trucks/:id", requireAuth, async (req, res) => {
    try {
      const truck = await storage.getTruck(req.params.id);
      if (!truck) {
        return res.status(404).json({ message: "Truck not found" });
      }
      res.json(truck);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch truck" });
    }
  });

  app.post("/api/trucks", requireAdmin, async (req, res) => {
    try {
      const data = insertTruckSchema.parse(req.body);
      const truck = await storage.createTruck(data);
      res.status(201).json(truck);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.patch("/api/trucks/:id", requireAdmin, async (req, res) => {
    try {
      const truck = await storage.updateTruck(req.params.id, req.body);
      if (!truck) {
        return res.status(404).json({ message: "Truck not found" });
      }
      res.json(truck);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update truck" });
    }
  });

  app.delete("/api/trucks/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteTruck(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Truck not found" });
      }
      res.json({ message: "Truck deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete truck" });
    }
  });

  // Route endpoints (protected)
  app.get("/api/routes", requireAuth, async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch routes" });
    }
  });

  app.get("/api/routes/available", requireAuth, async (req, res) => {
    try {
      const routes = await storage.getAvailableRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch available routes" });
    }
  });

  app.get("/api/routes/:id", requireAuth, async (req, res) => {
    try {
      const route = await storage.getRoute(req.params.id);
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch route" });
    }
  });

  app.post("/api/routes", requireAdmin, async (req, res) => {
    try {
      const data = insertRouteSchema.parse(req.body);
      const route = await storage.createRoute(data);
      res.status(201).json(route);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.patch("/api/routes/:id", requireAdmin, async (req, res) => {
    try {
      const route = await storage.updateRoute(req.params.id, req.body);
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update route" });
    }
  });

  app.delete("/api/routes/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteRoute(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Route not found" });
      }
      res.json({ message: "Route deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete route" });
    }
  });

  // Trip endpoints (protected)
  app.get("/api/trips", requireAuth, async (req, res) => {
    try {
      const trips = await storage.getAllTrips();
      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch trips" });
    }
  });

  app.get("/api/trips/ongoing", requireAuth, async (req, res) => {
    try {
      const trips = await storage.getOngoingTrips();
      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch ongoing trips" });
    }
  });

  app.get("/api/trips/driver/:driverId", requireAuth, async (req, res) => {
    try {
      const trips = await storage.getTripsByDriver(req.params.driverId);
      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch driver trips" });
    }
  });

  app.get("/api/trips/:id", requireAuth, async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch trip" });
    }
  });

  app.post("/api/trips", requireAuth, async (req, res) => {
    try {
      const data = insertTripSchema.parse(req.body);
      
      // Verify driver, truck, and route exist
      const driver = await storage.getUser(data.driverId);
      const truck = await storage.getTruck(data.truckId);
      const route = await storage.getRoute(data.routeId);
      
      if (!driver || !truck || !route) {
        return res.status(404).json({ message: "Driver, truck, or route not found" });
      }
      
      // Check driver availability
      if (driver.status === "on_leave") {
        return res.status(400).json({ message: "Driver is on leave and cannot be assigned" });
      }
      if (driver.status === "on_trip") {
        return res.status(400).json({ message: "Driver is already assigned to another trip" });
      }
      if (driver.status !== "available") {
        return res.status(400).json({ message: "Driver is not available" });
      }
      
      // Check truck availability
      if (truck.status === "on_maintenance") {
        return res.status(400).json({ message: "Truck is under maintenance and cannot be assigned" });
      }
      if (truck.status === "on_trip") {
        return res.status(400).json({ message: "Truck is already assigned to another trip" });
      }
      if (truck.status !== "available") {
        return res.status(400).json({ message: "Truck is not available" });
      }
      
      const trip = await storage.createTrip(data);
      
      // After trip assignment, update driver and truck status to on_trip
      await storage.updateTruck(trip.truckId, { status: "on_trip" });
      await storage.updateUser(trip.driverId, { status: "on_trip" });
      
      res.status(201).json(trip);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.patch("/api/trips/:id", requireAuth, async (req, res) => {
    try {
      const trip = await storage.updateTrip(req.params.id, req.body);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Handle status transitions
      if (req.body.status === "ongoing") {
        // When trip starts, update driver and truck status to on_trip
        await storage.updateTruck(trip.truckId, { status: "on_trip" });
        await storage.updateUser(trip.driverId, { status: "on_trip" });
      } else if (req.body.status === "completed") {
        // When trip completes, update driver and truck status to available
        await storage.updateTruck(trip.truckId, { status: "available" });
        await storage.updateUser(trip.driverId, { status: "available" });
      }
      
      res.json(trip);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update trip" });
    }
  });

  app.delete("/api/trips/:id", requireAuth, async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Free up driver and truck if trip is not completed
      if (trip.status !== "completed") {
        await storage.updateTruck(trip.truckId, { status: "available" });
        await storage.updateUser(trip.driverId, { status: "available" });
      }
      
      const deleted = await storage.deleteTrip(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json({ message: "Trip deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete trip" });
    }
  });

  // Crate endpoints (attendance tracking)
  app.get("/api/crates", requireAuth, async (req, res) => {
    try {
      const crates = await storage.getAllCrates();
      res.json(crates);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch crates" });
    }
  });

  app.get("/api/crates/route/:routeId", requireAuth, async (req, res) => {
    try {
      const crates = await storage.getCratesByRoute(req.params.routeId);
      res.json(crates);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch crates" });
    }
  });

  app.get("/api/crates/driver/:driverId", requireAuth, async (req, res) => {
    try {
      const crates = await storage.getCratesByDriver(req.params.driverId);
      res.json(crates);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch driver crates" });
    }
  });

  app.post("/api/crates", requireAuth, async (req, res) => {
    try {
      const data = insertCrateSchema.parse(req.body);
      const crate = await storage.createCrate(data);
      res.status(201).json(crate);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.patch("/api/crates/:id", requireAuth, async (req, res) => {
    try {
      const crate = await storage.updateCrate(req.params.id, req.body);
      if (!crate) {
        return res.status(404).json({ message: "Crate not found" });
      }
      res.json(crate);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update crate" });
    }
  });

  // Message endpoints
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.delete("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteMessage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete message" });
    }
  });

  return httpServer;
}
