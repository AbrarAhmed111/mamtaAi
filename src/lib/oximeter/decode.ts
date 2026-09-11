/**
 * PC-60F / PC-60FW / Wellue vitals layout (Nordic UART, AA 55 header).
 * Verified against viatom_pc60fw reverse engineering and matching BLE captures.
 *
 * Numerical packet: AA 55 0F 08 01 [SpO2] [PR] ? [PI] ? [CRC]
 * Waveform packet: AA 55 0F 07 02 [pleth × N] [CRC] — no vitals in these.
 */

export type VerifiedOximeterVitals = {
  spo2: number
  pulseRate: number
  perfusionIndex?: number
  signalQuality?: number
  batteryLevel?: number
}

/** PC-60F family numerical vitals (function byte 0x01). */
const PC60F_FUNC_VITALS = 0x01
/** Plethysmogram waveform samples only — skip for SpO₂ / pulse display. */
const PC60F_FUNC_WAVEFORM = 0x02

export const OXIMETER_VITALS_DECODE_ENABLED = true

export function isPc60fWaveformPacket(bytes: number[]): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0xaa &&
    bytes[1] === 0x55 &&
    bytes[4] === PC60F_FUNC_WAVEFORM
  )
}

export function decodeVerifiedVitals(bytes: number[]): VerifiedOximeterVitals | null {
  if (!OXIMETER_VITALS_DECODE_ENABLED) return null
  if (bytes.length < 7) return null
  if (bytes[0] !== 0xaa || bytes[1] !== 0x55) return null

  const frameType = bytes[2]
  if (frameType !== 0x0f && frameType !== 0xf0) return null

  const func = bytes[4]
  if (func === PC60F_FUNC_WAVEFORM) return null
  if (func !== PC60F_FUNC_VITALS) return null

  const spo2 = bytes[5]
  const pulseRate = bytes[6]
  if (spo2 === 0 || pulseRate === 0) return null
  if (spo2 > 100 || pulseRate > 300) return null

  const perfusionIndex = bytes.length > 8 && bytes[8] > 0 ? bytes[8] : undefined

  return {
    spo2,
    pulseRate,
    perfusionIndex,
  }
}
