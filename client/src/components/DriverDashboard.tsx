import { useState, useEffect, useRef } from "react";
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
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { toast } = useToast();
  
  const watchIdRef = useRef<number | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup GPS tracking on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "GPS not supported",
        description: "Your browser doesn't support geolocation. Please use a modern browser.",
      });
      return;
    }

    // Request initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied. Please enable GPS access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information is unavailable. Please check your GPS settings.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out. Please try again.";
        }
        
        toast({
          variant: "destructive",
          title: "GPS Error",
          description: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Watch position continuously
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("GPS tracking error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [toast]);

  // Setup WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established for location tracking");
      setWs(socket);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setWs(null);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to establish real-time connection. Location updates may not work.",
      });
    };

    return () => {
      socket.close();
    };
  }, [toast]);

  // Send location updates every 5 seconds during ongoing trip
  useEffect(() => {
    if (tripStatus === "ongoing" && ws && currentLocation && tripId) {
      // Send initial location update
      const sendLocationUpdate = () => {
        if (ws.readyState === WebSocket.OPEN) {
          const locationUpdate = {
            type: "location_update",
            tripId: tripId,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            timestamp: new Date().toISOString(),
          };
          ws.send(JSON.stringify(locationUpdate));
        }
      };

      // Send immediately
      sendLocationUpdate();

      // Then send every 5 seconds
      const interval = setInterval(sendLocationUpdate, 5000);
      locationIntervalRef.current = interval;

      return () => {
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
        }
      };
    }
  }, [tripStatus, ws, currentLocation, tripId]);

  const startTripMutation = useMutation({
    mutationFn: async () => {
      if (!tripId) throw new Error("No trip ID provided");
      if (!currentLocation) throw new Error("GPS location not available");
      
      const response = await apiRequest("PATCH", `/api/trips/${tripId}`, {
        status: "ongoing",
        startTime: new Date().toISOString(),
        startLatitude: currentLocation.latitude,
        startLongitude: currentLocation.longitude,
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
        description: "Your trip is now in progress with GPS tracking enabled",
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
        ...(currentLocation && {
          endLatitude: currentLocation.latitude,
          endLongitude: currentLocation.longitude,
        }),
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
    if (!currentLocation) {
      toast({
        variant: "destructive",
        title: "GPS not ready",
        description: "Please wait for GPS location to be available before starting the trip.",
      });
      return;
    }
    startTripMutation.mutate();
  };

  const endTrip = () => {
    endTripMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="gradient-card-blue hover-lift shadow-xl overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-white/90">Welcome, {driverName}</CardTitle>
              <CardDescription className="text-base mt-1 text-white/70">Your current trip assignment</CardDescription>
            </div>
            <Badge 
              variant={tripStatus === "ongoing" ? "success" : tripStatus === "completed" ? "info" : "warning"}
              className="px-4 py-2 text-sm font-semibold shadow-lg animate-pulse-subtle"
            >
              {tripStatus === "ongoing" ? "Active" : tripStatus === "completed" ? "Completed" : "Not Started"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/40 hover-elevate transition-all duration-200">
              <p className="text-sm text-white/70 font-semibold mb-2 uppercase tracking-wide">Truck Number</p>
              <p className="text-2xl font-bold text-white">{assignedTrip.truckNumber}</p>
            </div>
            <div className="p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/40 hover-elevate transition-all duration-200">
              <p className="text-sm text-white/70 font-semibold mb-2 uppercase tracking-wide">Route</p>
              <p className="text-2xl font-bold text-white">{assignedTrip.route}</p>
            </div>
          </div>

          {currentLocation && (
            <div className="p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20" data-testid="gps-location">
              <p className="text-sm text-white/70 font-semibold mb-2 uppercase tracking-wide">GPS Location</p>
              <p className="text-sm text-white">
                Lat: {currentLocation.latitude.toFixed(6)}, Lon: {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {tripStatus === "not-started" && (
              <Button 
                onClick={startTrip} 
                className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                data-testid="button-start-trip"
                disabled={!currentLocation || startTripMutation.isPending}
              >
                <Play className="h-5 w-5 mr-2" />
                {startTripMutation.isPending ? "Starting..." : "Start Trip"}
              </Button>
            )}
            {tripStatus === "ongoing" && (
              <Button 
                onClick={endTrip} 
                variant="destructive" 
                className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                data-testid="button-end-trip"
                disabled={endTripMutation.isPending}
              >
                <Square className="h-4 w-4 mr-2" />
                {endTripMutation.isPending ? "Ending..." : "End Trip"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {tripStatus === "ongoing" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-card-purple hover-lift shadow-xl animate-scale-in overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-glow"></div>
                  <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/70 font-semibold uppercase tracking-wide">Distance</p>
                  <p className="text-3xl font-bold mt-1 text-white">{distance.toFixed(1)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-green hover-lift shadow-xl animate-scale-in overflow-hidden" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-glow"></div>
                  <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                    <Gauge className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/70 font-semibold uppercase tracking-wide">Avg Speed</p>
                  <p className="text-3xl font-bold mt-1 text-white">{speed.toFixed(0)} km/h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-orange hover-lift shadow-xl animate-scale-in overflow-hidden" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-glow"></div>
                  <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/70 font-semibold uppercase tracking-wide">Duration</p>
                  <p className="text-3xl font-bold mt-1 text-white">
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
