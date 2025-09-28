"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Send, Bot, User, Wrench } from "lucide-react"

const productivityTools = [
  { name: "Notion", link: "https://notion.so", category: "Organization" },
  { name: "Slack", link: "https://slack.com", category: "Communication" },
  { name: "Trello", link: "https://trello.com", category: "Project Management" },
  { name: "Calendly", link: "https://calendly.com", category: "Scheduling" },
  { name: "Zapier", link: "https://zapier.com", category: "Automation" },
  { name: "Figma", link: "https://figma.com", category: "Design" },
  { name: "GitHub", link: "https://github.com", category: "Development" },
  { name: "Stripe", link: "https://stripe.com", category: "Payments" },
  { name: "Mailchimp", link: "https://mailchimp.com", category: "Marketing" },
  { name: "Zoom", link: "https://zoom.us", category: "Video Calls" },
]

const chatMessages = [
  { id: 1, sender: "AI Assistant", message: "How can I help optimize your productivity today?", isBot: true },
  { id: 2, sender: "You", message: "I need a tool to track my daily habits", isBot: false },
  {
    id: 3,
    sender: "AI Assistant",
    message: "I can help you build a custom habit tracker. What specific habits do you want to monitor?",
    isBot: true,
  },
]

export function AssistantScreen() {
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState(chatMessages)

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: "You",
        message: chatInput,
        isBot: false,
      }
      setMessages([...messages, newMessage])
      setChatInput("")

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          sender: "AI Assistant",
          message: "I understand. Let me help you create a custom solution for that.",
          isBot: true,
        }
        setMessages((prev) => [...prev, aiResponse])
      }, 1000)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Organization: "bg-blue-100 text-blue-800 border-blue-200",
      Communication: "bg-green-100 text-green-800 border-green-200",
      "Project Management": "bg-purple-100 text-purple-800 border-purple-200",
      Scheduling: "bg-orange-100 text-orange-800 border-orange-200",
      Automation: "bg-red-100 text-red-800 border-red-200",
      Design: "bg-pink-100 text-pink-800 border-pink-200",
      Development: "bg-gray-100 text-gray-800 border-gray-200",
      Payments: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Marketing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Video Calls": "bg-indigo-100 text-indigo-800 border-indigo-200",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
            {/* Left Column - Tools List */}
            <div className="space-y-4">
              <Card className="h-full">
                <CardHeader>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Productivity Tools
                  </h3>
                </CardHeader>
                <CardContent className="space-y-3 overflow-y-auto">
                  {productivityTools.map((tool, index) => (
                    <div
                      key={index}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{tool.name}</h4>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={tool.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(tool.category)}`}>
                        {tool.category}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Chat for Custom Tools */}
            <div className="space-y-4">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Productivity Assistant
                  </h3>
                  <p className="text-sm text-muted-foreground">Chat to build custom tools for your business</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-2 ${message.isBot ? "justify-start" : "justify-end"}`}
                      >
                        {message.isBot && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.isBot ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                        {!message.isBot && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Describe the tool you need..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
