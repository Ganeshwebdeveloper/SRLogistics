import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRouteSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Truck, User, Trip, Route, InsertRoute } from "@shared/schema";

export function FleetManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: trucks = [], isLoading: isLoadingTrucks } = useQuery<Truck[]>({
    queryKey: ["/api/trucks"],
  });

  const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/drivers"],
  });

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  const availableTrucks = trucks.filter((t) => t.status === "available");
  const busyTrucks = trucks.filter((t) => t.status === "busy");

  const ongoingTrips = trips.filter((trip) => trip.status === "ongoing");
  const availableDrivers = drivers.filter(
    (driver) => !ongoingTrips.some((trip) => trip.driverId === driver.id)
  );
  const busyDrivers = drivers.filter(
    (driver) => ongoingTrips.some((trip) => trip.driverId === driver.id)
  );

  const form = useForm<InsertRoute>({
    resolver: zodResolver(insertRouteSchema),
    defaultValues: {
      origin: "",
      destination: "",
      routeName: "",
      notes: "",
      crateCount: 100,
    },
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data: InsertRoute) => {
      const res = await apiRequest("POST", "/api/routes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      form.reset();
      setDialogOpen(false);
      toast({
        title: "Success",
        description: "Route created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRoute) => {
    createRouteMutation.mutate(data);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Fleet Management</h1>
        <p className="text-muted-foreground">Manage and monitor your fleet and drivers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover-elevate"
          onClick={() => scrollToSection("trucks-section")}
          data-testid="card-trucks"
        >
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{trucks.length}</div>
            <div className="text-sm text-muted-foreground">Total Trucks</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover-elevate"
          onClick={() => scrollToSection("trucks-section")}
          data-testid="card-available-trucks"
        >
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{availableTrucks.length}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover-elevate"
          onClick={() => scrollToSection("trucks-section")}
          data-testid="card-busy-trucks"
        >
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">{busyTrucks.length}</div>
            <div className="text-sm text-muted-foreground">On Trip</div>
          </CardContent>
        </Card>
      </div>

      <Card id="trucks-section">
        <CardHeader>
          <CardTitle>All Trucks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTrucks ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Truck Number</TableHead>
                  <TableHead>Capacity (Liters)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trucks.map((truck) => (
                  <TableRow key={truck.id} data-testid={`row-truck-${truck.id}`}>
                    <TableCell className="font-medium">{truck.truckNumber}</TableCell>
                    <TableCell>{truck.capacity}</TableCell>
                    <TableCell>
                      <Badge
                        variant={truck.status === "available" ? "outline" : "default"}
                        data-testid={`badge-status-${truck.status}`}
                      >
                        {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover-elevate"
          onClick={() => scrollToSection("drivers-section")}
          data-testid="card-drivers"
        >
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{drivers.length}</div>
            <div className="text-sm text-muted-foreground">Total Drivers</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover-elevate"
          onClick={() => scrollToSection("drivers-section")}
          data-testid="card-available-drivers"
        >
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{availableDrivers.length}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover-elevate"
          onClick={() => scrollToSection("drivers-section")}
          data-testid="card-busy-drivers"
        >
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">{busyDrivers.length}</div>
            <div className="text-sm text-muted-foreground">On Trip</div>
          </CardContent>
        </Card>
      </div>

      <Card id="drivers-section">
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDrivers ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => {
                  const isOnTrip = ongoingTrips.some((trip) => trip.driverId === driver.id);
                  return (
                    <TableRow key={driver.id} data-testid={`row-driver-${driver.id}`}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={isOnTrip ? "default" : "outline"}
                          data-testid={`badge-driver-status-${isOnTrip ? "busy" : "available"}`}
                        >
                          {isOnTrip ? "On Trip" : "Available"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover-elevate"
          onClick={() => scrollToSection("routes-section")}
          data-testid="card-routes"
        >
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{routes.length}</div>
            <div className="text-sm text-muted-foreground">Total Routes</div>
          </CardContent>
        </Card>
      </div>

      <Card id="routes-section">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle>All Routes</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-route">
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Route</DialogTitle>
                <DialogDescription>
                  Create a new route by specifying origin and destination
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From (Origin)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., New York"
                            {...field}
                            data-testid="input-origin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To (Destination)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Los Angeles"
                            {...field}
                            data-testid="input-destination"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="routeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Route Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., East Coast Route"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-routename"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="crateCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crate Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-cratecount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional information about this route"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createRouteMutation.isPending}
                    data-testid="button-submit-route"
                  >
                    {createRouteMutation.isPending ? "Creating..." : "Create Route"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingRoutes ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : routes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No routes available. Click "Add Route" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Crate Count</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id} data-testid={`row-route-${route.id}`}>
                    <TableCell className="font-medium">{route.origin}</TableCell>
                    <TableCell className="font-medium">{route.destination}</TableCell>
                    <TableCell>{route.routeName || "-"}</TableCell>
                    <TableCell>{route.crateCount}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {route.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
