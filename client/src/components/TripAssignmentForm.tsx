import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Truck, User, Route } from "@shared/schema";
import { Truck as TruckIcon, User as UserIcon, MapPin, IndianRupee, Sparkles, SendHorizontal } from "lucide-react";

export function TripAssignmentForm() {
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [rupees, setRupees] = useState("");
  const { toast } = useToast();

  const { data: trucks = [] } = useQuery<Truck[]>({
    queryKey: ["/api/trucks/available"],
  });

  const { data: allDrivers = [] } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/drivers"],
  });

  const drivers = allDrivers.filter((d) => d.status === "available");

  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  const createTripMutation = useMutation({
    mutationFn: async (data: { truckId: string; driverId: string; routeId: string; rupees: string }) => {
      const tripResponse = await apiRequest("POST", "/api/trips", {
        truckId: data.truckId,
        driverId: data.driverId,
        routeId: data.routeId,
        rupees: data.rupees,
        currentLocation: "Starting Point",
        status: "scheduled",
      });
      
      return await tripResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Trip assigned successfully",
        description: "The driver has been notified of their new assignment.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      setTruckId("");
      setDriverId("");
      setRouteId("");
      setRupees("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to assign trip",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTripMutation.mutate({
      truckId,
      driverId,
      routeId,
      rupees,
    });
  };

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
      
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10 animate-bounce">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Assign New Trip
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Create and dispatch a new delivery assignment
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 group">
            <Label htmlFor="truck" className="flex items-center gap-2 text-sm font-semibold">
              <TruckIcon className="h-4 w-4 text-primary" />
              Select Truck
            </Label>
            <Select value={truckId} onValueChange={setTruckId} required disabled={createTripMutation.isPending}>
              <SelectTrigger id="truck" data-testid="select-truck" className="border-primary/20 focus:border-primary transition-all duration-300">
                <SelectValue placeholder="Choose available truck" />
              </SelectTrigger>
              <SelectContent>
                {trucks.length === 0 ? (
                  <SelectItem value="none" disabled>No trucks available</SelectItem>
                ) : (
                  trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.truckNumber} (Capacity: {truck.capacity})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 group">
            <Label htmlFor="driver" className="flex items-center gap-2 text-sm font-semibold">
              <UserIcon className="h-4 w-4 text-primary" />
              Select Driver
            </Label>
            <Select value={driverId} onValueChange={setDriverId} required disabled={createTripMutation.isPending}>
              <SelectTrigger id="driver" data-testid="select-driver" className="border-primary/20 focus:border-primary transition-all duration-300">
                <SelectValue placeholder="Choose driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.length === 0 ? (
                  <SelectItem value="none" disabled>No drivers available</SelectItem>
                ) : (
                  drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 group">
            <Label htmlFor="route" className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              Select Route
            </Label>
            <Select value={routeId} onValueChange={setRouteId} required disabled={createTripMutation.isPending}>
              <SelectTrigger id="route" data-testid="select-route" className="border-primary/20 focus:border-primary transition-all duration-300">
                <SelectValue placeholder="Choose route" />
              </SelectTrigger>
              <SelectContent>
                {routes.length === 0 ? (
                  <SelectItem value="none" disabled>No routes available</SelectItem>
                ) : (
                  routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.origin} → {route.destination} {route.routeName ? `(${route.routeName})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 group">
            <Label htmlFor="rupees" className="flex items-center gap-2 text-sm font-semibold">
              <IndianRupee className="h-4 w-4 text-primary" />
              Driver Payment (₹)
            </Label>
            <Input
              id="rupees"
              type="number"
              min="0"
              step="0.01"
              value={rupees}
              onChange={(e) => setRupees(e.target.value)}
              placeholder="Enter amount in rupees"
              data-testid="input-rupees"
              required
              disabled={createTripMutation.isPending}
              className="border-primary/20 focus:border-primary transition-all duration-300"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group" 
            data-testid="button-assign-trip"
            disabled={createTripMutation.isPending || !truckId || !driverId || !routeId || !rupees}
          >
            {createTripMutation.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              <>
                <SendHorizontal className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                Assign Trip
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
