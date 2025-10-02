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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRouteSchema, insertTruckSchema, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Truck, User, Trip, Route, InsertRoute, InsertTruck } from "@shared/schema";
import { z } from "zod";

export function FleetManagement() {
  const [addRouteDialogOpen, setAddRouteDialogOpen] = useState(false);
  const [editTruckDialogOpen, setEditTruckDialogOpen] = useState(false);
  const [editDriverDialogOpen, setEditDriverDialogOpen] = useState(false);
  const [editRouteDialogOpen, setEditRouteDialogOpen] = useState(false);
  const [deleteTruckDialogOpen, setDeleteTruckDialogOpen] = useState(false);
  const [deleteDriverDialogOpen, setDeleteDriverDialogOpen] = useState(false);
  const [deleteRouteDialogOpen, setDeleteRouteDialogOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Omit<User, "password"> | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
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
  const busyTrucks = trucks.filter((t) => t.status === "on_trip");

  const availableDrivers = drivers.filter((d) => d.status === "available");
  const busyDrivers = drivers.filter((d) => d.status === "on_trip");

  const addRouteForm = useForm<InsertRoute>({
    resolver: zodResolver(insertRouteSchema),
    defaultValues: {
      origin: "",
      destination: "",
      routeName: "",
      notes: "",
      crateCount: 100,
    },
  });

  const updateTruckSchema = z.object({
    truckNumber: z.string().min(1, "Truck number is required"),
    capacity: z.number().min(1, "Capacity must be at least 1"),
    status: z.enum(["available", "on_trip", "on_maintenance"]),
  });

  const editTruckForm = useForm<z.infer<typeof updateTruckSchema>>({
    resolver: zodResolver(updateTruckSchema),
  });

  const updateDriverSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    status: z.enum(["available", "on_trip", "on_leave"]),
  });

  const editDriverForm = useForm<z.infer<typeof updateDriverSchema>>({
    resolver: zodResolver(updateDriverSchema),
  });

  const editRouteForm = useForm<InsertRoute>({
    resolver: zodResolver(insertRouteSchema),
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data: InsertRoute) => {
      const res = await apiRequest("POST", "/api/routes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      addRouteForm.reset();
      setAddRouteDialogOpen(false);
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

  const updateTruckMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateTruckSchema>) => {
      if (!selectedTruck) throw new Error("No truck selected");
      const res = await apiRequest("PATCH", `/api/trucks/${selectedTruck.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      setEditTruckDialogOpen(false);
      setSelectedTruck(null);
      toast({
        title: "Success",
        description: "Truck updated successfully",
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

  const deleteTruckMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/trucks/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      setDeleteTruckDialogOpen(false);
      setSelectedTruck(null);
      toast({
        title: "Success",
        description: "Truck deleted successfully",
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

  const updateDriverMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateDriverSchema>) => {
      if (!selectedDriver) throw new Error("No driver selected");
      const res = await apiRequest("PATCH", `/api/users/${selectedDriver.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/drivers"] });
      setEditDriverDialogOpen(false);
      setSelectedDriver(null);
      toast({
        title: "Success",
        description: "Driver updated successfully",
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

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/drivers"] });
      setDeleteDriverDialogOpen(false);
      setSelectedDriver(null);
      toast({
        title: "Success",
        description: "Driver deleted successfully",
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

  const updateRouteMutation = useMutation({
    mutationFn: async (data: InsertRoute) => {
      if (!selectedRoute) throw new Error("No route selected");
      const res = await apiRequest("PATCH", `/api/routes/${selectedRoute.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      setEditRouteDialogOpen(false);
      setSelectedRoute(null);
      toast({
        title: "Success",
        description: "Route updated successfully",
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

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/routes/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      setDeleteRouteDialogOpen(false);
      setSelectedRoute(null);
      toast({
        title: "Success",
        description: "Route deleted successfully",
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

  const onAddRouteSubmit = (data: InsertRoute) => {
    createRouteMutation.mutate(data);
  };

  const onEditTruckSubmit = (data: z.infer<typeof updateTruckSchema>) => {
    updateTruckMutation.mutate(data);
  };

  const onEditDriverSubmit = (data: z.infer<typeof updateDriverSchema>) => {
    updateDriverMutation.mutate(data);
  };

  const onEditRouteSubmit = (data: InsertRoute) => {
    updateRouteMutation.mutate(data);
  };

  const handleEditTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    editTruckForm.reset({
      truckNumber: truck.truckNumber,
      capacity: truck.capacity,
      status: truck.status as "available" | "on_trip" | "on_maintenance",
    });
    setEditTruckDialogOpen(true);
  };

  const handleDeleteTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    setDeleteTruckDialogOpen(true);
  };

  const handleEditDriver = (driver: Omit<User, "password">) => {
    setSelectedDriver(driver);
    editDriverForm.reset({
      name: driver.name,
      email: driver.email,
      status: driver.status as "available" | "on_trip" | "on_leave",
    });
    setEditDriverDialogOpen(true);
  };

  const handleDeleteDriver = (driver: Omit<User, "password">) => {
    setSelectedDriver(driver);
    setDeleteDriverDialogOpen(true);
  };

  const handleEditRoute = (route: Route) => {
    setSelectedRoute(route);
    editRouteForm.reset({
      origin: route.origin,
      destination: route.destination,
      routeName: route.routeName || "",
      crateCount: route.crateCount,
      notes: route.notes || "",
    });
    setEditRouteDialogOpen(true);
  };

  const handleDeleteRoute = (route: Route) => {
    setSelectedRoute(route);
    setDeleteRouteDialogOpen(true);
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
                  <TableHead>Actions</TableHead>
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
                        {truck.status.charAt(0).toUpperCase() + truck.status.slice(1).replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => handleEditTruck(truck)}
                          data-testid={`button-edit-truck-${truck.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleDeleteTruck(truck)}
                          data-testid={`button-delete-truck-${truck.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id} data-testid={`row-driver-${driver.id}`}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={driver.status === "available" ? "outline" : "default"}
                        data-testid={`badge-driver-status-${driver.status}`}
                      >
                        {driver.status.charAt(0).toUpperCase() + driver.status.slice(1).replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => handleEditDriver(driver)}
                          data-testid={`button-edit-driver-${driver.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleDeleteDriver(driver)}
                          data-testid={`button-delete-driver-${driver.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
          <Dialog open={addRouteDialogOpen} onOpenChange={setAddRouteDialogOpen}>
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
              <Form {...addRouteForm}>
                <form onSubmit={addRouteForm.handleSubmit(onAddRouteSubmit)} className="space-y-4">
                  <FormField
                    control={addRouteForm.control}
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
                    control={addRouteForm.control}
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
                    control={addRouteForm.control}
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
                    control={addRouteForm.control}
                    name="crateCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crate Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 100)}
                            data-testid="input-cratecount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addRouteForm.control}
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
                  <TableHead>Actions</TableHead>
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
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => handleEditRoute(route)}
                          data-testid={`button-edit-route-${route.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleDeleteRoute(route)}
                          data-testid={`button-delete-route-${route.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Truck Dialog */}
      <Dialog open={editTruckDialogOpen} onOpenChange={setEditTruckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Truck</DialogTitle>
            <DialogDescription>
              Update truck information
            </DialogDescription>
          </DialogHeader>
          <Form {...editTruckForm}>
            <form onSubmit={editTruckForm.handleSubmit(onEditTruckSubmit)} className="space-y-4">
              <FormField
                control={editTruckForm.control}
                name="truckNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Truck Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., TRK-001"
                        {...field}
                        data-testid="input-edit-truck-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTruckForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Liters)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        data-testid="input-edit-truck-capacity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTruckForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-truck-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available" data-testid="option-truck-available">Available</SelectItem>
                        <SelectItem value="on_trip" data-testid="option-truck-on-trip">On Trip</SelectItem>
                        <SelectItem value="on_maintenance" data-testid="option-truck-on-maintenance">On Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={updateTruckMutation.isPending}
                data-testid="button-submit-edit-truck"
              >
                {updateTruckMutation.isPending ? "Updating..." : "Update Truck"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Truck Dialog */}
      <AlertDialog open={deleteTruckDialogOpen} onOpenChange={setDeleteTruckDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-truck">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the truck "{selectedTruck?.truckNumber}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-truck">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTruck && deleteTruckMutation.mutate(selectedTruck.id)}
              disabled={deleteTruckMutation.isPending}
              data-testid="button-confirm-delete-truck"
            >
              {deleteTruckMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Driver Dialog */}
      <Dialog open={editDriverDialogOpen} onOpenChange={setEditDriverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update driver information
            </DialogDescription>
          </DialogHeader>
          <Form {...editDriverForm}>
            <form onSubmit={editDriverForm.handleSubmit(onEditDriverSubmit)} className="space-y-4">
              <FormField
                control={editDriverForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., John Doe"
                        {...field}
                        data-testid="input-edit-driver-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editDriverForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., john@example.com"
                        {...field}
                        data-testid="input-edit-driver-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editDriverForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-driver-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available" data-testid="option-driver-available">Available</SelectItem>
                        <SelectItem value="on_trip" data-testid="option-driver-on-trip">On Trip</SelectItem>
                        <SelectItem value="on_leave" data-testid="option-driver-on-leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={updateDriverMutation.isPending}
                data-testid="button-submit-edit-driver"
              >
                {updateDriverMutation.isPending ? "Updating..." : "Update Driver"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Driver Dialog */}
      <AlertDialog open={deleteDriverDialogOpen} onOpenChange={setDeleteDriverDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-driver">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the driver "{selectedDriver?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-driver">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDriver && deleteDriverMutation.mutate(selectedDriver.id)}
              disabled={deleteDriverMutation.isPending}
              data-testid="button-confirm-delete-driver"
            >
              {deleteDriverMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Route Dialog */}
      <Dialog open={editRouteDialogOpen} onOpenChange={setEditRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
            <DialogDescription>
              Update route information
            </DialogDescription>
          </DialogHeader>
          <Form {...editRouteForm}>
            <form onSubmit={editRouteForm.handleSubmit(onEditRouteSubmit)} className="space-y-4">
              <FormField
                control={editRouteForm.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From (Origin)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., New York"
                        {...field}
                        data-testid="input-edit-origin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editRouteForm.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To (Destination)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Los Angeles"
                        {...field}
                        data-testid="input-edit-destination"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editRouteForm.control}
                name="routeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., East Coast Route"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-edit-routename"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editRouteForm.control}
                name="crateCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crate Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 100)}
                        data-testid="input-edit-cratecount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editRouteForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional information about this route"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-edit-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={updateRouteMutation.isPending}
                data-testid="button-submit-edit-route"
              >
                {updateRouteMutation.isPending ? "Updating..." : "Update Route"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Route Dialog */}
      <AlertDialog open={deleteRouteDialogOpen} onOpenChange={setDeleteRouteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-route">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the route from "{selectedRoute?.origin}" to "{selectedRoute?.destination}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-route">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRoute && deleteRouteMutation.mutate(selectedRoute.id)}
              disabled={deleteRouteMutation.isPending}
              data-testid="button-confirm-delete-route"
            >
              {deleteRouteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
