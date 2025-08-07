// Simple toast utility as a replacement for sonner
export const toast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      // Use browser's built-in notification or simple alert for now
      console.log('✅ SUCCESS:', message)
      alert(`Success: ${message}`)
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      console.error('❌ ERROR:', message)
      alert(`Error: ${message}`)
    }
  },
  info: (message: string) => {
    if (typeof window !== 'undefined') {
      console.log('ℹ️ INFO:', message)
      alert(`Info: ${message}`)
    }
  }
}