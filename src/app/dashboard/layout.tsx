"use client"
import { useState } from "react"
import { Navigation } from "@/components/Navigation"
import { HomeScreen } from "@/components/HomeScreen"
import { ProfileScreen } from "@/components/ProfileScreen"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

type Screen = "home" | "journal" | "assistant" | "profile" | "workspace"

export default function DashboardLayout() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home")

  const renderScreen = () => {
    switch (activeScreen) {
      case "home":
        return <HomeScreen />
      case "journal":
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Journal</h1>
              <p className="text-muted-foreground">Journal feature coming soon...</p>
            </div>
          </div>
        )
      case "assistant":
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">AI Assistant</h1>
              <p className="text-muted-foreground">AI Assistant feature coming soon...</p>
            </div>
          </div>
        )
      case "workspace":
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Workspace</h1>
              <p className="text-muted-foreground">Workspace feature coming soon...</p>
            </div>
          </div>
        )
      case "profile":
        return <ProfileScreen />
      default:
        return <HomeScreen />
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation activeScreen={activeScreen} onScreenChange={setActiveScreen} />
        {renderScreen()}
      </div>
    </ProtectedRoute>
  )
}
