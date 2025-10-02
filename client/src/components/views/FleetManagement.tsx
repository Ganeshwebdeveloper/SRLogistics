import { useQuery } from "@tanstack/react-query";
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
import type { Truck } from "@shared/schema";

export function FleetManagement() {
  const { data: trucks = [], isLoading } = useQuery<Truck[]>({
    queryKey: ["/api/trucks"],
  });

  const availableTrucks = trucks.filter((t) => t.status === "available");
  const busyTrucks = trucks.filter((t) => t.status === "busy");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Fleet Management</h1>
        <p className="text-muted-foreground">Manage and monitor your truck fleet</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{trucks.length}</div>
            <div className="text-sm text-muted-foreground">Total Trucks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{availableTrucks.length}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">{busyTrucks.length}</div>
            <div className="text-sm text-muted-foreground">On Trip</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Trucks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
    </div>
  );
}
