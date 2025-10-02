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

export function TripAssignmentForm() {
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [salary, setSalary] = useState("");
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
    mutationFn: async (data: { truckId: string; driverId: string; routeId: string; salary: string }) => {
      const tripResponse = await apiRequest("POST", "/api/trips", {
        truckId: data.truckId,
        driverId: data.driverId,
        routeId: data.routeId,
        salary: data.salary,
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
      setSalary("");
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
      salary,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign New Trip</CardTitle>
        <CardDescription>Assign a vehicle and route to a driver</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="truck">Select Truck</Label>
            <Select value={truckId} onValueChange={setTruckId} required disabled={createTripMutation.isPending}>
              <SelectTrigger id="truck" data-testid="select-truck">
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

          <div className="space-y-2">
            <Label htmlFor="driver">Select Driver</Label>
            <Select value={driverId} onValueChange={setDriverId} required disabled={createTripMutation.isPending}>
              <SelectTrigger id="driver" data-testid="select-driver">
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

          <div className="space-y-2">
            <Label htmlFor="route">Select Route</Label>
            <Select value={routeId} onValueChange={setRouteId} required disabled={createTripMutation.isPending}>
              <SelectTrigger id="route" data-testid="select-route">
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

          <div className="space-y-2">
            <Label htmlFor="salary">Driver Salary</Label>
            <Input
              id="salary"
              type="number"
              min="0"
              step="0.01"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Enter salary amount"
              data-testid="input-salary"
              required
              disabled={createTripMutation.isPending}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            data-testid="button-assign-trip"
            disabled={createTripMutation.isPending || !truckId || !driverId || !routeId || !salary}
          >
            {createTripMutation.isPending ? "Assigning..." : "Assign Trip"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
