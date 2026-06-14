import type { RawNusPacket } from './types'

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

export function deviceDisplayName(name: string | undefined, deviceId: string): string {
  const trimmed = (name || '').trim()
  if (trimmed) return trimmed
  const shortId = deviceId.length > 8 ? `${deviceId.slice(0, 8)}…` : deviceId
  return `Unknown Oximeter (${shortId})`
}

export function isLikelyOximeterName(name: string | undefined): boolean {
  if (!name) return false
  const n = name.toLowerCase()
  return (
    n.includes('oxi') ||
    n.includes('spo') ||
    n.includes('pulse') ||
    n.includes('pc-60') ||
    n.includes('berry') ||
    n.includes('contec') ||
    n.includes('cms') ||
    n.includes('jumper')
  )
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

/**
 * Parse a Nordic UART TX notification as raw binary.
 * Does not decode SpO₂, pulse, PI, signal, or battery — those offsets are unverified.
 */
export function parseNusNotification(data: DataView): RawNusPacket | null {
  if (data.byteLength === 0) return null

  const bytes = Array.from(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
  const hasAa55Header = bytes.length >= 2 && bytes[0] === 0xaa && bytes[1] === 0x55

  return {
    bytes,
    hex: bytesToHex(bytes),
    length: bytes.length,
    hasAa55Header,
    receivedAt: new Date().toISOString(),
  }
}

/** Web Bluetooth filters/optionalServices require lowercase UUID strings. */
export function webBluetoothUuid(uuid: string): string {
  return uuid.toLowerCase()
}

export function webBluetoothOptionalServices(uuids: readonly string[]): string[] {
  return uuids.map(webBluetoothUuid)
}

const GATT_CONNECT_TIMEOUT_MS = 20000

/** Connect GATT with a timeout so the UI does not hang indefinitely. */
export async function connectGattServer(
  device: BluetoothDevice,
  timeoutMs = GATT_CONNECT_TIMEOUT_MS,
): Promise<BluetoothRemoteGATTServer> {
  if (!device.gatt) {
    throw new Error('This device does not support Bluetooth GATT.')
  }

  let timeoutId: number | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(
        new Error(
          'Bluetooth connection timed out. Keep the oximeter on, on the finger, and close other apps using it, then try again.',
        ),
      )
    }, timeoutMs)
  })

  try {
    return await Promise.race([device.gatt.connect(), timeoutPromise])
  } finally {
    if (timeoutId != null) window.clearTimeout(timeoutId)
  }
}

/** Normalize UUID for comparison (Web Bluetooth may return short or long form). */
export function normalizeBleUuid(uuid: string): string {
  return uuid.toLowerCase().replace(/-/g, '')
}

export function uuidMatches(a: string, b: string): boolean {
  const na = normalizeBleUuid(a)
  const nb = normalizeBleUuid(b)
  if (na === nb) return true
  // 16-bit alias embedded in 128-bit base UUID
  if (na.length === 4 && nb.includes(na)) return true
  if (nb.length === 4 && na.includes(nb)) return true
  return false
}
