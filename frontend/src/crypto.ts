const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)

  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export async function encryptSecret(secret: string): Promise<{ ciphertext: string; key: string }> {
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

export async function decryptSecret(serializedPayload: string, encodedKey: string): Promise<string> {
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
