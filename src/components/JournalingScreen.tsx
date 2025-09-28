"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "lucide-react"

export function JournalingScreen() {
  const [journalEntry, setJournalEntry] = useState("")

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <Card className="h-[calc(100vh-8rem)] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Business Journal</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea
                placeholder="Document your business journey today... What challenges did you face? What decisions did you make? What insights did you gain? What are your next steps?"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                className="flex-1 resize-none text-base leading-relaxed min-h-[400px]"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  {
                    journalEntry
                      .trim()
                      .split(/\s+/)
                      .filter((word) => word.length > 0).length
                  }{" "}
                  words
                </span>
                <Button>Save Entry</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
