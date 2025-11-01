"use client"
import { Home, BookOpen, User, Briefcase, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface NavigationProps {
  activeScreen: "home" | "journal" | "assistant" | "profile" | "workspace"
  onScreenChange: (screen: "home" | "journal" | "assistant" | "profile" | "workspace") => void
}

export function Navigation({ activeScreen, onScreenChange }: NavigationProps) {
  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
        <Button
          variant={activeScreen === "home" ? "default" : "ghost"}
          size="sm"
          onClick={() => onScreenChange("home")}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>

        <Button
          variant={activeScreen === "journal" ? "default" : "ghost"}
          size="sm"
          onClick={() => onScreenChange("journal")}
          className="flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Journal</span>
        </Button>

        <Button
          variant={activeScreen === "assistant" ? "default" : "ghost"}
          size="sm"
          onClick={() => onScreenChange("assistant")}
          className="flex items-center gap-2"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">Assistant</span>
        </Button>

        <Button
          variant={activeScreen === "workspace" ? "default" : "ghost"}
          size="sm"
          onClick={() => onScreenChange("workspace")}
          className="flex items-center gap-2"
        >
          <Briefcase className="h-4 w-4" />
          <span className="hidden sm:inline">Workspace</span>
        </Button>

        <Button
          variant={activeScreen === "profile" ? "default" : "ghost"}
          size="sm"
          onClick={() => onScreenChange("profile")}
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </Button>

        <div className="w-px h-6 bg-border" />
        
        <ThemeToggle />
      </div>
    </div>
  )
}
