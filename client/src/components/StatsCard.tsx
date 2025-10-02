import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  gradientClass?: string;
  onClick?: () => void;
}

export function StatsCard({ title, value, icon: Icon, iconColor = "text-primary", gradientClass, onClick }: StatsCardProps) {
  const hasGradient = gradientClass && gradientClass.startsWith('gradient-card-');
  
  return (
    <Card
      className={`group transition-all duration-300 hover:shadow-lg ${hasGradient ? 'border-white/20' : 'border-l-4 border-l-primary/50 hover:border-l-primary'} overflow-visible hover-lift animate-fade-in ${gradientClass || ''} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      data-testid={`card-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm font-semibold uppercase tracking-wide ${hasGradient ? 'text-white/80' : 'text-muted-foreground'}`}>{title}</p>
            <p className={`text-4xl font-bold mt-3 transition-all duration-300 group-hover:scale-105 ${hasGradient ? 'text-white' : 'bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'}`}>{value}</p>
          </div>
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-md group-hover:blur-lg transition-all duration-300 ${hasGradient ? 'bg-white/20' : 'bg-primary/20'}`}></div>
            <div className={`relative rounded-full w-14 h-14 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${hasGradient ? 'bg-white/20 text-white' : `bg-gradient-to-br from-primary/20 to-primary/10 ${iconColor}`}`}>
              <Icon className="h-7 w-7" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
