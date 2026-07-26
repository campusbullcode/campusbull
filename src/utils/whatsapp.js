// Business WhatsApp number (country code + number, no + or spaces)
export const WHATSAPP_NUMBER = '919341888827'

// Opens WhatsApp with the message prefilled. The user still has to press send,
// so this must be called from a click/submit handler or the popup gets blocked.
export const openWhatsApp = (message) => {
  const text = encodeURIComponent(message)
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer')
}
