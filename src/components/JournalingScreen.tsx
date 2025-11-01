"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarIcon, Save, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useAuth } from "@/contexts/AuthContext"

export function JournalingScreen() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [journalEntry, setJournalEntry] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [entryDates, setEntryDates] = useState<string[]>([])
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // Format date to ISO string (YYYY-MM-DD)
  const formatDateToISO = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  // Load entry for selected date
  const loadEntry = async (date: Date) => {
    if (!user) return

    setIsLoading(true)
    try {
      const dateISO = formatDateToISO(date)
      const response = await fetch(
        `/api/journal?userUid=${user.uid}&entryDate=${dateISO}`
      )

      if (response.ok) {
        const data = await response.json()
        if (data) {
          setJournalEntry(data.content)
          setCurrentEntryId(data.id)
        } else {
          setJournalEntry("")
          setCurrentEntryId(null)
        }
      } else {
        setJournalEntry("")
        setCurrentEntryId(null)
      }
    } catch (error) {
      console.error("Error loading journal entry:", error)
      setJournalEntry("")
      setCurrentEntryId(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Load dates that have entries for the current month
  const loadEntryDates = async (date: Date) => {
    if (!user) return

    try {
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // JavaScript months are 0-indexed
      const response = await fetch(
        `/api/journal/dates?userUid=${user.uid}&year=${year}&month=${month}`
      )

      if (response.ok) {
        const data = await response.json()
        setEntryDates(data.dates || [])
      }
    } catch (error) {
      console.error("Error loading entry dates:", error)
    }
  }

  // Save journal entry
  const saveEntry = async () => {
    if (!user) return

    setIsSaving(true)
    setSaveStatus("saving")

    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userUid: user.uid,
          entryDate: formatDateToISO(selectedDate),
          content: journalEntry,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentEntryId(data.id)
        setSaveStatus("saved")
        // Reload entry dates to update calendar highlights
        await loadEntryDates(selectedDate)
        
        // Reset save status after 2 seconds
        setTimeout(() => {
          setSaveStatus("idle")
        }, 2000)
      } else {
        setSaveStatus("error")
        setTimeout(() => {
          setSaveStatus("idle")
        }, 3000)
      }
    } catch (error) {
      console.error("Error saving journal entry:", error)
      setSaveStatus("error")
      setTimeout(() => {
        setSaveStatus("idle")
      }, 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setShowCalendar(false)
    loadEntry(date)
  }

  // Calculate word count
  const wordCount = journalEntry
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  // Load entry when component mounts or date changes
  useEffect(() => {
    loadEntry(selectedDate)
    loadEntryDates(selectedDate)
  }, [selectedDate, user])

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case "saving":
        return "Saving..."
      case "saved":
        return "Saved!"
      case "error":
        return "Error saving"
      default:
        return "Save Entry"
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar sidebar */}
            <div className="lg:col-span-1">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                highlightedDates={entryDates}
              />
              
              {/* Quick stats */}
              <Card className="mt-6">
                <CardHeader>
                  <h3 className="font-semibold text-sm">Journal Stats</h3>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entries this month:</span>
                    <span className="font-medium">{entryDates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current entry:</span>
                    <span className="font-medium">{wordCount} words</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Journal entry area */}
            <div className="lg:col-span-2">
              <Card className="h-[calc(100vh-8rem)] flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Business Journal</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="lg:hidden"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <Textarea
                        placeholder="Document your business journey today... What challenges did you face? What decisions did you make? What insights did you gain? What are your next steps?"
                        value={journalEntry}
                        onChange={(e) => setJournalEntry(e.target.value)}
                        className="flex-1 resize-none text-base leading-relaxed min-h-[400px]"
                      />
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-muted-foreground">
                          {wordCount} words
                        </span>
                        <Button
                          onClick={saveEntry}
                          disabled={isSaving || !journalEntry.trim()}
                          className={
                            saveStatus === "saved"
                              ? "bg-green-600 hover:bg-green-700"
                              : saveStatus === "error"
                              ? "bg-red-600 hover:bg-red-700"
                              : ""
                          }
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {getSaveButtonText()}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile calendar overlay */}
          {showCalendar && (
            <div className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  highlightedDates={entryDates}
                />
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowCalendar(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
