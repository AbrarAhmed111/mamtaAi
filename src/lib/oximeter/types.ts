/** Nordic UART Service (NUS) — verified for this oximeter. Web Bluetooth requires lowercase UUIDs. */
export const OXIMETER_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'

/** Device → app notifications (Notify). Do not write here. */
export const OXIMETER_TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'

/** App → device writes (Write / Write Without Response). Do not send commands until protocol is verified. */
export const OXIMETER_RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'

/** Passed to requestDevice optionalServices so GATT can resolve NUS after pairing. */
export const OXIMETER_BLE_OPTIONAL_SERVICES = [OXIMETER_SERVICE_UUID]

export type OximeterConnectionStatus =
  | 'idle'
  | 'permission_required'
  | 'searching'
  | 'device_found'
  | 'pairing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'unsupported'
  | 'error'

export type OximeterAlarmType =
  | 'low_spo2'
  | 'high_pulse'
  | 'low_pulse'
  | 'poor_signal'
  | 'sensor_removed'
  | 'device_disconnected'

export type Spo2VisualStatus = 'normal' | 'attention' | 'critical' | 'unreliable'

export interface OximeterConnection {
  status: OximeterConnectionStatus
  deviceId: string | null
  deviceRowId: string | null
  deviceName: string | null
  babyId: string | null
  babyName: string | null
  sessionId: string | null
  signalStrength?: number
  batteryLevel?: number
  lastReadingAt?: string | null
  error?: string | null
}

export interface OximeterLiveReading {
  spo2: number | null
  pulseRate: number | null
  perfusionIndex?: number | null
  signalQuality?: number | null
  isValid: boolean
  spo2Status: Spo2VisualStatus
  measuredAt: string
  isStale?: boolean
  /** True when vitals are not yet decoded from binary payload. */
  decodePending?: boolean
}

/** Parsed NUS notification — binary only, no assumed vitals. */
export interface RawNusPacket {
  bytes: number[]
  hex: string
  length: number
  /** Some packets begin with 0xAA 0x55; binary, not UTF-8 text. */
  hasAa55Header: boolean
  receivedAt: string
}

export interface OximeterSessionStats {
  currentSpo2: number | null
  currentPulse: number | null
  minSpo2: number | null
  maxSpo2: number | null
  avgSpo2: number | null
  minPulse: number | null
  maxPulse: number | null
  avgPulse: number | null
  readingCount: number
  sessionStartedAt: string | null
  lastUpdatedAt: string | null
}

export interface DiscoveredBleDevice {
  id: string
  name: string
  model?: string | null
  rssi?: number | null
  /** True when device exposes Nordic UART (known oximeter transport). */
  isRecognized: boolean
}

export interface OximeterDeviceRow {
  id: string
  device_id: string
  device_name: string | null
  model: string | null
  manufacturer: string | null
  baby_id: string | null
  connection_status: string | null
  battery_level: number | null
  last_connected_at: string | null
  last_reading_at: string | null
  is_active: boolean | null
}

export const OXIMETER_SAVE_INTERVAL_MS = 2000
export const OXIMETER_CHART_MAX_POINTS = 300
export const OXIMETER_STALE_AFTER_MS = 15000
export const OXIMETER_RECONNECT_DELAYS_MS = [0, 2000, 5000, 10000, 10000]

/** @deprecated Use OXIMETER_BLE_OPTIONAL_SERVICES */
export const OXIMETER_BLE_SERVICE_HINTS = OXIMETER_BLE_OPTIONAL_SERVICES

/** @deprecated Use OXIMETER_TX_UUID */
export const OXIMETER_BLE_NOTIFY_HINTS = [OXIMETER_TX_UUID]
