import { Eye, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  mode: 'create' | 'open'
  onModeChange: (mode: 'create' | 'open') => void
}

export function Header({ mode, onModeChange }: HeaderProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge className="w-fit border-sky-400/20 bg-sky-500/10 text-sky-100 hover:bg-sky-500/10">
            Password Sharing Tool
          </Badge>
          <div className="space-y-2">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Deel een wachtwoord via een eenmalige, client-side versleutelde link.
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
              De browser versleutelt lokaal, de API bewaart alleen ciphertext en na openen hoort het geheim direct verwijderd te worden.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={mode === 'create' ? 'default' : 'outline'}
            onClick={() => onModeChange('create')}
          >
            <Send />
            Link aanmaken
          </Button>
          <Button
            type="button"
            variant={mode === 'open' ? 'default' : 'outline'}
            onClick={() => onModeChange('open')}
          >
            <Eye />
            Link openen
          </Button>
        </div>
      </div>
    </section>
  )
}
