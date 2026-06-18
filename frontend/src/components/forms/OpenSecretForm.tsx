import { Eye, KeyRound } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface OpenSecretFormProps {
  initialToken: string | null
  revealedSecret: string
  fetchError: string
  fetchBusy: boolean
  onOpenSecret: (token: string) => void
  onReset: () => void
}

export function OpenSecretForm({
  initialToken,
  revealedSecret,
  fetchError,
  fetchBusy,
  onOpenSecret,
  onReset,
}: OpenSecretFormProps) {
  return (
    <>
      <div className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-white">Token in pad</p>
          <p className="mt-1 break-all text-sm text-slate-400">
            {initialToken ?? 'Geen token gevonden in deze URL'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-white">Sleutel in fragment</p>
          <p className="mt-1 break-all text-sm text-slate-400">
            {window.location.hash ? 'Aanwezig' : 'Ontbreekt'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => initialToken && void onOpenSecret(initialToken)}
          disabled={!initialToken || fetchBusy}
        >
          <KeyRound />
          {fetchBusy ? 'Geheim wordt opgehaald...' : 'Geheim ophalen en ontsleutelen'}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          Nieuwe link aanmaken
        </Button>
      </div>

      {fetchError && (
        <Alert className="border-destructive/30 bg-destructive/5 text-slate-100">
          <AlertTitle>Geheim niet beschikbaar</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {revealedSecret && (
        <Alert className="border-emerald-400/20 bg-emerald-500/10 text-slate-100">
          <AlertTitle>Geheim ontsleuteld</AlertTitle>
          <AlertDescription>
            Story 2 voltooid: het wachtwoord is lokaal zichtbaar en kan nu opgeslagen worden.
          </AlertDescription>
          <Textarea
            value={revealedSecret}
            readOnly
            className="mt-3 min-h-32 border-white/10 bg-slate-950/60 text-slate-100"
          />
        </Alert>
      )}

      {!revealedSecret && !fetchError && (
        <Alert className="border-white/10 bg-slate-950/50 text-slate-100">
          <AlertTitle>Eenmalige toegang</AlertTitle>
          <AlertDescription>
            Story 3 verwacht dat de backend het geheim na deze leesactie verwijdert. Als de link daarna opnieuw geopend wordt, moet de API een niet-beschikbaar resultaat geven.
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
