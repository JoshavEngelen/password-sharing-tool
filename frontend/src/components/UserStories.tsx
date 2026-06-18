import { Eye, Link2, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const userStories = [
  {
    icon: Lock,
    title: 'User story 1',
    description: 'Als gebruiker wil ik met mijn wachtwoord een link kunnen aanmaken zodat ik deze kan delen.',
  },
  {
    icon: Eye,
    title: 'User story 2',
    description: 'Als gebruiker wil ik een wachtwoord kunnen bekijken na het openen van een link zodat ik deze kan opslaan.',
  },
  {
    icon: Link2,
    title: 'User story 3',
    description: 'Als gebruiker wil ik dat mijn wachtwoord wordt verwijderd na het openen van een link zodat de tool AVG-compliant is.',
  },
]

export function UserStories() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {userStories.map((story) => {
        const Icon = story.icon
        return (
          <Card key={story.title} className="border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Icon className="size-4" />
                {story.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">{story.description}</CardContent>
          </Card>
        )
      })}
    </div>
  )
}
