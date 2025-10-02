import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, MapPin, Clock, Gauge } from "lucide-react";

interface DriverDashboardProps {
  driverName?: string;
  assignedTrip?: {
    truckNumber: string;
    route: string;
    status: "ongoing" | "not-started";
  };
}

export function DriverDashboard({ 
  driverName = "John Smith",
  assignedTrip = {
    truckNumber: "TRK-001",
    route: "North District Route",
    status: "not-started",
  }
}: DriverDashboardProps) {
  const [tripStatus, setTripStatus] = useState<"ongoing" | "not-started" | "completed">(
    assignedTrip.status
  );
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [duration, setDuration] = useState(0);

  const startTrip = () => {
    setTripStatus("ongoing");
    console.log("Trip started");
    
    const interval = setInterval(() => {
      setDistance((prev) => prev + Math.random() * 2);
      setSpeed(Math.random() * 60 + 40);
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  };

  const endTrip = () => {
    setTripStatus("completed");
    console.log("Trip ended");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Welcome, {driverName}</CardTitle>
              <CardDescription>Your current trip assignment</CardDescription>
            </div>
            <Badge variant={tripStatus === "ongoing" ? "default" : "secondary"}>
              {tripStatus === "ongoing" ? "Active" : tripStatus === "completed" ? "Completed" : "Not Started"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Truck Number</p>
              <p className="text-lg font-semibold">{assignedTrip.truckNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Route</p>
              <p className="text-lg font-semibold">{assignedTrip.route}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {tripStatus === "not-started" && (
              <Button 
                onClick={startTrip} 
                className="flex-1"
                data-testid="button-start-trip"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Trip
              </Button>
            )}
            {tripStatus === "ongoing" && (
              <Button 
                onClick={endTrip} 
                variant="destructive" 
                className="flex-1"
                data-testid="button-end-trip"
              >
                <Square className="h-4 w-4 mr-2" />
                End Trip
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {tripStatus === "ongoing" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <MapPin className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-2xl font-bold">{distance.toFixed(1)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Gauge className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Speed</p>
                  <p className="text-2xl font-bold">{speed.toFixed(0)} km/h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">
                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
