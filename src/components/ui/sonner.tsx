'use client'

import { Toaster as HotToaster, toast as hotToast } from 'react-hot-toast'

export const Toaster = (props: { position?: 'top-center' | 'top-right' | 'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-left'; }) => {
  return <HotToaster position={props.position || 'top-center'} reverseOrder={false} />
}

export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  warning: (message: string) => hotToast(message, { icon: '⚠️' }),
  info: (message: string) => hotToast(message),
}


