import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
}

export function StatsCard({ title, value, icon: Icon, iconColor = "text-primary", onClick }: StatsCardProps) {
  return (
    <Card
      className={`group transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary/50 hover:border-l-primary overflow-visible hover-lift animate-fade-in ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      data-testid={`card-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">{title}</p>
            <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">{value}</p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
            <div className={`relative rounded-full w-14 h-14 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 ${iconColor} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <Icon className="h-7 w-7" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
