import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";
import heroImage from "@assets/generated_images/Milk_delivery_truck_hero_image_f6477e41.png";
import type { User } from "@shared/schema";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return await response.json() as User;
    },
    onSuccess: (user) => {
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      onLogin(user);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={heroImage}
          alt="Milk delivery truck"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-background/90" />
        <div className="absolute bottom-8 left-8 right-8 text-white animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="h-12 w-12" />
            <div>
              <h1 className="text-5xl font-bold mb-2">SR Logistics</h1>
              <p className="text-xl font-medium">Professional Fleet Management for Milk Transport</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="p-2 bg-primary rounded-lg">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">SR Logistics</h1>
              <p className="text-sm text-muted-foreground">Fleet Management</p>
            </div>
          </div>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in border-primary/20">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription className="text-base">Sign in to manage your fleet operations</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                    required
                    disabled={loginMutation.isPending}
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                    required
                    disabled={loginMutation.isPending}
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-6 transition-all duration-200 hover:scale-[1.02]" 
                  data-testid="button-login"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              
              <div className="mt-6 p-4 bg-gradient-to-br from-muted/50 to-muted rounded-lg border border-border/50">
                <p className="text-xs font-semibold text-foreground mb-3">Demo Credentials:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs bg-background/50 p-2 rounded">
                    <span className="font-medium">Admin:</span>
                    <span className="text-muted-foreground">admin@srlogistics.com / admin123</span>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-background/50 p-2 rounded">
                    <span className="font-medium">Driver:</span>
                    <span className="text-muted-foreground">john@srlogistics.com / driver123</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
