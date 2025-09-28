"use client"
import { useState } from "react"
import { Navigation } from "@/components/Navigation"
import { HomeScreen } from "@/components/HomeScreen"
import { ProfileScreen } from "@/components/ProfileScreen"
import { JournalingScreen } from "@/components/JournalingScreen"
import { AssistantScreen } from "@/components/AssistantScreen"
import { WorkspaceScreen } from "@/components/WorkspaceScreen"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

type Screen = "home" | "journal" | "assistant" | "profile" | "workspace"

export default function DashboardLayout() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home")

  const renderScreen = () => {
    switch (activeScreen) {
      case "home":
        return <HomeScreen />
      case "journal":
        return <JournalingScreen />
      case "assistant":
        return <AssistantScreen />
      case "workspace":
        return <WorkspaceScreen />
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
