import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, MapPin, Clock, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DriverDashboardProps {
  driverName?: string;
  assignedTrip?: {
    truckNumber: string;
    route: string;
    status: "ongoing" | "not-started";
  };
  tripId?: string;
  driverId?: string;
}

export function DriverDashboard({ 
  driverName = "John Smith",
  assignedTrip = {
    truckNumber: "TRK-001",
    route: "North District Route",
    status: "not-started",
  },
  tripId,
  driverId
}: DriverDashboardProps) {
  const [tripStatus, setTripStatus] = useState<"ongoing" | "not-started" | "completed">(
    assignedTrip.status
  );
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [duration, setDuration] = useState(0);
  const { toast } = useToast();

  const startTripMutation = useMutation({
    mutationFn: async () => {
      if (!tripId) throw new Error("No trip ID provided");
      const response = await apiRequest("PATCH", `/api/trips/${tripId}`, {
        status: "ongoing",
        startTime: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      setTripStatus("ongoing");
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      if (driverId) {
        queryClient.invalidateQueries({ queryKey: ["/api/trips/driver", driverId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      toast({
        title: "Trip started",
        description: "Your trip is now in progress",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to start trip",
        description: error.message,
      });
    },
  });

  const endTripMutation = useMutation({
    mutationFn: async () => {
      if (!tripId) throw new Error("No trip ID provided");
      const response = await apiRequest("PATCH", `/api/trips/${tripId}`, {
        status: "completed",
        endTime: new Date().toISOString(),
        distanceTravelled: distance.toFixed(2),
        avgSpeed: speed.toFixed(2),
      });
      return response.json();
    },
    onSuccess: () => {
      setTripStatus("completed");
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      if (driverId) {
        queryClient.invalidateQueries({ queryKey: ["/api/trips/driver", driverId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      toast({
        title: "Trip completed",
        description: "Great job! Your trip has been completed.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to end trip",
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (tripStatus === "ongoing") {
      const interval = setInterval(() => {
        setDistance((prev) => prev + Math.random() * 2);
        setSpeed(Math.random() * 60 + 40);
        setDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [tripStatus]);

  const startTrip = () => {
    startTripMutation.mutate();
  };

  const endTrip = () => {
    endTripMutation.mutate();
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
