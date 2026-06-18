import { Check, Copy, Lock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'

interface CreateSecretFormProps {
  secretInput: string
  onSecretChange: (value: string) => void
  ttlSeconds: number
  onTtlChange: (value: number) => void
  maxUses: number
  onMaxUsesChange: (value: number) => void
  createdUrl: string
  createError: string
  createBusy: boolean
  copied: boolean
  onCreateSecret: () => void
  onCopyLink: () => void
  onReset: () => void
}

export function CreateSecretForm({
  secretInput,
  onSecretChange,
  ttlSeconds,
  onTtlChange,
  maxUses,
  onMaxUsesChange,
  createdUrl,
  createError,
  createBusy,
  copied,
  onCreateSecret,
  onCopyLink,
  onReset,
}: CreateSecretFormProps) {
  const formatTtl = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="secret-input" className="text-sm font-medium text-slate-100">
          Geheime tekst of wachtwoord
        </label>
        <Textarea
          id="secret-input"
          value={secretInput}
          onChange={(event) => onSecretChange(event.target.value)}
          placeholder="Bijvoorbeeld een tijdelijk wachtwoord of recovery code"
          className="min-h-40 border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500"
        />
        <p className="text-sm text-slate-400">
          De sleutel blijft in de browser en komt alleen in het URL-fragment terecht.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-slate-950/50 p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="ttl-slider" className="text-sm font-medium text-slate-100">
            Link verloopt na
          </label>
          <span className="rounded bg-sky-500/20 px-3 py-1 text-sm font-medium text-sky-300">
            {formatTtl(ttlSeconds)}
          </span>
        </div>
        <Slider
          id="ttl-slider"
          min={60}
          max={21600}
          step={60}
          value={[ttlSeconds]}
          onValueChange={(value) => onTtlChange(value[0])}
          className="w-full"
        />
        <p className="text-xs text-slate-400">1 minuut - 6 uur</p>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-slate-950/50 p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="max-uses" className="text-sm font-medium text-slate-100">
            Aantal keer openbaar
          </label>
          <span className="rounded bg-sky-500/20 px-3 py-1 text-sm font-medium text-sky-300">
            {maxUses}
          </span>
        </div>
        <input
          id="max-uses"
          type="number"
          min="1"
          max="100"
          value={maxUses}
          onChange={(event) => onMaxUsesChange(Math.max(1, parseInt(event.target.value) || 1))}
          className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
        <p className="text-xs text-slate-400">1 - 100 keer</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">AES-256</p>
          <p className="text-sm text-slate-400">Sleutel wordt lokaal gegenereerd</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">Ciphertext only</p>
          <p className="text-sm text-slate-400">Alleen versleutelde data gaat naar de API</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">One-time link</p>
          <p className="text-sm text-slate-400">Na ophalen hoort het geheim verwijderd te zijn</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => void onCreateSecret()} disabled={createBusy}>
          <Lock />
          {createBusy ? 'Link wordt aangemaakt...' : 'Versleutel en maak link'}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>

      {createError && (
        <Alert className="border-destructive/30 bg-destructive/5 text-slate-100">
          <AlertTitle>Aanmaken mislukt</AlertTitle>
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      )}

      {createdUrl && (
        <Alert className="border-sky-400/20 bg-sky-500/10 text-slate-100">
          <AlertTitle>Deelbare link aangemaakt</AlertTitle>
          <AlertDescription>
            Verstuur deze link veilig. De sleutel zit alleen achter het #-fragment.
          </AlertDescription>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input value={createdUrl} readOnly className="border-white/10 bg-slate-950/60 text-slate-100" />
            <Button type="button" variant="secondary" onClick={onCopyLink}>
              {copied ? <Check /> : <Copy />}
              {copied ? 'Gekopieerd' : 'Kopieer link'}
            </Button>
          </div>
        </Alert>
      )}
    </>
  )
}
