import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";
import heroImage from "@assets/generated_images/Milk_delivery_truck_hero_image_f6477e41.png";

interface LoginPageProps {
  onLogin: (email: string, password: string, role: "admin" | "driver") => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "driver">("admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password, role);
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
                  />
                </div>

                <div className="space-y-2">
                  <Label>Login as</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={role === "admin" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setRole("admin")}
                      data-testid="button-role-admin"
                    >
                      Admin
                    </Button>
                    <Button
                      type="button"
                      variant={role === "driver" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setRole("driver")}
                      data-testid="button-role-driver"
                    >
                      Driver
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" data-testid="button-login">
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
