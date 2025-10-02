import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface CrateCounterProps {
  initialCount?: number;
  remainingCount?: number;
  onUpdate?: (change: number) => void;
}

export function CrateCounter({ 
  initialCount = 100, 
  remainingCount: initialRemaining,
  onUpdate 
}: CrateCounterProps) {
  const [remaining, setRemaining] = useState(initialRemaining ?? initialCount);

  const handleUpdate = (change: number) => {
    const newValue = Math.max(0, remaining + change);
    setRemaining(newValue);
    onUpdate?.(change);
    console.log(`Crate count updated by ${change}. New count: ${newValue}`);
  };

  const delivered = initialCount - remaining;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crate Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Initial Count: {initialCount}</p>
          <div className="text-5xl font-bold my-4">{remaining}</div>
          <p className="text-sm text-muted-foreground">Crates Remaining</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full"
            onClick={() => handleUpdate(-1)}
            data-testid="button-decrease-crate"
          >
            <Minus className="h-5 w-5" />
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full"
            onClick={() => handleUpdate(1)}
            data-testid="button-increase-crate"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-semibold text-chart-3">{delivered}</p>
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
