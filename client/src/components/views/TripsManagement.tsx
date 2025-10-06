import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, PlayCircle, CheckCircle, FileDown, FileSpreadsheet } from "lucide-react";
import type { Trip, User, Truck as TruckType, Route } from "@shared/schema";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TripAssignmentForm } from "@/components/TripAssignmentForm";

const editTripSchema = z.object({
  rupees: z.string().min(1, "Payment amount is required"),
  distanceTravelled: z.string().optional(),
  avgSpeed: z.string().optional(),
  currentLocation: z.string().optional(),
});

export function TripsManagement() {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "status" | "driver" | "vehicle">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editTripDialogOpen, setEditTripDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const { toast } = useToast();

  const editTripForm = useForm<z.infer<typeof editTripSchema>>({
    resolver: zodResolver(editTripSchema),
    defaultValues: {
      rupees: "",
      distanceTravelled: "",
      avgSpeed: "",
      currentLocation: "",
    },
  });

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: drivers = [] } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users/drivers"],
  });

  const { data: trucks = [] } = useQuery<TruckType[]>({
    queryKey: ["/api/trucks"],
  });

  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  // Get unique months from trips
  const availableMonths = Array.from(
    new Set(
      trips
        .filter((trip) => trip.startTime)
        .map((trip) => {
          const dateStr = typeof trip.startTime === 'string' ? trip.startTime : trip.startTime!.toISOString();
          return format(parseISO(dateStr), "yyyy-MM");
        })
    )
  ).sort((a, b) => b.localeCompare(a));

  // Filter trips
  const filteredTrips = trips.filter((trip) => {
    const monthMatch =
      selectedMonth === "all" ||
      (trip.startTime &&
        format(parseISO(typeof trip.startTime === 'string' ? trip.startTime : trip.startTime.toISOString()), "yyyy-MM") === selectedMonth);

    const statusMatch =
      statusFilter === "all" || trip.status === statusFilter;

    const driverMatch =
      driverFilter === "all" || trip.driverId === driverFilter;

    const vehicleMatch =
      vehicleFilter === "all" || trip.truckId === vehicleFilter;

    return monthMatch && statusMatch && driverMatch && vehicleMatch;
  });

  // Sort trips
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "date") {
      const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
      comparison = dateA - dateB;
    } else if (sortBy === "status") {
      comparison = a.status.localeCompare(b.status);
    } else if (sortBy === "driver") {
      const driverA = drivers.find((d) => d.id === a.driverId)?.name || "";
      const driverB = drivers.find((d) => d.id === b.driverId)?.name || "";
      comparison = driverA.localeCompare(driverB);
    } else if (sortBy === "vehicle") {
      const vehicleA = trucks.find((t) => t.id === a.truckId)?.truckNumber || "";
      const vehicleB = trucks.find((t) => t.id === b.truckId)?.truckNumber || "";
      comparison = vehicleA.localeCompare(vehicleB);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const getDriver = (driverId: string) =>
    drivers.find((d) => d.id === driverId)?.name || "Unknown";

  const getTruck = (truckId: string) =>
    trucks.find((t) => t.id === truckId)?.truckNumber || "Unknown";

  const getRoute = (routeId: string) =>
    routes.find((r) => r.id === routeId)?.routeName || "Unknown";

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "scheduled" | "ongoing" | "completed" | "outline"> = {
      scheduled: "scheduled",
      ongoing: "ongoing",
      completed: "completed",
    };
    return (
      <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const startTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await apiRequest("PATCH", `/api/trips/${tripId}`, {
        status: "ongoing",
        startTime: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      toast({
        title: "Trip Started",
        description: "The trip has been started successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start trip",
        variant: "destructive",
      });
    },
  });

  const completeTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await apiRequest("PATCH", `/api/trips/${tripId}`, {
        status: "completed",
        endTime: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      toast({
        title: "Trip Completed",
        description: "The trip has been completed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete trip",
        variant: "destructive",
      });
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await apiRequest("DELETE", `/api/trips/${tripId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      toast({
        title: "Trip Deleted",
        description: "The trip has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trip",
        variant: "destructive",
      });
    },
  });

  const handleStartTrip = (tripId: string) => {
    startTripMutation.mutate(tripId);
  };

  const handleCompleteTrip = (tripId: string) => {
    completeTripMutation.mutate(tripId);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      deleteTripMutation.mutate(tripId);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    editTripForm.reset({
      rupees: trip.rupees.toString(),
      distanceTravelled: trip.distanceTravelled?.toString() || "",
      avgSpeed: trip.avgSpeed?.toString() || "",
      currentLocation: trip.currentLocation || "",
    });
    setEditTripDialogOpen(true);
  };

  const updateTripMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editTripSchema>) => {
      if (!selectedTrip) throw new Error("No trip selected");
      const res = await apiRequest("PATCH", `/api/trips/${selectedTrip.id}`, {
        rupees: data.rupees,
        distanceTravelled: data.distanceTravelled || "0",
        avgSpeed: data.avgSpeed || "0",
        currentLocation: data.currentLocation || "",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setEditTripDialogOpen(false);
      setSelectedTrip(null);
      toast({
        title: "Trip Updated",
        description: "The trip has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update trip",
        variant: "destructive",
      });
    },
  });

  const onEditTripSubmit = (data: z.infer<typeof editTripSchema>) => {
    updateTripMutation.mutate(data);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Trips Report", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 14, 30);
    
    if (selectedMonth !== "all") {
      doc.text(`Month: ${format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")}`, 14, 36);
    }
    if (statusFilter !== "all") {
      doc.text(`Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`, 14, 42);
    }
    
    const tableData = sortedTrips.map((trip) => [
      getDriver(trip.driverId),
      getTruck(trip.truckId),
      getRoute(trip.routeId),
      trip.startTime ? format(parseISO(typeof trip.startTime === 'string' ? trip.startTime : trip.startTime.toISOString()), "MMM dd, yyyy HH:mm") : "Not started",
      trip.status.charAt(0).toUpperCase() + trip.status.slice(1),
      `${trip.distanceTravelled || "0"} km`,
      `${trip.avgSpeed || "0"} km/h`,
      `₹${trip.rupees}`,
    ]);
    
    autoTable(doc, {
      startY: selectedMonth !== "all" || statusFilter !== "all" ? 48 : 36,
      head: [["Driver", "Truck", "Route", "Start Time", "Status", "Distance", "Speed", "Payment"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 20 },
      },
    });
    
    doc.save(`trips_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Trips report has been downloaded successfully.",
    });
  };

  const handleDownloadExcel = () => {
    const worksheetData = [
      ["Trips Report"],
      [`Generated on: ${format(new Date(), "MMM dd, yyyy HH:mm")}`],
      [],
      ["Driver", "Truck", "Route", "Start Time", "Status", "Distance (km)", "Speed (km/h)", "Payment (₹)"],
      ...sortedTrips.map((trip) => [
        getDriver(trip.driverId),
        getTruck(trip.truckId),
        getRoute(trip.routeId),
        trip.startTime ? format(parseISO(typeof trip.startTime === 'string' ? trip.startTime : trip.startTime.toISOString()), "MMM dd, yyyy HH:mm") : "Not started",
        trip.status.charAt(0).toUpperCase() + trip.status.slice(1),
        trip.distanceTravelled || "0",
        trip.avgSpeed || "0",
        trip.rupees,
      ]),
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trips");
    
    XLSX.writeFile(workbook, `trips_report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    
    toast({
      title: "Excel Downloaded",
      description: "Trips report has been downloaded successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Trips Management</h1>
        <p className="text-muted-foreground">
          View and manage all trips with filtering and sorting options
        </p>
      </div>

      <TripAssignmentForm />

      <Card className="hover-lift animate-fade-in gradient-card-blue">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white">Filters & Sorting</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month-filter" className="text-white/90">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-filter" data-testid="select-month-filter">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {format(parseISO(`${month}-01`), "MMMM yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-white/90">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver-filter" className="text-white/90">Driver</Label>
              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger id="driver-filter" data-testid="select-driver-filter">
                  <SelectValue placeholder="All Drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-filter" className="text-white/90">Vehicle</Label>
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger id="vehicle-filter" data-testid="select-vehicle-filter">
                  <SelectValue placeholder="All Vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {trucks.map((truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.truckNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-by" className="text-white/90">Sort By</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger id="sort-by" data-testid="select-sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-order" className="text-white/90">Order</Label>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                <SelectTrigger id="sort-order" data-testid="select-sort-order">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedMonth("all");
                setStatusFilter("all");
                setDriverFilter("all");
                setVehicleFilter("all");
                setSortBy("date");
                setSortOrder("desc");
              }}
              data-testid="button-reset-filters"
              className="text-white border-white/30 hover:bg-white/20"
            >
              Reset Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              data-testid="button-download-pdf"
              className="text-white border-white/30 hover:bg-white/20"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              data-testid="button-download-excel"
              className="text-white border-white/30 hover:bg-white/20"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Excel
            </Button>
            <span className="text-sm text-white/70">
              Showing {sortedTrips.length} of {trips.length} trips
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift animate-fade-in">
        <CardHeader>
          <CardTitle>All Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : sortedTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No trips found matching the filters
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Avg Speed</TableHead>
                    <TableHead>Payment (₹)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTrips.map((trip) => (
                    <TableRow key={trip.id} data-testid={`row-trip-${trip.id}`}>
                      <TableCell className="font-medium">
                        {getDriver(trip.driverId)}
                      </TableCell>
                      <TableCell>{getTruck(trip.truckId)}</TableCell>
                      <TableCell>{getRoute(trip.routeId)}</TableCell>
                      <TableCell>
                        {trip.startTime
                          ? format(parseISO(typeof trip.startTime === 'string' ? trip.startTime : trip.startTime.toISOString()), "MMM dd, yyyy HH:mm")
                          : "Not started"}
                      </TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell>{trip.distanceTravelled || "0"} km</TableCell>
                      <TableCell>{trip.avgSpeed || "0"} km/h</TableCell>
                      <TableCell>₹{trip.rupees}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {trip.status === "scheduled" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleStartTrip(trip.id)}
                              disabled={startTripMutation.isPending}
                              data-testid={`button-start-trip-${trip.id}`}
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {trip.status === "ongoing" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleCompleteTrip(trip.id)}
                              disabled={completeTripMutation.isPending}
                              data-testid={`button-complete-trip-${trip.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {trip.status !== "completed" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600"
                              onClick={() => handleEditTrip(trip)}
                              data-testid={`button-edit-trip-${trip.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleDeleteTrip(trip.id)}
                            disabled={deleteTripMutation.isPending}
                            data-testid={`button-delete-trip-${trip.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Trip Dialog */}
      <Dialog open={editTripDialogOpen} onOpenChange={setEditTripDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              Update trip information
            </DialogDescription>
          </DialogHeader>
          <Form {...editTripForm}>
            <form onSubmit={editTripForm.handleSubmit(onEditTripSubmit)} className="space-y-4">
              <FormField
                control={editTripForm.control}
                name="rupees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 5000"
                        {...field}
                        data-testid="input-edit-trip-rupees"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTripForm.control}
                name="distanceTravelled"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distance Travelled (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 250"
                        {...field}
                        data-testid="input-edit-trip-distance"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTripForm.control}
                name="avgSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Speed (km/h)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 60"
                        {...field}
                        data-testid="input-edit-trip-speed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTripForm.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Highway 101, Mile 45"
                        {...field}
                        data-testid="input-edit-trip-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditTripDialogOpen(false)}
                  data-testid="button-cancel-edit-trip"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateTripMutation.isPending}
                  data-testid="button-submit-edit-trip"
                >
                  {updateTripMutation.isPending ? "Updating..." : "Update Trip"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
