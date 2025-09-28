"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FolderOpen, Plus, Clock, TrendingUp, CheckCircle2, Calendar, Users, Zap, X, StickyNote } from "lucide-react"

export function WorkspaceScreen() {
  const [stickyNotes, setStickyNotes] = useState([
    { id: 1, text: "Complete user authentication system", color: "bg-yellow-200" },
    { id: 2, text: "Design payment flow wireframes", color: "bg-blue-200" },
    { id: 3, text: "Set up CI/CD pipeline", color: "bg-green-200" },
    { id: 4, text: "Write comprehensive API documentation", color: "bg-pink-200" },
    { id: 5, text: "Conduct user testing sessions", color: "bg-purple-200" },
  ])
  const [newNote, setNewNote] = useState("")

  const colors = ["bg-yellow-200", "bg-blue-200", "bg-green-200", "bg-pink-200", "bg-purple-200", "bg-orange-200"]

  const addStickyNote = () => {
    if (newNote.trim()) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      setStickyNotes([
        ...stickyNotes,
        {
          id: Date.now(),
          text: newNote.trim(),
          color: randomColor,
        },
      ])
      setNewNote("")
    }
  }

  const removeStickyNote = (id: number) => {
    setStickyNotes(stickyNotes.filter((note) => note.id !== id))
  }

  const tasks = [
    { id: 1, title: "Complete user authentication", priority: "High", completed: false },
    { id: 2, title: "Design payment flow", priority: "Medium", completed: true },
    { id: 3, title: "Set up CI/CD pipeline", priority: "High", completed: false },
    { id: 4, title: "Write API documentation", priority: "Low", completed: false },
  ]

  const metrics = [
    { label: "Active Projects", value: "3", icon: FolderOpen, color: "text-blue-600" },
    { label: "Tasks Completed", value: "24", icon: CheckCircle2, color: "text-green-600" },
    { label: "Hours This Week", value: "42", icon: Clock, color: "text-purple-600" },
    { label: "Team Members", value: "9", icon: Users, color: "text-orange-600" },
  ]

  return (
    <div className="min-h-screen bg-background p-6 pt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Workspace</h1>
            <p className="text-muted-foreground">Manage your projects and track progress</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  To Do
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new sticky note input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a new to-do item..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addStickyNote()}
                    className="flex-1"
                  />
                  <Button onClick={addStickyNote} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sticky notes grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stickyNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`${note.color} p-4 rounded-lg shadow-sm border-l-4 border-l-gray-400 relative group hover:shadow-md transition-shadow`}
                    >
                      <button
                        onClick={() => removeStickyNote(note.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 hover:bg-gray-100"
                      >
                        <X className="h-3 w-3 text-gray-600" />
                      </button>
                      <p className="text-sm font-medium text-gray-800 pr-6 leading-relaxed">{note.text}</p>
                    </div>
                  ))}
                </div>

                {stickyNotes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <StickyNote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No to-do items yet. Add one above to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tasks & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Recent Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        task.completed ? "bg-emerald-600 border-emerald-600" : "border-muted-foreground"
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          task.priority === "High"
                            ? "border-red-200 text-red-600"
                            : task.priority === "Medium"
                              ? "border-yellow-200 text-yellow-600"
                              : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
