export const senderSteps = [
  'Gebruiker voert een wachtwoord of geheime tekst in.',
  'De browser maakt lokaal een AES-256 sleutel aan.',
  'De browser versleutelt het geheim voordat het verstuurd wordt.',
  'Alleen de ciphertext gaat naar de Laravel API.',
  'De API geeft een token terug waarmee een deelbare link wordt gebouwd.',
] as const

export const recipientSteps = [
  'Ontvanger opent de gedeelde link.',
  'De browser vraagt de ciphertext op met het token.',
  'De sleutel wordt uit het URL-fragment gelezen.',
  'De browser ontsleutelt lokaal en toont het geheim.',
  'Na openen hoort het geheim aan de serverkant verwijderd te zijn.',
] as const
