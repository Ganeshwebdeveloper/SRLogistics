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
    <div className="space-y-6 animate-fade-in">
      <Card className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Welcome, {driverName}</CardTitle>
              <CardDescription className="text-base mt-1">Your current trip assignment</CardDescription>
            </div>
            <Badge 
              variant={tripStatus === "ongoing" ? "default" : "secondary"}
              className="px-4 py-2 text-sm font-semibold shadow-md"
            >
              {tripStatus === "ongoing" ? "🚛 Active" : tripStatus === "completed" ? "✓ Completed" : "⏸ Not Started"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-gradient-to-br from-primary/5 to-transparent rounded-lg border border-primary/20 hover:border-primary/40 transition-all duration-200">
              <p className="text-sm text-muted-foreground font-semibold mb-2">Truck Number</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{assignedTrip.truckNumber}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-primary/5 to-transparent rounded-lg border border-primary/20 hover:border-primary/40 transition-all duration-200">
              <p className="text-sm text-muted-foreground font-semibold mb-2">Route</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{assignedTrip.route}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {tripStatus === "not-started" && (
              <Button 
                onClick={startTrip} 
                className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                data-testid="button-start-trip"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Trip
              </Button>
            )}
            {tripStatus === "ongoing" && (
              <Button 
                onClick={endTrip} 
                variant="destructive" 
                className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
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
          <Card className="group border-l-4 border-l-blue-500 hover:border-l-blue-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                  <div className="relative p-3 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-full">
                    <MapPin className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Distance</p>
                  <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{distance.toFixed(1)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-l-4 border-l-green-500 hover:border-l-green-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                  <div className="relative p-3 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-full">
                    <Gauge className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Avg Speed</p>
                  <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{speed.toFixed(0)} km/h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group border-l-4 border-l-orange-500 hover:border-l-orange-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                  <div className="relative p-3 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-full">
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Duration</p>
                  <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
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
