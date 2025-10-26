import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share, Users, ExternalLink } from "lucide-react"

const posts = [
  {
    id: 1,
    author: "Thanish Kumar",
    handle: "@thanish_k",
    avatar: "/professional-woman-entrepreneur.png",
    time: "2h",
    situation: "Entrepreneurs in the healthcare domain faced difficulty in identifying relevant problem statements and market gaps.",
    action: "A custom health news webapp was deployed to aggregate, filter, and contextualize domain-specific updates for rapid scanning.",
    tool: "ReferralCandy",
    toolLink: "https://referralcandy.com",
    impact: "Reduced CAC by 40% and increased customer lifetime value by 25%",
    likes: 127,
    comments: 23,
  },
  {
    id: 2,
    author: "Marcus Rodriguez",
    handle: "@marcusgrind",
    avatar: "/young-male-entrepreneur.png",
    time: "4h",
    situation: "Team productivity was declining with remote work",
    action: "Set up async daily standups and focus time blocks",
    tool: "Notion",
    toolLink: "https://notion.so",
    impact: "Increased team output by 60% and improved work-life balance",
    likes: 89,
    comments: 15,
  },
  {
    id: 3,
    author: "Alex Thompson",
    handle: "@alexscales",
    avatar: "/business-person-glasses.png",
    time: "6h",
    situation: "Manual invoicing was eating up 10 hours per week",
    action: "Automated entire billing process with recurring payments",
    tool: "Stripe Billing",
    toolLink: "https://stripe.com/billing",
    impact: "Saved 40 hours monthly and reduced payment delays by 80%",
    likes: 234,
    comments: 41,
  },
]

const personalCommunities = [
  { id: 1, name: "YC Founders", members: "12.5K", active: true },
  { id: 2, name: "SaaS Builders", members: "8.2K", active: true },
  { id: 4, name: "Bootstrapped", members: "6.8K", active: true },
]

const globalCommunities = [
  { id: 3, name: "AI Entrepreneurs", members: "15.1K", active: false },
  { id: 5, name: "Product Hunt Makers", members: "22.3K", active: false },
  { id: 6, name: "Indie Hackers", members: "45.7K", active: true },
]

export function HomeScreen() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 flex max-w-7xl mx-auto">
        {/* Left Column - Groups & Communities (1/3) */}
        <div className="w-1/3 p-4 border-r border-border space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Personal Communities</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {personalCommunities.map((community) => (
                <div
                  key={community.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/10 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${community.active ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <p className="font-medium text-sm">{community.name}</p>
                      <p className="text-xs text-muted-foreground">{community.members} members</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold">Global Communities</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {globalCommunities.map((community) => (
                <div
                  key={community.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/10 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${community.active ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <p className="font-medium text-sm">{community.name}</p>
                      <p className="text-xs text-muted-foreground">{community.members} members</p>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Discover More
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Posts Feed (2/3) */}
        <div className="w-2/3 p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Community Feed</h1>
            <p className="text-muted-foreground">Real solutions from real founders</p>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.author} />
                      <AvatarFallback>
                        {post.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">{post.author}</h4>
                        <span className="text-sm text-muted-foreground">{post.handle}</span>
                        <span className="text-sm text-muted-foreground">· {post.time}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex gap-3">
                      <span className="font-semibold text-red-600 min-w-[80px]">Situation:</span>
                      <span className="text-foreground">{post.situation}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-blue-600 min-w-[80px]">Action:</span>
                      <span className="text-foreground">{post.action}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-purple-600 min-w-[80px]">Tool:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{post.tool}</span>
                        <a
                          href={post.toolLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-green-600 min-w-[80px]">Impact:</span>
                      <span className="text-foreground">{post.impact}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                      >
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
