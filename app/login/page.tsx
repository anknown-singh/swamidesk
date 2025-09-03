"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DemoUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
  specialization?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const { login, loading: authLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Helper function to get dashboard path for user role
  const getDashboardPath = (role: string): string | null => {
    const dashboardPaths: Record<string, string> = {
      admin: "/admin/dashboard",
      doctor: "/doctor/dashboard",
      receptionist: "/receptionist/dashboard",
      service_attendant: "/attendant/dashboard",
      pharmacist: "/pharmacy/dashboard",
    };
    return dashboardPaths[role] || null;
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const targetPath = getDashboardPath(user.role);
      if (targetPath) {
        router.push(targetPath);
      }
    }
  }, [isAuthenticated, user, router]);

  // Load demo users for testing
  useEffect(() => {
    const loadDemoUsers = async () => {
      try {
        const supabase = createClient();
        const { data: users, error } = await supabase
          .from("users")
          .select(
            `
            id, 
            email, 
            role, 
            full_name,
            user_profiles(specialization)
          `
          )
          .eq("is_active", true)
          .order("role")
          .order("full_name");

        if (!error && users) {
          // Transform the data to flatten user_profiles
          const transformedUsers: DemoUser[] = users.map((user) => ({
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            specialization: user.user_profiles?.[0]?.specialization,
          }));
          setDemoUsers(transformedUsers);
        }
      } catch (error) {
        console.error("Failed to load demo users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadDemoUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    const result = await login(email, password);

    if (result.success && result.user) {
      const userRole = result.user.role;
      const targetPath = getDashboardPath(userRole);

      if (!targetPath) {
        console.error("Unknown user role:", userRole);
        setError("Invalid user role. Please contact administrator.");
        return;
      }

      console.log(
        "Login successful, redirecting to:",
        targetPath,
        "for role:",
        userRole
      );
      router.push(targetPath);
    } else {
      setError(result.error || "Login failed");
    }
  };

  const handleDemoUserSelect = (user: DemoUser) => {
    setEmail(user.email);
    setPassword("password123");
  };

  const formatRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: "Admin",
      doctor: "Doctor",
      receptionist: "Receptionist",
      pharmacist: "Pharmacist",
      service_attendant: "Service Attendant",
    };
    return roleNames[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const groupUsersByRole = (users: DemoUser[]) => {
    return users.reduce((groups: Record<string, DemoUser[]>, user) => {
      const role = user.role;
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(user);
      return groups;
    }, {});
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            SwamiCare
          </CardTitle>
          <CardDescription>Clinic Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={authLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={authLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 border-t pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Demo Accounts
                </h3>
              </div>

              {loadingUsers ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 flex items-center justify-center border border-blue-100">
                  <Loader2 className="h-5 w-5 animate-spin mr-3 text-blue-600" />
                  <span className="text-base text-blue-700 font-medium">
                    Loading demo accounts...
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Password Info Card */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-500 p-1.5 rounded-full">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <span className="font-semibold text-emerald-800">
                          Universal Password
                        </span>
                      </div>
                      <div className="bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg">
                        <span className="font-mono text-emerald-700 font-bold">
                          password123
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Accounts by Role */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {Object.entries(groupUsersByRole(demoUsers)).map(
                      ([role, roleUsers], index) => (
                        <div
                          key={role}
                          className={`${
                            index > 0 ? "border-t border-gray-100" : ""
                          }`}
                        >
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                                {formatRoleName(role)}
                              </h4>
                              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                                {roleUsers.length}
                              </span>
                            </div>
                          </div>

                          <div className="p-3">
                            <div className="space-y-2">
                              {roleUsers.map((user) => (
                                <div
                                  key={user.id}
                                  className="group flex items-center justify-between bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm p-3 transition-all duration-200 cursor-pointer"
                                  onClick={() => handleDemoUserSelect(user)}
                                >
                                  <div className="flex items-center flex-1 min-w-0">
                                    <div
                                      className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                                        user.role === "admin"
                                          ? "bg-red-500"
                                          : user.role === "doctor"
                                          ? "bg-blue-500"
                                          : user.role === "receptionist"
                                          ? "bg-green-500"
                                          : user.role === "pharmacist"
                                          ? "bg-purple-500"
                                          : user.role === "nurse"
                                          ? "bg-pink-500"
                                          : "bg-gray-500"
                                      }`}
                                    ></div>

                                    <div className="flex-1 min-w-0 text-left">
                                      <div className="text-sm font-semibold text-gray-900 truncate mb-1">
                                        {user.full_name}
                                        {user.role === "doctor" &&
                                          user.specialization && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                              {user.specialization}
                                            </span>
                                          )}
                                      </div>
                                      <div className="text-xs text-gray-600 truncate">
                                        {user.email}
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex-shrink-0 ${
                                      user.role === "admin"
                                        ? "bg-red-500 text-white group-hover:bg-red-600"
                                        : user.role === "doctor"
                                        ? "bg-blue-500 text-white group-hover:bg-blue-600"
                                        : user.role === "receptionist"
                                        ? "bg-green-500 text-white group-hover:bg-green-600"
                                        : user.role === "pharmacist"
                                        ? "bg-purple-500 text-white group-hover:bg-purple-600"
                                        : user.role === "nurse"
                                        ? "bg-pink-500 text-white group-hover:bg-pink-600"
                                        : "bg-gray-500 text-white group-hover:bg-gray-600"
                                    }`}
                                  >
                                    LOGIN
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {demoUsers.length === 0 && (
                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                      <div className="text-center">
                        <div className="bg-gray-200 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                          <span className="text-gray-500 text-xl">!</span>
                        </div>
                        <p className="text-gray-600 font-medium">
                          No demo accounts found
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="text-center">
                      <div className="bg-amber-500 p-1.5 rounded-full w-6 h-6 mx-auto mb-2 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <p className="text-sm text-amber-800 font-medium">
                        Click any account card to auto-fill login credentials
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
