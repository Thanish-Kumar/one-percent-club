"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarIcon, Save, Loader2, Edit3, CheckSquare, PencilLine } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"

type JournalMode = "manual" | "auto"

interface Question {
  id: number
  question: string
  options: string[]
}

export function JournalingScreen() {
  const { user } = useAuth()
  const [mode, setMode] = useState<JournalMode>("manual")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [journalEntry, setJournalEntry] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [entryDates, setEntryDates] = useState<string[]>([])
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [autoAnswers, setAutoAnswers] = useState<Record<number, string>>({})
  const [customInputActive, setCustomInputActive] = useState<Record<number, boolean>>({})
  const [customInputValues, setCustomInputValues] = useState<Record<number, string>>({})
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionsSource, setQuestionsSource] = useState<"default" | "custom" | null>(null)

  // Format date to ISO string (YYYY-MM-DD) using local timezone
  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Check if selected date is in the future
  const isFutureDate = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset to midnight
    const selectedDateMidnight = new Date(date)
    selectedDateMidnight.setHours(0, 0, 0, 0) // Reset to midnight
    return selectedDateMidnight > today
  }

  const isDateInFuture = isFutureDate(selectedDate)

  // Load journal questions from API for specific user and date
  const loadQuestions = async (date: Date) => {
    if (!user) {
      console.log("⚠️  No user logged in, cannot load questions")
      return
    }
    
    setQuestionsLoading(true)
    setQuestionsSource(null)
    
    try {
      const dateISO = formatDateToISO(date)
      console.log(`📅 Loading questions for user: ${user.uid}, date: ${dateISO}`)
      
      const response = await fetch(
        `/api/journal-questions?userUid=${user.uid}&entryDate=${dateISO}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.questions) {
          setQuestions(data.questions)
          // Check if this is from default template or custom
          setQuestionsSource(data.isDefault ? "default" : "custom")
          console.log(`✅ Loaded ${data.questions.length} questions (source: ${data.isDefault ? 'default template' : 'custom'})`)
        } else {
          console.error("❌ Failed to load questions: Invalid response format")
          setQuestions([])
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ Failed to load questions:", errorData.error || response.statusText)
        setQuestions([])
      }
    } catch (error) {
      console.error("❌ Error loading journal questions:", error)
      setQuestions([])
    } finally {
      setQuestionsLoading(false)
    }
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
          
          // Try to parse auto mode answers if present
          try {
            const parsedAnswers = parseAutoAnswers(data.content)
            if (parsedAnswers) {
              setAutoAnswers(parsedAnswers)
              // Check which answers are custom (not in predefined options)
              const customActive: Record<number, boolean> = {}
              const customValues: Record<number, string> = {}
              questions.forEach(q => {
                const answer = parsedAnswers[q.id]
                if (answer && !q.options.includes(answer)) {
                  customActive[q.id] = true
                  customValues[q.id] = answer
                }
              })
              setCustomInputActive(customActive)
              setCustomInputValues(customValues)
            } else {
              setAutoAnswers({})
              setCustomInputActive({})
              setCustomInputValues({})
            }
          } catch {
            setAutoAnswers({})
            setCustomInputActive({})
            setCustomInputValues({})
          }
        } else {
          setJournalEntry("")
          setCurrentEntryId(null)
          setAutoAnswers({})
          setCustomInputActive({})
          setCustomInputValues({})
        }
      } else {
        setJournalEntry("")
        setCurrentEntryId(null)
        setAutoAnswers({})
        setCustomInputActive({})
        setCustomInputValues({})
      }
    } catch (error) {
      console.error("Error loading journal entry:", error)
      setJournalEntry("")
      setCurrentEntryId(null)
      setAutoAnswers({})
      setCustomInputActive({})
      setCustomInputValues({})
    } finally {
      setIsLoading(false)
    }
  }

  // Parse auto mode answers from journal entry
  const parseAutoAnswers = (content: string): Record<number, string> | null => {
    const autoModeMarker = "## Auto Journal Entry"
    if (!content.includes(autoModeMarker)) return null
    
    const answers: Record<number, string> = {}
    const lines = content.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(/^\*\*Q(\d+):\*\*.*Answer: (.+)$/)
      if (match) {
        const questionId = parseInt(match[1])
        const answer = match[2]
        answers[questionId] = answer
      }
    }
    
    return Object.keys(answers).length > 0 ? answers : null
  }

  // Handle auto mode answer selection
  const handleAutoAnswer = (questionId: number, answer: string) => {
    setAutoAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    // Deactivate custom input when a button is clicked (but preserve the typed text)
    setCustomInputActive(prev => ({
      ...prev,
      [questionId]: false
    }))
  }

  // Handle custom input activation
  const handleCustomInputClick = (questionId: number) => {
    setCustomInputActive(prev => ({
      ...prev,
      [questionId]: true
    }))
    // Set the custom input value as the answer if it exists, otherwise clear the answer
    if (customInputValues[questionId]?.trim()) {
      setAutoAnswers(prev => ({
        ...prev,
        [questionId]: customInputValues[questionId].trim()
      }))
    } else {
      setAutoAnswers(prev => {
        const newAnswers = { ...prev }
        delete newAnswers[questionId]
        return newAnswers
      })
    }
  }

  // Handle custom input change
  const handleCustomInputChange = (questionId: number, value: string) => {
    // Always save the typed value
    setCustomInputValues(prev => ({
      ...prev,
      [questionId]: value
    }))
    // Update the answer only if custom input is active
    if (customInputActive[questionId]) {
      if (value.trim()) {
        setAutoAnswers(prev => ({
          ...prev,
          [questionId]: value.trim()
        }))
      } else {
        setAutoAnswers(prev => {
          const newAnswers = { ...prev }
          delete newAnswers[questionId]
          return newAnswers
        })
      }
    }
  }

  // Generate content from auto mode answers
  const generateAutoContent = (): string => {
    let content = "## Auto Journal Entry\n\n"
    
    questions.forEach(q => {
      const answer = autoAnswers[q.id] || "Not answered"
      content += `**Q${q.id}:** ${q.question}\nAnswer: ${answer}\n\n`
    })
    
    return content
  }

  // Save auto mode entry
  const saveAutoEntry = async () => {
    const content = generateAutoContent()
    await saveEntryWithContent(content)
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

  // Generic save function
  const saveEntryWithContent = async (content: string) => {
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
          content: content,
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

  // Save journal entry (manual mode)
  const saveEntry = async () => {
    await saveEntryWithContent(journalEntry)
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

  // Load entry and questions when component mounts or date/user changes
  useEffect(() => {
    if (user) {
      loadQuestions(selectedDate)
      loadEntry(selectedDate)
      loadEntryDates(selectedDate)
    }
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
                    <span className="font-medium">
                      {mode === "manual" 
                        ? `${wordCount} words`
                        : `${Object.keys(autoAnswers).length}/${questions.length} answered`
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Journal entry area */}
            <div className="lg:col-span-2">
              <Card className={`flex flex-col ${mode === "manual" ? "h-[calc(100vh-8rem)]" : ""}`}>
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">
                        {mode === "manual" ? "Business Journal" : "Quick Journal"}
                      </h3>
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
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      
                      {/* Mode Toggle */}
                      <div className="inline-flex rounded-lg border border-border p-1 bg-muted">
                        <Button
                          variant={mode === "manual" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setMode("manual")}
                          className="rounded-md h-7 px-2 text-xs"
                          disabled={isDateInFuture}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Manual
                        </Button>
                        <Button
                          variant={mode === "auto" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setMode("auto")}
                          className="rounded-md h-7 px-2 text-xs"
                          disabled={isDateInFuture}
                        >
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Auto
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={`flex flex-col ${mode === "manual" ? "flex-1" : "flex-grow"}`}>
                  {isDateInFuture ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center space-y-4 p-8">
                        <div className="text-6xl mb-4">📅</div>
                        <h3 className="text-xl font-semibold">Future Date Selected</h3>
                        <p className="text-muted-foreground max-w-md">
                          Journaling is only available for today and past dates. 
                          You cannot create journal entries for future dates.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Selected: {selectedDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <Button
                          onClick={() => setSelectedDate(new Date())}
                          className="mt-4"
                        >
                          Go to Today
                        </Button>
                      </div>
                    </div>
                  ) : isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : mode === "manual" ? (
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
                          disabled={isSaving || !journalEntry.trim() || isDateInFuture}
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
                  ) : questionsLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading questions...</span>
                    </div>
                  ) : questions.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-muted-foreground">No questions available. Please contact support.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-6 pb-4">
                        {questions.map((q) => (
                          <div key={q.id} className="space-y-3">
                            <h4 className="font-medium text-sm">
                              {q.id}. {q.question}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((option) => (
                                <Button
                                  key={option}
                                  variant={autoAnswers[q.id] === option && !customInputActive[q.id] ? "default" : "outline"}
                                  className="justify-start text-left h-auto py-3 px-4 min-h-[52px]"
                                  onClick={() => handleAutoAnswer(q.id, option)}
                                >
                                  {option}
                                </Button>
                              ))}
                              {/* Custom input option */}
                              <div className="relative min-h-[52px] flex items-center">
                                {!customInputActive[q.id] ? (
                                  <Button
                                    variant={customInputValues[q.id]?.trim() ? "secondary" : "outline"}
                                    className="justify-start text-left h-auto py-3 px-4 flex items-center gap-2 min-h-[52px] w-full"
                                    onClick={() => handleCustomInputClick(q.id)}
                                  >
                                    <PencilLine className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{customInputValues[q.id]?.trim() || "Type Your Own"}</span>
                                  </Button>
                                ) : (
                                  <>
                                    <Input
                                      type="text"
                                      placeholder="Enter your response..."
                                      value={customInputValues[q.id] || ""}
                                      onChange={(e) => handleCustomInputChange(q.id, e.target.value)}
                                      className="h-[52px] pr-10 w-full"
                                      autoFocus
                                    />
                                    <PencilLine className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 mt-4 border-t flex-shrink-0">
                        <span className="text-sm text-muted-foreground">
                          {Object.keys(autoAnswers).length} of {questions.length} questions answered
                        </span>
                        <Button
                          onClick={saveAutoEntry}
                          disabled={isSaving || Object.keys(autoAnswers).length === 0 || isDateInFuture}
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
