import { useState } from "react";
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

interface TripAssignmentFormProps {
  onAssign?: (data: { truckId: string; driverId: string; routeId: string; crateCount: number }) => void;
}

export function TripAssignmentForm({ onAssign }: TripAssignmentFormProps) {
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [crateCount, setCrateCount] = useState("100");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign?.({
      truckId,
      driverId,
      routeId,
      crateCount: parseInt(crateCount),
    });
    console.log("Trip assigned:", { truckId, driverId, routeId, crateCount });
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
            <Select value={truckId} onValueChange={setTruckId} required>
              <SelectTrigger id="truck" data-testid="select-truck">
                <SelectValue placeholder="Choose available truck" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="truck-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-chart-3" />
                    TRK-001 (Available)
                  </div>
                </SelectItem>
                <SelectItem value="truck-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-chart-3" />
                    TRK-002 (Available)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver">Select Driver</Label>
            <Select value={driverId} onValueChange={setDriverId} required>
              <SelectTrigger id="driver" data-testid="select-driver">
                <SelectValue placeholder="Choose driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driver-1">John Smith</SelectItem>
                <SelectItem value="driver-2">Sarah Johnson</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route">Select Route</Label>
            <Select value={routeId} onValueChange={setRouteId} required>
              <SelectTrigger id="route" data-testid="select-route">
                <SelectValue placeholder="Choose route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="route-1">North District Route</SelectItem>
                <SelectItem value="route-2">South District Route</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crates">Initial Crate Count</Label>
            <Input
              id="crates"
              type="number"
              min="1"
              value={crateCount}
              onChange={(e) => setCrateCount(e.target.value)}
              data-testid="input-crate-count"
              required
            />
          </div>

          <Button type="submit" className="w-full" data-testid="button-assign-trip">
            Assign Trip
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
