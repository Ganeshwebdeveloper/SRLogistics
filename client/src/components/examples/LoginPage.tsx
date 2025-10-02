import { LoginPage } from '../LoginPage'

export default function LoginPageExample() {
  const handleLogin = (email: string, password: string, role: "admin" | "driver") => {
    console.log("Login attempt:", { email, role });
  };

  return <LoginPage onLogin={handleLogin} />
}
