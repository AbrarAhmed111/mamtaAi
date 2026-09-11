'use client'

import { usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { dashboardFetch } from '@/lib/session/client'
import { playNotificationBeep, markOximeterAlertSoundPlayed } from '@/lib/notification-feedback'
import { parseNotificationPreferences } from '@/lib/notification-preferences'
import { useAuth } from '@/lib/supabase/context'
import {
  buildOximeterAlertCopy,
  breachUsesSpo2Pref,
  DEFAULT_BABY_OXIMETER_ALERTS,
  evaluateBabyOximeterBreaches,
  parseBabyOximeterAlerts,
  type BabyOximeterAlerts,
  type OximeterBreachKind,
} from '@/lib/oximeter/baby-thresholds'
import { SustainedBreachTracker } from '@/lib/oximeter/sustained-breach'
import {
  OXIMETER_BLE_OPTIONAL_SERVICES,
  OXIMETER_CHART_MAX_POINTS,
  OXIMETER_RECONNECT_DELAYS_MS,
  OXIMETER_SAVE_INTERVAL_MS,
  OXIMETER_SERVICE_UUID,
  OXIMETER_STALE_AFTER_MS,
  OXIMETER_TX_UUID,
  type DiscoveredBleDevice,
  type OximeterConnection,
  type OximeterConnectionStatus,
  type OximeterLiveReading,
  type RawNusPacket,
} from '@/lib/oximeter/types'
import {
  connectGattServer,
  deviceDisplayName,
  isLikelyOximeterName,
  isWebBluetoothSupported,
  parseNusNotification,
  webBluetoothOptionalServices,
  webBluetoothUuid,
} from '@/lib/oximeter/ble'
import {
  decodeVerifiedVitals,
  OXIMETER_VITALS_DECODE_ENABLED,
  type VerifiedOximeterVitals,
} from '@/lib/oximeter/decode'
import { detectAlarms } from '@/lib/oximeter/thresholds'
import { computeSessionStats, toLiveReading } from '@/lib/oximeter/stats'
import type { OximeterSessionStats } from '@/lib/oximeter/types'

type BabyOption = { id: string; name: string }

export type OximeterAlertModalState = {
  open: boolean
  title: string
  body: string
  spo2?: number
  pulse?: number
  babyName?: string
}

type OximeterContextValue = {
  connection: OximeterConnection
  liveReading: OximeterLiveReading | null
  sessionStats: OximeterSessionStats
  chartReadings: OximeterLiveReading[]
  discoveredDevices: DiscoveredBleDevice[]
  babies: BabyOption[]
  babiesLoading: boolean
  connectModalOpen: boolean
  connectingDeviceId: string | null
  successCountdown: number | null
  activeAlarms: string[]
  rawPacketCount: number
  lastRawPacket: RawNusPacket | null
  vitalsDecodeReady: boolean
  alertModal: OximeterAlertModalState | null
  closeAlertModal: () => void
  openConnectModal: () => void
  closeConnectModal: () => void
  searchDevices: () => Promise<void>
  connectToDevice: (device: DiscoveredBleDevice) => Promise<void>
  disconnect: () => Promise<void>
  setSelectedBabyId: (babyId: string) => void
  isSupported: boolean
}

const defaultConnection: OximeterConnection = {
  status: 'idle',
  deviceId: null,
  deviceRowId: null,
  deviceName: null,
  babyId: null,
  babyName: null,
  sessionId: null,
}

const OximeterContext = createContext<OximeterContextValue | null>(null)
const AUTO_RECONNECT_STORAGE_PREFIX = 'mamta:oximeter:auto-reconnect'

type PersistedOximeterConnection = {
  deviceId: string
  deviceName: string | null
  babyId: string
  babyName: string | null
}

function getBluetoothApi(): Bluetooth {
  if (!navigator.bluetooth) throw new Error('Web Bluetooth not available')
  return navigator.bluetooth
}

function autoReconnectStorageKey(userId: string): string {
  return `${AUTO_RECONNECT_STORAGE_PREFIX}:${userId}`
}

function readPersistedOximeterConnection(userId: string): PersistedOximeterConnection | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(autoReconnectStorageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedOximeterConnection>
    if (!parsed.deviceId || !parsed.babyId) return null
    return {
      deviceId: parsed.deviceId,
      deviceName: parsed.deviceName ?? null,
      babyId: parsed.babyId,
      babyName: parsed.babyName ?? null,
    }
  } catch {
    return null
  }
}

function persistOximeterConnection(userId: string, data: PersistedOximeterConnection): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(autoReconnectStorageKey(userId), JSON.stringify(data))
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

function clearPersistedOximeterConnection(userId: string | undefined): void {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(autoReconnectStorageKey(userId))
  } catch {
    // ignore
  }
}

export function OximeterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [connection, setConnection] = useState<OximeterConnection>(defaultConnection)
  const [liveReading, setLiveReading] = useState<OximeterLiveReading | null>(null)
  const [chartReadings, setChartReadings] = useState<OximeterLiveReading[]>([])
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredBleDevice[]>([])
  const [babies, setBabies] = useState<BabyOption[]>([])
  const [babiesLoading, setBabiesLoading] = useState(false)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null)
  const [successCountdown, setSuccessCountdown] = useState<number | null>(null)
  const [activeAlarms, setActiveAlarms] = useState<string[]>([])
  const [rawPacketCount, setRawPacketCount] = useState(0)
  const [lastRawPacket, setLastRawPacket] = useState<RawNusPacket | null>(null)
  const [alertModal, setAlertModal] = useState<OximeterAlertModalState | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [babyOximeterAlerts, setBabyOximeterAlerts] = useState<BabyOximeterAlerts>(
    DEFAULT_BABY_OXIMETER_ALERTS,
  )

  const bleDeviceRef = useRef<BluetoothDevice | null>(null)
  /** Device handle from the browser picker — reuse instead of opening a second dialog. */
  const pickedBleDeviceRef = useRef<BluetoothDevice | null>(null)
  const notifyCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const lastSaveRef = useRef<number>(0)
  const pendingReadingRef = useRef<{
    measuredAt: string
    raw: RawNusPacket
    vitals: VerifiedOximeterVitals | null
  } | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<number | null>(null)
  /** Prevents auto-reconnect when the user (or cancel) intentionally disconnects. */
  const intentionalDisconnectRef = useRef(false)
  const gattDisconnectHandlerRef = useRef<(() => void) | null>(null)
  const autoReconnectAttemptedForUserRef = useRef<string | null>(null)
  const sessionStartedAtRef = useRef<string | null>(null)
  const connectionRef = useRef(connection)
  connectionRef.current = connection
  const babyAlertsRef = useRef(babyOximeterAlerts)
  babyAlertsRef.current = babyOximeterAlerts
  const breachTrackerRef = useRef(new SustainedBreachTracker())

  const vitalsDecodeReady = OXIMETER_VITALS_DECODE_ENABLED

  type ParsedPacket = VerifiedOximeterVitals & { isValid: boolean }

  const sessionStats = useMemo(
    () => computeSessionStats(chartReadings, sessionStartedAtRef.current),
    [chartReadings],
  )

  const notifPrefs = useMemo(
    () => parseNotificationPreferences(user?.profile?.metadata),
    [user?.profile?.metadata],
  )
  const notifPrefsRef = useRef(notifPrefs)
  notifPrefsRef.current = notifPrefs

  const dispatchBabyOximeterAlert = useCallback(
    async (breaches: OximeterBreachKind[], spo2: number, pulse: number) => {
      const conn = connectionRef.current
      if (!conn.babyId) return

      const prefs = notifPrefsRef.current
      const filtered = breaches.filter(b => {
        if (breachUsesSpo2Pref(b)) return prefs.oximeterSpo2
        return prefs.oximeterPulse
      })
      if (filtered.length === 0) return

      const alerts = babyAlertsRef.current
      const babyName = conn.babyName ?? 'Baby'
      const { title, body } = buildOximeterAlertCopy({
        babyName,
        breaches: filtered,
        spo2,
        pulse,
        alerts,
      })

      if (prefs.inAppSound) {
        markOximeterAlertSoundPlayed()
        playNotificationBeep()
      }

      setAlertModal({ open: true, title, body, spo2, pulse, babyName })

      try {
        await dashboardFetch('/api/oximeter/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            babyId: conn.babyId,
            babyName,
            spo2,
            pulse,
            breaches: filtered,
            title,
            body,
          }),
        })
        window.dispatchEvent(new CustomEvent('mamta:oximeter-alert-created'))
      } catch {
        // ignore transient failures; modal and sound already shown locally
      }
    },
    [],
  )

  useEffect(() => {
    setIsSupported(isWebBluetoothSupported())
  }, [])

  const loadBabyOximeterAlerts = useCallback(async (babyId: string) => {
    try {
      const res = await dashboardFetch(`/api/babies/${babyId}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return
      const parsed =
        data.oximeterAlerts ?? parseBabyOximeterAlerts((data.baby as { metadata?: unknown })?.metadata)
      setBabyOximeterAlerts(parsed)
    } catch {
      // keep previous thresholds
    }
  }, [])

  useEffect(() => {
    const babyId = connection.babyId
    breachTrackerRef.current.reset()
    if (!babyId) {
      setBabyOximeterAlerts(DEFAULT_BABY_OXIMETER_ALERTS)
      return
    }
    void loadBabyOximeterAlerts(babyId)
  }, [connection.babyId, loadBabyOximeterAlerts])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ babyId?: string; alerts?: BabyOximeterAlerts }>).detail
      if (!detail?.babyId || detail.babyId !== connectionRef.current.babyId || !detail.alerts) return
      setBabyOximeterAlerts(detail.alerts)
      breachTrackerRef.current.reset()
    }
    window.addEventListener('mamta:baby-oximeter-alerts-updated', handler)
    return () => window.removeEventListener('mamta:baby-oximeter-alerts-updated', handler)
  }, [])

  const loadBabies = useCallback(async () => {
    setBabiesLoading(true)
    try {
      const res = await dashboardFetch('/api/babies', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      const list = Array.isArray(data?.babies)
        ? data.babies.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name }))
        : []
      setBabies(list)
      if (list.length === 1 && !connectionRef.current.babyId) {
        setConnection(c => ({ ...c, babyId: list[0].id, babyName: list[0].name }))
      }
    } finally {
      setBabiesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    void loadBabies()
  }, [loadBabies, user?.id])

  const patchConnection = useCallback((patch: Partial<OximeterConnection>) => {
    setConnection(prev => ({ ...prev, ...patch }))
  }, [])

  const setStatus = useCallback(
    (status: OximeterConnectionStatus, extra?: Partial<OximeterConnection>) => {
      patchConnection({ status, ...extra })
    },
    [patchConnection],
  )

  const flushReadingSave = useCallback(async () => {
    const conn = connectionRef.current
    const pending = pendingReadingRef.current
    if (!pending || !conn.babyId || !conn.sessionId || !conn.deviceId) return
    if (Date.now() - lastSaveRef.current < OXIMETER_SAVE_INTERVAL_MS - 200) return

    lastSaveRef.current = Date.now()
    pendingReadingRef.current = null

    const vitals = pending.vitals
    const decodePending = !vitals

    try {
      await dashboardFetch('/api/oximeter/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId: conn.babyId,
          sessionId: conn.sessionId,
          deviceId: conn.deviceId,
          deviceRowId: conn.deviceRowId,
          spo2: vitals?.spo2 ?? 0,
          pulseRate: vitals?.pulseRate ?? 0,
          perfusionIndex: vitals?.perfusionIndex,
          signalQuality: vitals?.signalQuality,
          isValid: Boolean(vitals),
          measuredAt: pending.measuredAt,
          decodePending,
          rawPayload: {
            hex: pending.raw.hex,
            bytes: pending.raw.bytes,
            length: pending.raw.length,
            hasAa55Header: pending.raw.hasAa55Header,
          },
        }),
      })
    } catch {
      // ignore transient save failures
    }
  }, [])

  const handleNusNotification = useCallback(
    (raw: RawNusPacket) => {
      setRawPacketCount(c => c + 1)
      setLastRawPacket(raw)

      const measuredAt = raw.receivedAt
      const decoded = decodeVerifiedVitals(raw.bytes)

      if (!decoded) {
        pendingReadingRef.current = { measuredAt, raw, vitals: null }

        setLiveReading(prev => {
          if (prev && !prev.decodePending && (prev.spo2 != null || prev.pulseRate != null)) {
            return prev
          }
          return toLiveReading(0, 0, { measuredAt, decodePending: true })
        })

        if (Date.now() - lastSaveRef.current >= OXIMETER_SAVE_INTERVAL_MS) {
          void flushReadingSave()
        } else if (saveTimerRef.current == null) {
          saveTimerRef.current = window.setTimeout(() => {
            saveTimerRef.current = null
            void flushReadingSave()
          }, OXIMETER_SAVE_INTERVAL_MS)
        }
        return
      }

      let reading: OximeterLiveReading
      {
        const packet: ParsedPacket = {
          ...decoded,
          isValid: decoded.spo2 >= 50 && decoded.spo2 <= 100 && decoded.pulseRate >= 30,
        }
        reading = toLiveReading(decoded.spo2, decoded.pulseRate, {
          perfusionIndex: decoded.perfusionIndex,
          signalQuality: decoded.signalQuality,
          isValid: packet.isValid,
          measuredAt,
        })

        const alarms = detectAlarms(
          decoded.spo2,
          decoded.pulseRate,
          decoded.signalQuality ?? null,
          packet.isValid,
        )
        const babyBreaches = evaluateBabyOximeterBreaches(
          decoded.spo2,
          decoded.pulseRate,
          babyAlertsRef.current,
        )
        const displayAlarms: string[] = [...alarms]
        if (babyBreaches.includes('spo2_low')) displayAlarms.push('low_spo2')
        if (babyBreaches.includes('spo2_high')) displayAlarms.push('high_spo2')
        if (babyBreaches.includes('pulse_low')) displayAlarms.push('low_pulse')
        if (babyBreaches.includes('pulse_high')) displayAlarms.push('high_pulse')
        setActiveAlarms(displayAlarms)

        if (packet.isValid) {
          const confirmed = breachTrackerRef.current.update(babyBreaches) as OximeterBreachKind[]
          if (confirmed.length > 0) {
            void dispatchBabyOximeterAlert(confirmed, decoded.spo2, decoded.pulseRate)
          }
        }

        setChartReadings(prev => {
          const next = [...prev, reading]
          return next.length > OXIMETER_CHART_MAX_POINTS ? next.slice(-OXIMETER_CHART_MAX_POINTS) : next
        })

        pendingReadingRef.current = { measuredAt, raw, vitals: decoded }
      }

      setLiveReading(reading)
      patchConnection({ lastReadingAt: measuredAt })

      const shouldSaveImmediately =
        decoded != null ||
        Date.now() - lastSaveRef.current >= OXIMETER_SAVE_INTERVAL_MS

      if (shouldSaveImmediately) {
        void flushReadingSave()
      } else if (saveTimerRef.current == null) {
        saveTimerRef.current = window.setTimeout(() => {
          saveTimerRef.current = null
          void flushReadingSave()
        }, OXIMETER_SAVE_INTERVAL_MS)
      }
    },
    [dispatchBabyOximeterAlert, flushReadingSave, patchConnection],
  )

  const attachNusTxListener = useCallback(
    async (server: BluetoothRemoteGATTServer) => {
      let service: BluetoothRemoteGATTService
      try {
        service = await server.getPrimaryService(webBluetoothUuid(OXIMETER_SERVICE_UUID))
      } catch {
        throw new Error(
          'Oximeter Bluetooth service not found. Ensure the device is a supported Nordic UART oximeter and is actively measuring.',
        )
      }

      const txChar = await service.getCharacteristic(webBluetoothUuid(OXIMETER_TX_UUID))

      if (!txChar.properties.notify && !txChar.properties.indicate) {
        throw new Error('Oximeter TX characteristic does not support notifications.')
      }

      // RX (6E400002-…) is write-only — never send commands until protocol is verified.
      await txChar.startNotifications()
      txChar.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic
        const value = target.value
        if (!value) return
        const raw = parseNusNotification(value)
        if (raw) handleNusNotification(raw)
      })
      notifyCharRef.current = txChar
    },
    [handleNusNotification],
  )

  const endSession = useCallback(async (reason?: string) => {
    const sessionId = connectionRef.current.sessionId
    if (!sessionId) return
    try {
      await dashboardFetch(`/api/oximeter/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', endReason: reason ?? 'user_disconnect' }),
      })
    } catch {
      // ignore
    }
  }, [])

  const cleanupBle = useCallback(async () => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    try {
      if (notifyCharRef.current) {
        await notifyCharRef.current.stopNotifications().catch(() => {})
      }
    } catch {
      // ignore
    }
    notifyCharRef.current = null
    const device = bleDeviceRef.current
    if (device && gattDisconnectHandlerRef.current) {
      device.removeEventListener('gattserverdisconnected', gattDisconnectHandlerRef.current)
      gattDisconnectHandlerRef.current = null
    }
    if (device?.gatt?.connected) {
      device.gatt.disconnect()
    }
    bleDeviceRef.current = null
  }, [])

  const registerDeviceAndSession = useCallback(
    async (device: BluetoothDevice, babyId: string, babyName: string) => {
      const deviceId = device.id
      const deviceName = deviceDisplayName(device.name, deviceId)

      const regRes = await dashboardFetch('/api/oximeter/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          deviceName,
          babyId,
          isTrusted: isLikelyOximeterName(device.name),
        }),
      })
      const regData = await regRes.json().catch(() => ({}))
      if (!regRes.ok) throw new Error(regData?.error || 'Failed to register device')

      const deviceRow = regData.device as { id: string }

      const sessRes = await dashboardFetch('/api/oximeter/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ babyId, deviceId: deviceRow.id }),
      })
      const sessData = await sessRes.json().catch(() => ({}))
      if (!sessRes.ok) throw new Error(sessData?.error || 'Failed to start session')

      const session = sessData.session as { id: string; started_at?: string }
      sessionStartedAtRef.current = session.started_at ?? new Date().toISOString()
      lastSaveRef.current = 0
      setChartReadings([])
      setLiveReading(null)

      patchConnection({
        status: 'connected',
        deviceId,
        deviceRowId: deviceRow.id,
        deviceName,
        babyId,
        babyName,
        sessionId: session.id,
        error: null,
      })

      if (user?.id) {
        persistOximeterConnection(user.id, {
          deviceId,
          deviceName,
          babyId,
          babyName,
        })
      }
    },
    [patchConnection, user?.id],
  )

  const connectBleDevice = useCallback(
    async (device: BluetoothDevice, babyId: string, babyName: string) => {
      intentionalDisconnectRef.current = false
      reconnectAttemptRef.current = 0

      if (gattDisconnectHandlerRef.current && bleDeviceRef.current) {
        bleDeviceRef.current.removeEventListener(
          'gattserverdisconnected',
          gattDisconnectHandlerRef.current,
        )
      }

      const handleGattDisconnected = () => {
        if (intentionalDisconnectRef.current) return
        const status = connectionRef.current.status
        if (status === 'idle' || status === 'disconnected') return

        setStatus('reconnecting', { error: 'Connection lost. Reconnecting…' })
        const attempt = reconnectAttemptRef.current
        const delay =
          OXIMETER_RECONNECT_DELAYS_MS[Math.min(attempt, OXIMETER_RECONNECT_DELAYS_MS.length - 1)]
        reconnectAttemptRef.current += 1
        reconnectTimerRef.current = window.setTimeout(() => {
          void connectBleDevice(device, babyId, babyName).catch(() => {
            setStatus('error', { error: 'Unable to reconnect. Please try again.' })
          })
        }, delay)
      }

      gattDisconnectHandlerRef.current = handleGattDisconnected
      bleDeviceRef.current = device
      device.addEventListener('gattserverdisconnected', handleGattDisconnected)

      setStatus('connecting')
      const server = await connectGattServer(device)
      if (!server) throw new Error('Could not connect to device GATT server')
      await attachNusTxListener(server)
      reconnectAttemptRef.current = 0
      await registerDeviceAndSession(device, babyId, babyName)
    },
    [attachNusTxListener, registerDeviceAndSession, setStatus],
  )

  const resolveBabyForConnect = useCallback(() => {
    const babyId = connectionRef.current.babyId ?? babies[0]?.id
    const babyName =
      connectionRef.current.babyName ??
      babies.find(b => b.id === babyId)?.name ??
      'Baby'
    return { babyId, babyName }
  }, [babies])

  const completeBleConnection = useCallback(
    async (device: BluetoothDevice, babyId: string, babyName: string) => {
      setConnectingDeviceId(device.id)
      try {
        await connectBleDevice(device, babyId, babyName)
        pickedBleDeviceRef.current = null
        setSuccessCountdown(3)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection failed'
        setStatus('error', { error: message })
        throw err
      } finally {
        setConnectingDeviceId(null)
      }
    },
    [connectBleDevice, setStatus],
  )

  const searchDevices = useCallback(async () => {
    if (!isSupported) {
      setStatus('unsupported', { error: 'Web Bluetooth is not supported in this browser.' })
      return
    }

    pickedBleDeviceRef.current = null
    setDiscoveredDevices([])
    setStatus('searching', { error: null })

    try {
      const device = await getBluetoothApi().requestDevice({
        acceptAllDevices: true,
        optionalServices: webBluetoothOptionalServices(OXIMETER_BLE_OPTIONAL_SERVICES),
      })

      pickedBleDeviceRef.current = device

      const discovered: DiscoveredBleDevice = {
        id: device.id,
        name: deviceDisplayName(device.name, device.id),
        model: device.name ?? null,
        isRecognized: true,
      }
      setDiscoveredDevices([discovered])

      const { babyId, babyName } = resolveBabyForConnect()
      if (!babyId) {
        setStatus('device_found', {
          error: 'Add a baby profile before connecting an oximeter.',
        })
        return
      }

      if (babies.length > 1 && !connectionRef.current.babyId) {
        setStatus('device_found')
        return
      }

      await completeBleConnection(device, babyId, babyName)
    } catch (err) {
      pickedBleDeviceRef.current = null
      const message = err instanceof Error ? err.message : 'Bluetooth search cancelled'
      const lower = message.toLowerCase()

      if (lower.includes('user cancelled') || lower.includes('user canceled')) {
        setStatus('idle', { error: null })
        return
      }
      if (lower.includes('user gesture') || lower.includes('must be handling')) {
        setStatus('idle', {
          error: 'Click "Search for Oximeter" to open the Bluetooth picker (your browser requires a button click).',
        })
        return
      }
      if (lower.includes('permission') || lower.includes('denied') || lower.includes('not allowed')) {
        setStatus('permission_required', {
          error:
            'Bluetooth access was blocked. Allow Bluetooth for this site in your browser settings, then click Search for Oximeter again.',
        })
        return
      }
      setStatus('error', { error: message })
    }
  }, [babies.length, completeBleConnection, isSupported, resolveBabyForConnect, setStatus])

  const connectToDevice = useCallback(
    async (device: DiscoveredBleDevice) => {
      const { babyId, babyName } = resolveBabyForConnect()

      if (!babyId) {
        setStatus('error', { error: 'Please add a baby profile before connecting an oximeter.' })
        return
      }

      if (babies.length > 1 && !connectionRef.current.babyId) {
        setStatus('error', { error: 'Select which baby is using the oximeter first.' })
        return
      }

      const picked = pickedBleDeviceRef.current
      if (!picked || picked.id !== device.id) {
        setStatus('error', {
          error: 'Device session expired. Click Search Again and select your oximeter in the browser dialog.',
        })
        return
      }

      try {
        await completeBleConnection(picked, babyId, babyName)
      } catch {
        // completeBleConnection already sets error status
      }
    },
    [babies.length, completeBleConnection, resolveBabyForConnect, setStatus],
  )

  useEffect(() => {
    autoReconnectAttemptedForUserRef.current = null
  }, [user?.id])

  useEffect(() => {
    const userId = user?.id
    if (!userId || !isSupported || pathname !== '/dashboard/oximeter') return
    if (autoReconnectAttemptedForUserRef.current === userId) return
    if (connectionRef.current.status !== 'idle') return

    const saved = readPersistedOximeterConnection(userId)
    autoReconnectAttemptedForUserRef.current = userId
    if (!saved) return

    const bluetooth = navigator.bluetooth
    if (!bluetooth?.getDevices) return
    const getDevices = bluetooth.getDevices.bind(bluetooth)

    let cancelled = false

    const reconnectLastDevice = async () => {
      setStatus('reconnecting', {
        deviceId: saved.deviceId,
        deviceName: saved.deviceName,
        babyId: saved.babyId,
        babyName: saved.babyName,
        error: 'Reconnecting to last oximeter...',
      })

      try {
        const devices = await getDevices()
        if (cancelled) return

        const device = devices.find(item => item.id === saved.deviceId)
        if (!device) {
          clearPersistedOximeterConnection(userId)
          patchConnection({
            status: 'idle',
            deviceId: null,
            deviceName: null,
            babyId: null,
            babyName: null,
            sessionId: null,
            error: null,
          })
          return
        }

        await connectBleDevice(device, saved.babyId, saved.babyName ?? 'Baby')
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Unable to reconnect automatically.'
        patchConnection({
          status: 'error',
          error: `Auto reconnect failed. Click Connect Oximeter to reconnect manually. ${message}`,
        })
      }
    }

    void reconnectLastDevice()

    return () => {
      cancelled = true
    }
  }, [connectBleDevice, isSupported, patchConnection, pathname, setStatus, user?.id])

  const cancelConnect = useCallback(async () => {
    intentionalDisconnectRef.current = true
    pickedBleDeviceRef.current = null
    setConnectingDeviceId(null)
    setDiscoveredDevices([])
    patchConnection({ status: 'idle', error: null })
    await cleanupBle()
    intentionalDisconnectRef.current = false
  }, [cleanupBle, patchConnection])

  const disconnect = useCallback(async () => {
    const deviceRowId = connectionRef.current.deviceRowId
    intentionalDisconnectRef.current = true
    clearPersistedOximeterConnection(user?.id)
    reconnectAttemptRef.current = 0
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    patchConnection({ status: 'disconnected', error: null })

    await flushReadingSave()
    await endSession('user_disconnect')
    await cleanupBle()

    if (deviceRowId) {
      try {
        await dashboardFetch(`/api/oximeter/devices/${deviceRowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionStatus: 'disconnected' }),
        })
      } catch {
        // ignore
      }
    }
    sessionStartedAtRef.current = null
    setLiveReading(null)
    setChartReadings([])
    setActiveAlarms([])
    setRawPacketCount(0)
    setLastRawPacket(null)
    setAlertModal(null)
    breachTrackerRef.current.reset()
    setConnection(defaultConnection)
    intentionalDisconnectRef.current = false
  }, [cleanupBle, endSession, flushReadingSave, patchConnection, user?.id])

  useEffect(() => {
    if (successCountdown == null) return
    if (successCountdown <= 0) {
      setSuccessCountdown(null)
      setConnectModalOpen(false)
      return
    }
    const t = window.setTimeout(() => setSuccessCountdown(c => (c != null ? c - 1 : null)), 1000)
    return () => window.clearTimeout(t)
  }, [successCountdown])

  useEffect(() => {
    const babyId = connection.babyId
    if (!babyId || connection.status !== 'connected') return

    const channel = supabase
      .channel(`oximeter-${babyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'oximeter_readings',
          filter: `baby_id=eq.${babyId}`,
        },
        payload => {
          const row = payload.new as Record<string, unknown>
          const metadata = row.metadata as Record<string, unknown> | null
          if (metadata?.decode_pending) return
          const spo2 = Number(row.spo2_percentage)
          const pulse = Number(row.pulse_rate_bpm)
          if (!Number.isFinite(spo2) || !Number.isFinite(pulse)) return
          if (spo2 === 0 && pulse === 0) return
          const measuredAt = String(row.measured_at ?? new Date().toISOString())
          const reading = toLiveReading(spo2, pulse, {
            measuredAt,
            isValid: row.is_valid !== false,
          })
          setLiveReading(prev => {
            if (prev && new Date(prev.measuredAt).getTime() >= new Date(measuredAt).getTime()) {
              return prev
            }
            return reading
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [connection.babyId, connection.status])

  useEffect(() => {
    if (connection.status !== 'connected' || !liveReading?.measuredAt) return
    const tick = window.setInterval(() => {
      const age = Date.now() - new Date(liveReading.measuredAt).getTime()
      if (age > OXIMETER_STALE_AFTER_MS) {
        setLiveReading(r => (r ? { ...r, isStale: true } : r))
      }
    }, 2000)
    return () => window.clearInterval(tick)
  }, [connection.status, liveReading?.measuredAt])

  useEffect(() => {
    return () => {
      void cleanupBle()
    }
  }, [cleanupBle])

  const value: OximeterContextValue = {
    connection,
    liveReading,
    sessionStats,
    chartReadings,
    discoveredDevices,
    babies,
    babiesLoading,
    connectModalOpen,
    connectingDeviceId,
    successCountdown,
    activeAlarms,
    rawPacketCount,
    lastRawPacket,
    vitalsDecodeReady,
    alertModal,
    closeAlertModal: () => setAlertModal(null),
    openConnectModal: () => {
      pickedBleDeviceRef.current = null
      setDiscoveredDevices([])
      setConnectModalOpen(true)
      if (connection.status !== 'connected' && connection.status !== 'connecting') {
        setStatus('idle', { error: null })
      }
      if (babies.length === 1) {
        patchConnection({ babyId: babies[0].id, babyName: babies[0].name })
      }
    },
    closeConnectModal: () => {
      if (connection.status === 'connecting' || connection.status === 'pairing') {
        void cancelConnect()
      } else if (connection.status !== 'connected') {
        pickedBleDeviceRef.current = null
        setStatus('idle')
      }
      setConnectModalOpen(false)
    },
    searchDevices,
    connectToDevice,
    disconnect,
    setSelectedBabyId: (babyId: string) => {
      const baby = babies.find(b => b.id === babyId)
      patchConnection({ babyId, babyName: baby?.name ?? null })
    },
    isSupported,
  }

  return <OximeterContext.Provider value={value}>{children}</OximeterContext.Provider>
}

export function useOximeter() {
  const ctx = useContext(OximeterContext)
  if (!ctx) throw new Error('useOximeter must be used within OximeterProvider')
  return ctx
}

export function useOximeterOptional() {
  return useContext(OximeterContext)
}
