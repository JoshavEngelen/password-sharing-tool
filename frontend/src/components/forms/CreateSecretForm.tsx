import { Check, Copy, Lock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface CreateSecretFormProps {
  secretInput: string
  onSecretChange: (value: string) => void
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
  createdUrl,
  createError,
  createBusy,
  copied,
  onCreateSecret,
  onCopyLink,
  onReset,
}: CreateSecretFormProps) {
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
