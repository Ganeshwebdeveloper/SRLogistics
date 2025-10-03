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
import { FileDown, FileSpreadsheet, IndianRupee } from "lucide-react";
import type { Trip, User, Truck as TruckType, Route } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function DriverSalaryView() {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const { toast } = useToast();

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

  const filteredTrips = trips.filter((trip) => {
    const monthMatch =
      selectedMonth === "all" ||
      (trip.startTime &&
        format(parseISO(typeof trip.startTime === 'string' ? trip.startTime : trip.startTime.toISOString()), "yyyy-MM") === selectedMonth);

    const driverMatch =
      selectedDriver === "all" || trip.driverId === selectedDriver;

    return monthMatch && driverMatch && trip.status === "completed";
  });

  const driverSalaryData = drivers
    .filter(driver => selectedDriver === "all" || driver.id === selectedDriver)
    .map((driver) => {
      const driverTrips = filteredTrips.filter((trip) => trip.driverId === driver.id);
      const totalSalary = driverTrips.reduce((sum, trip) => sum + parseFloat(trip.rupees.toString()), 0);
      const tripCount = driverTrips.length;

      return {
        driverId: driver.id,
        driverName: driver.name,
        tripCount,
        totalSalary,
        trips: driverTrips,
      };
    });

  const grandTotal = driverSalaryData.reduce((sum, driver) => sum + driver.totalSalary, 0);

  const getDriver = (driverId: string) =>
    drivers.find((d) => d.id === driverId)?.name || "Unknown";

  const getTruck = (truckId: string) =>
    trucks.find((t) => t.id === truckId)?.truckNumber || "Unknown";

  const getRoute = (routeId: string) =>
    routes.find((r) => r.id === routeId)?.routeName || "Unknown";

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Driver Salary Report", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 14, 30);
    
    if (selectedMonth !== "all") {
      doc.text(`Month: ${format(parseISO(`${selectedMonth}-01`), "MMMM yyyy")}`, 14, 36);
    }
    if (selectedDriver !== "all") {
      const driver = drivers.find(d => d.id === selectedDriver);
      doc.text(`Driver: ${driver?.name || "Unknown"}`, 14, 42);
    }
    
    const tableData = driverSalaryData.map((data) => [
      data.driverName,
      data.tripCount.toString(),
      `₹${data.totalSalary.toFixed(2)}`,
    ]);
    
    tableData.push([
      "Grand Total",
      driverSalaryData.reduce((sum, d) => sum + d.tripCount, 0).toString(),
      `₹${grandTotal.toFixed(2)}`,
    ]);
    
    autoTable(doc, {
      startY: selectedMonth !== "all" || selectedDriver !== "all" ? 48 : 36,
      head: [["Driver Name", "Trips Completed", "Total Salary"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
      },
      foot: [[`Total: ${driverSalaryData.length} driver(s)`, "", ""]],
      footStyles: { fillColor: [220, 220, 220], textColor: 0 },
    });
    
    doc.save(`driver_salary_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Driver salary report has been downloaded successfully.",
    });
  };

  const handleDownloadExcel = () => {
    const worksheetData = [
      ["Driver Salary Report"],
      [`Generated on: ${format(new Date(), "MMM dd, yyyy HH:mm")}`],
      [],
      ["Driver Name", "Trips Completed", "Total Salary (₹)"],
      ...driverSalaryData.map((data) => [
        data.driverName,
        data.tripCount,
        data.totalSalary.toFixed(2),
      ]),
      [],
      ["Grand Total", driverSalaryData.reduce((sum, d) => sum + d.tripCount, 0), grandTotal.toFixed(2)],
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    worksheet["!cols"] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Driver Salary");
    
    XLSX.writeFile(workbook, `driver_salary_report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    
    toast({
      title: "Excel Downloaded",
      description: "Driver salary report has been downloaded successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Driver Salary Report</h1>
        <p className="text-muted-foreground">
          View driver salary calculations based on completed trips
        </p>
      </div>

      <Card className="hover-lift animate-fade-in gradient-card-blue">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="driver-filter" className="text-white/90">Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
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
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedMonth("all");
                setSelectedDriver("all");
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
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift animate-fade-in">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Driver Salary Summary</CardTitle>
            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
              <IndianRupee className="h-6 w-6" />
              {grandTotal.toFixed(2)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : driverSalaryData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No drivers found matching the filters
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Trips Completed</TableHead>
                    <TableHead>Total Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driverSalaryData.map((data) => (
                    <TableRow key={data.driverId} data-testid={`row-driver-${data.driverId}`}>
                      <TableCell className="font-medium">{data.driverName}</TableCell>
                      <TableCell>{data.tripCount}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        ₹{data.totalSalary.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Grand Total</TableCell>
                    <TableCell>{driverSalaryData.reduce((sum, d) => sum + d.tripCount, 0)}</TableCell>
                    <TableCell className="text-primary">
                      ₹{grandTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDriver !== "all" && driverSalaryData.length > 0 && (
        <Card className="hover-lift animate-fade-in">
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driverSalaryData[0].trips.map((trip) => (
                    <TableRow key={trip.id} data-testid={`row-trip-${trip.id}`}>
                      <TableCell>{getTruck(trip.truckId)}</TableCell>
                      <TableCell>{getRoute(trip.routeId)}</TableCell>
                      <TableCell>
                        {trip.startTime
                          ? format(parseISO(typeof trip.startTime === 'string' ? trip.startTime : trip.startTime.toISOString()), "MMM dd, yyyy HH:mm")
                          : "Not started"}
                      </TableCell>
                      <TableCell>
                        {trip.endTime
                          ? format(parseISO(typeof trip.endTime === 'string' ? trip.endTime : trip.endTime.toISOString()), "MMM dd, yyyy HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>{trip.distanceTravelled || "0"} km</TableCell>
                      <TableCell className="font-semibold">₹{trip.rupees}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
