import { useEffect, useMemo, useState } from 'react'
import { ApiError, apiClient } from './apiClient'
import { encryptSecret, decryptSecret } from './crypto'
import type { PageMode, SecretCreateResponse, SecretFetchResponse } from './types'
import { senderSteps, recipientSteps } from './constants'
import {
  extractTokenFromResponse,
  extractCiphertext,
  getSharedToken,
  buildShareUrl,
} from './helpers'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from './components/Header'
import { CreateSecretForm } from './components/forms/CreateSecretForm'
import { OpenSecretForm } from './components/forms/OpenSecretForm'
import { ProcessSteps } from './components/ProcessSteps'
import { UserStories } from './components/UserStories'

function App() {
  const initialToken = useMemo(() => getSharedToken(window.location.pathname), [])
  const [mode, setMode] = useState<PageMode>(initialToken ? 'open' : 'create')
  const [secretInput, setSecretInput] = useState('')
  const [ttlSeconds, setTtlSeconds] = useState(900) // 15 minutes default
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
      const response = await apiClient.post<SecretCreateResponse>('/api/secrets', { ciphertext, expires_in: ttlSeconds })
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
    setTtlSeconds(900)
    setCreatedUrl('')
    setCreateError('')
    setRevealedSecret('')
    setFetchError('')
  }

  return (
    <main className="dark min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Header mode={mode} onModeChange={setMode} />

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
                <CreateSecretForm
                  secretInput={secretInput}
                  onSecretChange={setSecretInput}
                  ttlSeconds={ttlSeconds}
                  onTtlChange={setTtlSeconds}
                  createdUrl={createdUrl}
                  createError={createError}
                  createBusy={createBusy}
                  copied={copied}
                  onCreateSecret={handleCreateSecret}
                  onCopyLink={handleCopyLink}
                  onReset={handleResetCreate}
                />
              ) : (
                <OpenSecretForm
                  initialToken={initialToken}
                  revealedSecret={revealedSecret}
                  fetchError={fetchError}
                  fetchBusy={fetchBusy}
                  onOpenSecret={handleOpenSecret}
                  onReset={handleResetCreate}
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <ProcessSteps
              title="Proces voor verzender"
              description="Komt overeen met het eerste diagram."
              steps={senderSteps}
            />
            <ProcessSteps
              title="Proces voor ontvanger"
              description="Komt overeen met het tweede diagram."
              steps={recipientSteps}
            />
          </div>
        </section>

        <Separator className="bg-white/10" />

        <UserStories />
      </div>
    </main>
  )
}

export default App
