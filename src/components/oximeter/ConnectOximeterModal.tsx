'use client'

import { FaBluetooth, FaCheck, FaHeart, FaTimes, FaWifi } from 'react-icons/fa'
import Spinner from '@/components/ui/spinner'
import { useOximeter } from '@/contexts/OximeterContext'
import type { DiscoveredBleDevice } from '@/lib/oximeter/types'

function signalLabel(rssi?: number | null) {
  if (rssi == null) return 'Nearby'
  if (rssi >= -60) return 'Strong signal'
  if (rssi >= -75) return 'Good signal'
  return 'Weak signal'
}

export default function ConnectOximeterModal() {
  const {
    connectModalOpen,
    closeConnectModal,
    connection,
    discoveredDevices,
    babies,
    babiesLoading,
    connectingDeviceId,
    successCountdown,
    searchDevices,
    connectToDevice,
    setSelectedBabyId,
    isSupported,
  } = useOximeter()

  if (!connectModalOpen) return null

  const { status, error, deviceName, babyName } = connection
  const showBabyPicker = babies.length > 1 && status !== 'connected'
  const needsBabyPick = babies.length > 1 && !connection.babyId
  const isBusy = status === 'searching' || status === 'connecting' || status === 'pairing'
  const searchDisabled =
    !isSupported || babiesLoading || babies.length === 0 || needsBabyPick || isBusy
  const showReadyPrompt =
    !isBusy &&
    status !== 'device_found' &&
    (status === 'idle' ||
      status === 'error' ||
      status === 'permission_required' ||
      status === 'unsupported')

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-pink-100 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={closeConnectModal}
          disabled={isBusy}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
            <FaHeart />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Connect Oximeter</h2>
            <p className="text-sm text-gray-500">Bluetooth pulse oximeter pairing</p>
          </div>
        </div>

        {!isSupported && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Web Bluetooth is not available in this browser. Use Chrome or Edge on desktop/Android.
          </div>
        )}

        {showBabyPicker && (
          <div className="mt-5">
            <p className="text-sm font-medium text-gray-800">Who is using the oximeter?</p>
            <div className="mt-2 grid gap-2">
              {babies.map(baby => (
                <button
                  key={baby.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => setSelectedBabyId(baby.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition disabled:opacity-60 ${
                    connection.babyId === baby.id
                      ? 'border-pink-400 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-200'
                  }`}
                >
                  {baby.name}
                </button>
              ))}
            </div>
            {needsBabyPick && (
              <p className="mt-2 text-xs text-amber-700">Select a baby, then click Search for Oximeter.</p>
            )}
          </div>
        )}

        {status === 'connected' && successCountdown != null && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FaCheck className="text-2xl" />
            </span>
            <p className="mt-3 text-lg font-bold text-emerald-900">Oximeter Connected</p>
            <p className="mt-1 text-sm text-emerald-800">
              {deviceName} is now connected to {babyName}.
            </p>
            <p className="mt-2 text-xs text-emerald-700">
              Opening live monitoring in {successCountdown}s…
            </p>
          </div>
        )}

        {status !== 'connected' && (
          <>
            {status === 'searching' && (
              <div className="mt-6 text-center">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-200/40" />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                    <FaBluetooth className="text-2xl" />
                  </span>
                </div>
                <p className="mt-4 font-medium text-gray-900">Choose your oximeter in the browser dialog…</p>
                <p className="mt-1 text-sm text-gray-500">
                  Select PC-60F (or your device) and click Pair.
                </p>
              </div>
            )}

            {showReadyPrompt && (
              <div className="mt-6 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-pink-600">
                  <FaBluetooth className="text-2xl" />
                </span>
                <p className="mt-4 font-medium text-gray-900">Ready to connect</p>
                <p className="mt-1 text-sm text-gray-500">
                  Turn on the oximeter, place it on a finger, then click Search for Oximeter below.
                </p>
              </div>
            )}

            {(status === 'pairing' || status === 'connecting') && (
              <div className="mt-6 flex flex-col items-center gap-3 text-center">
                <Spinner size={28} />
                <p className="font-medium text-gray-900">Connecting in MamtaAI…</p>
                <p className="text-sm text-gray-500">
                  Linking GATT service and starting live readings. This usually takes a few seconds.
                </p>
              </div>
            )}

            {status === 'device_found' && discoveredDevices.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-sm font-medium text-gray-800">Selected device</p>
                {discoveredDevices.map((device: DiscoveredBleDevice) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{device.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <FaWifi className="text-pink-400" />
                        {signalLabel(device.rssi)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(connectingDeviceId) || needsBabyPick}
                      onClick={() => void connectToDevice(device)}
                      className="shrink-0 rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
                    >
                      {connectingDeviceId === device.id ? 'Connecting…' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void searchDevices()}
                disabled={searchDisabled}
                className="flex-1 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-pink-700 hover:to-rose-700 disabled:opacity-60"
              >
                {status === 'searching' ? 'Opening picker…' : 'Search for Oximeter'}
              </button>
              <button
                type="button"
                onClick={closeConnectModal}
                disabled={isBusy}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>

            {babies.length === 0 && !babiesLoading && (
              <p className="mt-3 text-xs text-amber-700">Add a baby profile before connecting an oximeter.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
