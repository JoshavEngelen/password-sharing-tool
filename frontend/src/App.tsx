import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Eye, KeyRound, Link2, Lock, Send, ShieldAlert } from 'lucide-react'

import { ApiError, apiClient } from './apiClient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

type PageMode = 'create' | 'open'

type SecretCreateResponse = {
  token?: string
  url?: string
  data?: {
    token?: string
    url?: string
  }
}

type SecretFetchResponse = {
  ciphertext?: string
  secret?: string
  data?: {
    ciphertext?: string
    secret?: string
  }
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const senderSteps = [
  'Gebruiker voert een wachtwoord of geheime tekst in.',
  'De browser maakt lokaal een AES-256 sleutel aan.',
  'De browser versleutelt het geheim voordat het verstuurd wordt.',
  'Alleen de ciphertext gaat naar de Laravel API.',
  'De API geeft een token terug waarmee een deelbare link wordt gebouwd.',
] as const

const recipientSteps = [
  'Ontvanger opent de gedeelde link.',
  'De browser vraagt de ciphertext op met het token.',
  'De sleutel wordt uit het URL-fragment gelezen.',
  'De browser ontsleutelt lokaal en toont het geheim.',
  'Na openen hoort het geheim aan de serverkant verwijderd te zijn.',
] as const

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)

  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function encryptSecret(secret: string): Promise<{ ciphertext: string; key: string }> {
  const rawKey = crypto.getRandomValues(new Uint8Array(32))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode(secret),
  )

  return {
    ciphertext: JSON.stringify({
      iv: base64UrlEncode(iv),
      ciphertext: base64UrlEncode(new Uint8Array(encrypted)),
    }),
    key: base64UrlEncode(rawKey),
  }
}

async function decryptSecret(serializedPayload: string, encodedKey: string): Promise<string> {
  const { iv, ciphertext } = JSON.parse(serializedPayload) as {
    iv: string
    ciphertext: string
  }

  const rawKey = base64UrlDecode(encodedKey)
  const normalizedIv = new Uint8Array(toArrayBuffer(base64UrlDecode(iv)))
  const normalizedCiphertext = new Uint8Array(toArrayBuffer(base64UrlDecode(ciphertext)))
  const cryptoKey = await crypto.subtle.importKey('raw', toArrayBuffer(rawKey), 'AES-GCM', false, ['decrypt'])
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: normalizedIv },
    cryptoKey,
    normalizedCiphertext,
  )

  return decoder.decode(decrypted)
}

function extractTokenFromResponse(response: SecretCreateResponse): string | null {
  return (
    response.token ??
    response.data?.token ??
    response.url?.split('/').filter(Boolean).at(-1) ??
    response.data?.url?.split('/').filter(Boolean).at(-1) ??
    null
  )
}

function extractCiphertext(response: SecretFetchResponse): string | null {
  return response.ciphertext ?? response.data?.ciphertext ?? response.secret ?? response.data?.secret ?? null
}

function getSharedToken(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)

  return parts.at(-1) ?? null
}

function buildShareUrl(token: string, key: string): string {
  return `${window.location.origin}/${token}#${key}`
}

function App() {
  const initialToken = useMemo(() => getSharedToken(window.location.pathname), [])
  const [mode, setMode] = useState<PageMode>(initialToken ? 'open' : 'create')
  const [secretInput, setSecretInput] = useState('')
  const [createdUrl, setCreatedUrl] = useState('')
  const [createError, setCreateError] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [revealedSecret, setRevealedSecret] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [fetchBusy, setFetchBusy] = useState(false)

  useEffect(() => {
    if (!createdUrl || !copied) {
      return undefined
    }

    const timeout = window.setTimeout(() => setCopied(false), 2000)

    return () => window.clearTimeout(timeout)
  }, [copied, createdUrl])

  useEffect(() => {
    if (!initialToken) {
      return
    }

    void handleOpenSecret(initialToken)
  }, [initialToken])

  async function handleCreateSecret() {
    if (!secretInput.trim()) {
      setCreateError('Voer eerst een wachtwoord of geheime tekst in.')
      return
    }

    setCreateBusy(true)
    setCreateError('')
    setCreatedUrl('')

    try {
      const { ciphertext, key } = await encryptSecret(secretInput)
      const response = await apiClient.post<SecretCreateResponse>('/api/secrets', { ciphertext })
      const token = extractTokenFromResponse(response)

      if (!token) {
        throw new Error('De API gaf geen token terug.')
      }

      setCreatedUrl(buildShareUrl(token, key))
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Link aanmaken mislukt.')
    } finally {
      setCreateBusy(false)
    }
  }

  async function handleOpenSecret(token: string) {
    const key = window.location.hash.replace(/^#/, '')

    if (!key) {
      setFetchError('De gedeelde link bevat geen sleutel in het URL-fragment.')
      return
    }

    setFetchBusy(true)
    setFetchError('')
    setRevealedSecret('')

    try {
      const response = await apiClient.get<SecretFetchResponse>(`/api/secrets/${token}`)
      const ciphertext = extractCiphertext(response)

      if (!ciphertext) {
        throw new Error('Geen ciphertext ontvangen voor dit token.')
      }

      const decrypted = await decryptSecret(ciphertext, key)
      setRevealedSecret(decrypted)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setFetchError('Deze link is verlopen of het geheim is al opgehaald.')
      } else {
        setFetchError(error instanceof Error ? error.message : 'Geheim ophalen mislukt.')
      }
    } finally {
      setFetchBusy(false)
    }
  }

  async function handleCopyLink() {
    if (!createdUrl) {
      return
    }

    await navigator.clipboard.writeText(createdUrl)
    setCopied(true)
  }

  function handleResetCreate() {
    window.history.pushState({}, '', '/')
    setMode('create')
    setSecretInput('')
    setCreatedUrl('')
    setCreateError('')
    setRevealedSecret('')
    setFetchError('')
  }

  return (
    <main className="dark min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
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
                onClick={() => setMode('create')}
              >
                <Send />
                Link aanmaken
              </Button>
              <Button
                type="button"
                variant={mode === 'open' ? 'default' : 'outline'}
                onClick={() => setMode('open')}
              >
                <Eye />
                Link openen
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
            <CardHeader className="border-b border-white/10 bg-white/5">
              <CardTitle className="text-white">
                {mode === 'create' ? '1. Wachtwoord delen' : '2. Wachtwoord bekijken'}
              </CardTitle>
              <CardDescription className="text-slate-300">
                {mode === 'create'
                  ? 'Story 1: maak een deelbare link aan met client-side encryptie.'
                  : 'Story 2 en 3: open een link, ontsleutel lokaal en toon verlopen status als het geheim al verbruikt is.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {mode === 'create' ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="secret-input" className="text-sm font-medium text-slate-100">
                      Geheime tekst of wachtwoord
                    </label>
                    <Textarea
                      id="secret-input"
                      value={secretInput}
                      onChange={(event) => setSecretInput(event.target.value)}
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
                    <Button type="button" onClick={() => void handleCreateSecret()} disabled={createBusy}>
                      <Lock />
                      {createBusy ? 'Link wordt aangemaakt...' : 'Versleutel en maak link'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleResetCreate}>
                      Reset
                    </Button>
                  </div>

                  {createError && (
                    <Alert className="border-destructive/30 bg-destructive/5 text-slate-100">
                      <ShieldAlert className="mb-2 size-4" />
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
                        <Button type="button" variant="secondary" onClick={() => void handleCopyLink()}>
                          {copied ? <Check /> : <Copy />}
                          {copied ? 'Gekopieerd' : 'Kopieer link'}
                        </Button>
                      </div>
                    </Alert>
                  )}
                </>
              ) : (
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
                      onClick={() => initialToken && void handleOpenSecret(initialToken)}
                      disabled={!initialToken || fetchBusy}
                    >
                      <KeyRound />
                      {fetchBusy ? 'Geheim wordt opgehaald...' : 'Geheim ophalen en ontsleutelen'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleResetCreate}>
                      Nieuwe link aanmaken
                    </Button>
                  </div>

                  {fetchError && (
                    <Alert className="border-destructive/30 bg-destructive/5 text-slate-100">
                      <ShieldAlert className="mb-2 size-4" />
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
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Proces voor verzender</CardTitle>
                <CardDescription className="text-slate-300">Komt overeen met het eerste diagram.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {senderSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-sky-50">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-300">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Proces voor ontvanger</CardTitle>
                <CardDescription className="text-slate-300">Komt overeen met het tweede diagram.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recipientSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-emerald-50">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-300">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="bg-white/10" />

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Lock className="size-4" />
                User story 1
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Als gebruiker wil ik met mijn wachtwoord een link kunnen aanmaken zodat ik deze kan delen.
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Eye className="size-4" />
                User story 2
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Als gebruiker wil ik een wachtwoord kunnen bekijken na het openen van een link zodat ik deze kan opslaan.
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Link2 className="size-4" />
                User story 3
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Als gebruiker wil ik dat mijn wachtwoord wordt verwijderd na het openen van een link zodat de tool AVG-compliant is.
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

export default App
