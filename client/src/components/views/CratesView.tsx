import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Minus, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Route, CrateDailyBalance } from "@shared/schema";
import { format, addDays, startOfDay, endOfDay, parseISO } from "date-fns";

interface DailyBalanceWithRoute extends CrateDailyBalance {
  routeName: string | null;
}

export function CratesView() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return format(today, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const weekLater = addDays(today, 6);
    return format(weekLater, "yyyy-MM-dd");
  });
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const { data: routes = [], isLoading: routesLoading } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  const routeIds = useMemo(() => routes.map((r) => r.id), [routes]);

  const { data: dailyBalances = [], isLoading: balancesLoading } = useQuery<DailyBalanceWithRoute[]>({
    queryKey: ["/api/crates/daily", routeIds, startDate, endDate],
    enabled: routeIds.length > 0,
    queryFn: async () => {
      if (routeIds.length === 0) return [];
      
      const params = new URLSearchParams();
      routeIds.forEach(id => params.append("routeIds", id));
      params.append("startDate", new Date(startDate).toISOString());
      params.append("endDate", new Date(endDate).toISOString());

      const response = await fetch(`/api/crates/daily?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch daily balances");
      return response.json();
    },
  });

  const adjustCrateMutation = useMutation({
    mutationFn: async ({
      routeId,
      date,
      delta,
    }: {
      routeId: string;
      date: string;
      delta: number;
    }) => {
      const response = await apiRequest("POST", "/api/crates/adjust", {
        routeId,
        date: new Date(date).toISOString(),
        delta,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crates/daily"] });
      toast({
        title: "Success",
        description: "Crate count updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update crate count",
        variant: "destructive",
      });
    },
  });

  const setCrateMutation = useMutation({
    mutationFn: async ({
      routeId,
      date,
      count,
    }: {
      routeId: string;
      date: string;
      count: number;
    }) => {
      const response = await apiRequest("POST", "/api/crates/set", {
        routeId,
        date: new Date(date).toISOString(),
        count,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crates/daily"] });
      const key = `${variables.routeId}-${variables.date}`;
      setEditingValues(prev => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set crate count",
        variant: "destructive",
      });
    },
  });

  const dateRange = useMemo(() => {
    const dates: Date[] = [];
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));
    let current = start;

    while (current <= end) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }

    return dates;
  }, [startDate, endDate]);

  const getBalanceForRouteAndDate = (routeId: string, date: Date): CrateDailyBalance | undefined => {
    const dateStr = format(date, "yyyy-MM-dd");
    return dailyBalances.find((balance) => {
      const balanceDate = format(new Date(balance.date), "yyyy-MM-dd");
      return balance.routeId === routeId && balanceDate === dateStr;
    });
  };

  const getRouteBalance = (routeId: string): number => {
    const routeBalances = dailyBalances
      .filter((b) => b.routeId === routeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (routeBalances.length > 0) {
      return routeBalances[0].closingCount;
    }
    
    const route = routes.find((r) => r.id === routeId);
    return route?.crateCount || 100;
  };

  const handleAdjust = (routeId: string, date: Date, delta: number) => {
    adjustCrateMutation.mutate({
      routeId,
      date: format(date, "yyyy-MM-dd"),
      delta,
    });
  };

  const handleSetCount = (routeId: string, date: Date, count: number) => {
    setCrateMutation.mutate({
      routeId,
      date: format(date, "yyyy-MM-dd"),
      count,
    });
  };

  if (routesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Crates Management</h1>
          <p className="text-muted-foreground">
            Track and manage daily crate counts for all routes
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading routes...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Crates Management</h1>
        <p className="text-muted-foreground">
          Track and manage daily crate counts for all routes
        </p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="start-date">From Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="end-date">To Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crate Grid Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Crate Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No routes available
            </div>
          ) : balancesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading crate data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10 min-w-[200px] border-r">
                      Route (Balance)
                    </TableHead>
                    {dateRange.map((date) => (
                      <TableHead key={date.toISOString()} className="text-center min-w-[120px]">
                        <div className="flex flex-col">
                          <span className="font-semibold">{format(date, "MMM dd")}</span>
                          <span className="text-xs text-muted-foreground">{format(date, "EEE")}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => {
                    const balance = getRouteBalance(route.id);
                    return (
                      <TableRow key={route.id} data-testid={`row-route-${route.id}`}>
                        <TableCell className="sticky left-0 bg-card z-10 font-medium border-r">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{route.routeName || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">
                              Balance: <span className="font-bold text-primary">{balance}</span>
                            </span>
                          </div>
                        </TableCell>
                        {dateRange.map((date) => {
                          const dayBalance = getBalanceForRouteAndDate(route.id, date);
                          const count = dayBalance?.closingCount ?? route.crateCount;
                          const dateKey = format(date, "yyyy-MM-dd");
                          const inputKey = `${route.id}-${dateKey}`;
                          const displayValue = editingValues[inputKey] !== undefined ? editingValues[inputKey] : count.toString();
                          
                          return (
                            <TableCell key={date.toISOString()} className="text-center p-2">
                              <div className="flex flex-col items-center gap-1">
                                <Input
                                  type="number"
                                  value={displayValue}
                                  onChange={(e) => {
                                    setEditingValues(prev => ({
                                      ...prev,
                                      [inputKey]: e.target.value
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const newValue = parseInt(e.target.value, 10);
                                    if (!isNaN(newValue) && newValue >= 0 && newValue !== count) {
                                      handleSetCount(route.id, date, newValue);
                                    } else {
                                      setEditingValues(prev => {
                                        const newValues = { ...prev };
                                        delete newValues[inputKey];
                                        return newValues;
                                      });
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className="h-8 w-20 text-center text-lg font-bold"
                                  data-testid={`input-count-${route.id}-${dateKey}`}
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={() => handleAdjust(route.id, date, 1)}
                                    disabled={adjustCrateMutation.isPending}
                                    data-testid={`button-plus-${route.id}-${dateKey}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={() => handleAdjust(route.id, date, -1)}
                                    disabled={adjustCrateMutation.isPending}
                                    data-testid={`button-minus-${route.id}-${dateKey}`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
