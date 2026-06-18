export type PageMode = 'create' | 'open'

export type SecretCreateResponse = {
  token?: string
  url?: string
  data?: {
    token?: string
    url?: string
  }
}

export type SecretFetchResponse = {
  ciphertext?: string
  secret?: string
  data?: {
    ciphertext?: string
    secret?: string
  }
}
