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
    <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-primary/40">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md" />
              <div className="relative p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create New Trip
              </CardTitle>
              <CardDescription className="text-sm mt-1 text-muted-foreground/80">
                Dispatch a new delivery assignment
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="truck" className="text-sm font-medium flex items-center gap-2">
                <div className="p-1 rounded bg-primary/10">
                  <TruckIcon className="h-3.5 w-3.5 text-primary" />
                </div>
                Vehicle
              </Label>
              <Select value={truckId} onValueChange={setTruckId} required disabled={createTripMutation.isPending}>
                <SelectTrigger 
                  id="truck" 
                  data-testid="select-truck" 
                  className="h-11 border-border/50 bg-background/50 hover:bg-background hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                >
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent className="border-border/50">
                  {trucks.length === 0 ? (
                    <SelectItem value="none" disabled>No vehicles available</SelectItem>
                  ) : (
                    trucks.map((truck) => (
                      <SelectItem 
                        key={truck.id} 
                        value={truck.id}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <TruckIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{truck.truckNumber}</span>
                          <span className="text-xs text-muted-foreground">({truck.capacity}L)</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver" className="text-sm font-medium flex items-center gap-2">
                <div className="p-1 rounded bg-primary/10">
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                </div>
                Driver
              </Label>
              <Select value={driverId} onValueChange={setDriverId} required disabled={createTripMutation.isPending}>
                <SelectTrigger 
                  id="driver" 
                  data-testid="select-driver" 
                  className="h-11 border-border/50 bg-background/50 hover:bg-background hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                >
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent className="border-border/50">
                  {drivers.length === 0 ? (
                    <SelectItem value="none" disabled>No drivers available</SelectItem>
                  ) : (
                    drivers.map((driver) => (
                      <SelectItem 
                        key={driver.id} 
                        value={driver.id}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{driver.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route" className="text-sm font-medium flex items-center gap-2">
              <div className="p-1 rounded bg-primary/10">
                <MapPin className="h-3.5 w-3.5 text-primary" />
              </div>
              Route
            </Label>
            <Select value={routeId} onValueChange={setRouteId} required disabled={createTripMutation.isPending}>
              <SelectTrigger 
                id="route" 
                data-testid="select-route" 
                className="h-11 border-border/50 bg-background/50 hover:bg-background hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              >
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent className="border-border/50">
                {routes.length === 0 ? (
                  <SelectItem value="none" disabled>No routes available</SelectItem>
                ) : (
                  routes.map((route) => (
                    <SelectItem 
                      key={route.id} 
                      value={route.id}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{route.origin}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{route.destination}</span>
                        {route.routeName && (
                          <span className="text-xs text-muted-foreground ml-1">({route.routeName})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rupees" className="text-sm font-medium flex items-center gap-2">
              <div className="p-1 rounded bg-primary/10">
                <IndianRupee className="h-3.5 w-3.5 text-primary" />
              </div>
              Payment Amount
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="rupees"
                type="number"
                min="0"
                step="0.01"
                value={rupees}
                onChange={(e) => setRupees(e.target.value)}
                placeholder="Enter amount"
                data-testid="input-rupees"
                required
                disabled={createTripMutation.isPending}
                className="h-11 pl-9 border-border/50 bg-background/50 hover:bg-background hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group" 
              data-testid="button-assign-trip"
              disabled={createTripMutation.isPending || !truckId || !driverId || !routeId || !rupees}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {createTripMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <SendHorizontal className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                  <span>Dispatch Trip</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
