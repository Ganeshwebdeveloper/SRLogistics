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
      <Card className="gradient-card-teal hover-lift shadow-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white/90">Crate Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentInitialCount = crate?.initialCount || initialCount;
  const remaining = crate?.remainingCount ?? currentInitialCount;
  const delivered = currentInitialCount - remaining;

  return (
    <Card className="gradient-card-teal hover-lift shadow-xl overflow-hidden animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white/90">Crate Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <p className="text-sm text-white/70 mb-3 uppercase tracking-wide">Initial Count: {currentInitialCount}</p>
          <div className="text-6xl font-bold my-4 text-white animate-pulse-subtle" data-testid="text-crate-remaining">{remaining}</div>
          <p className="text-sm text-white/70 uppercase tracking-wide">Crates Remaining</p>
        </div>

        <div className="flex items-center justify-center gap-6">
          <Button
            size="icon"
            variant="outline"
            className="h-14 w-14 rounded-full border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-200"
            onClick={() => handleUpdate(-1)}
            disabled={updateCrateMutation.isPending || !tripId}
            data-testid="button-decrease-crate"
          >
            <Minus className="h-6 w-6" />
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            className="h-14 w-14 rounded-full border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-200"
            onClick={() => handleUpdate(1)}
            disabled={updateCrateMutation.isPending || !tripId}
            data-testid="button-increase-crate"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <p className="text-3xl font-bold text-white" data-testid="text-crate-delivered">{delivered}</p>
            <p className="text-xs text-white/70 mt-2 uppercase tracking-wide">Delivered</p>
          </div>
          <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <p className="text-3xl font-bold text-white">{remaining}</p>
            <p className="text-xs text-white/70 mt-2 uppercase tracking-wide">Remaining</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
