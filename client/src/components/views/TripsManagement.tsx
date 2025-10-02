import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, PlayCircle, CheckCircle } from "lucide-react";
import type { Trip, User, Truck as TruckType, Route } from "@shared/schema";
import { format, parseISO } from "date-fns";

export function TripsManagement() {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "status" | "driver">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

    return monthMatch && statusMatch;
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
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      scheduled: "secondary",
      ongoing: "default",
      completed: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Trips Management</h1>
        <p className="text-muted-foreground">
          View and manage all trips with filtering and sorting options
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Sorting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month-filter">Month</Label>
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
              <Label htmlFor="status-filter">Status</Label>
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
              <Label htmlFor="sort-by">Sort By</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger id="sort-by" data-testid="select-sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-order">Order</Label>
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

          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedMonth("all");
                setStatusFilter("all");
                setSortBy("date");
                setSortOrder("desc");
              }}
              data-testid="button-reset-filters"
            >
              Reset Filters
            </Button>
            <span className="text-sm text-muted-foreground">
              Showing {sortedTrips.length} of {trips.length} trips
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
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
                    <TableHead>Salary</TableHead>
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
                      <TableCell>${trip.salary}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {trip.status === "scheduled" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600"
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
                              data-testid={`button-edit-trip-${trip.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600"
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
    </div>
  );
}
