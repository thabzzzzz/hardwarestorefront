import { toast as sonnerToast } from 'sonner'

// Re-export Sonner's toast API without custom styling so default
// success toasts render with their normal appearance.
export const toast = sonnerToast
export default sonnerToast
