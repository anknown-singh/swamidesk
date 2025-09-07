"use client";

import type { UserProfile } from "@/lib/types";
import { RotateCcw } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { GlobalSearch } from "@/components/search/global-search";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface HeaderProps {
  userProfile: UserProfile;
}

export function Header({ userProfile }: HeaderProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDatabase = async () => {
    // if (
    //   !confirm(
    //     "Are you sure you want to reset the database? This will delete all data except users, user profiles, patients, and medicine masters."
    //   )
    // ) {
    //   return;
    // }

    setIsResetting(true);
    try {
      const response = await fetch("/api/admin/reset-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("Database reset successfully!");
        // window.location.reload();
      } else {
        const error = await response.text();
        console.error(`Failed to reset database: ${error}`);
      }
    } catch (error) {
      console.error(`Error resetting database: ${error}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <GlobalSearch userProfile={userProfile} />
        </div>

        <div className="flex items-center space-x-4">
          {userProfile.role === "admin" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetDatabase}
              disabled={isResetting}
            >
              <RotateCcw
                className={`h-4 w-4 mr-2 ${isResetting ? "animate-spin" : ""}`}
              />
              {isResetting ? "Resetting..." : "Reset DB"}
            </Button>
          )}
          <NotificationCenter
            userId={userProfile.id}
            userRole={userProfile.role}
          />
        </div>
      </div>
    </header>
  );
}
