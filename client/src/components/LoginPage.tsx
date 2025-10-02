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
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
        <div className="absolute bottom-8 left-8 right-8 text-primary-foreground">
          <h1 className="text-4xl font-bold mb-2">DeliTruck</h1>
          <p className="text-lg opacity-90">Professional Fleet Management for Milk Transport</p>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">DeliTruck</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to manage your fleet operations</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                    required
                    disabled={loginMutation.isPending}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                    required
                    disabled={loginMutation.isPending}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  data-testid="button-login"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
                <p className="text-xs">Admin: admin@delitruck.com / admin123</p>
                <p className="text-xs">Driver: john@delitruck.com / driver123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
