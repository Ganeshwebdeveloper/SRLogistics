import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Crate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CrateCounterProps {
  initialCount?: number;
  tripId?: string;
}

export function CrateCounter({ 
  initialCount = 100, 
  tripId
}: CrateCounterProps) {
  const { toast } = useToast();

  const { data: crate, isLoading } = useQuery<Crate>({
    queryKey: ["/api/crates/trip", tripId],
    enabled: !!tripId,
  });

  const updateCrateMutation = useMutation({
    mutationFn: async (change: number) => {
      if (!crate?.id) {
        throw new Error("No crate found");
      }
      const newRemaining = Math.max(0, (crate.remainingCount || 0) + change);
      const response = await apiRequest("PATCH", `/api/crates/${crate.id}`, {
        remainingCount: newRemaining,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crates/trip", tripId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update crate count",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = (change: number) => {
    updateCrateMutation.mutate(change);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crate Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const currentInitialCount = crate?.initialCount || initialCount;
  const remaining = crate?.remainingCount ?? currentInitialCount;
  const delivered = currentInitialCount - remaining;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crate Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Initial Count: {currentInitialCount}</p>
          <div className="text-5xl font-bold my-4" data-testid="text-crate-remaining">{remaining}</div>
          <p className="text-sm text-muted-foreground">Crates Remaining</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full"
            onClick={() => handleUpdate(-1)}
            disabled={updateCrateMutation.isPending || !tripId}
            data-testid="button-decrease-crate"
          >
            <Minus className="h-5 w-5" />
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full"
            onClick={() => handleUpdate(1)}
            disabled={updateCrateMutation.isPending || !tripId}
            data-testid="button-increase-crate"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-semibold text-chart-3" data-testid="text-crate-delivered">{delivered}</p>
            <p className="text-xs text-muted-foreground mt-1">Delivered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-chart-4">{remaining}</p>
            <p className="text-xs text-muted-foreground mt-1">Remaining</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
