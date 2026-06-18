import type { SecretCreateResponse, SecretFetchResponse } from './types'

export function extractTokenFromResponse(response: SecretCreateResponse): string | null {
  return (
    response.token ??
    response.data?.token ??
    response.url?.split('/').filter(Boolean).at(-1) ??
    response.data?.url?.split('/').filter(Boolean).at(-1) ??
    null
  )
}

export function extractCiphertext(response: SecretFetchResponse): string | null {
  return response.ciphertext ?? response.data?.ciphertext ?? response.secret ?? response.data?.secret ?? null
}

export function getSharedToken(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)

  return parts.at(-1) ?? null
}

export function buildShareUrl(token: string, key: string): string {
  return `${window.location.origin}/${token}#${key}`
}
