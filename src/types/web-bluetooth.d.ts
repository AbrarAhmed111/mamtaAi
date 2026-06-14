/** Minimal Web Bluetooth typings for client oximeter integration. */
interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name?: string
  readonly gatt?: BluetoothRemoteGATTServer
  addEventListener(
    type: 'gattserverdisconnected',
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean
  readonly device: BluetoothDevice
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>
}

interface BluetoothRemoteGATTService {
  readonly uuid: string
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly uuid: string
  readonly properties: BluetoothCharacteristicProperties
  readonly value?: DataView | null
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  writeValue(_data: BufferSource): Promise<void>
  writeValueWithoutResponse(_data: BufferSource): Promise<void>
  addEventListener(
    type: 'characteristicvaluechanged',
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void
}

interface BluetoothCharacteristicProperties {
  readonly notify: boolean
  readonly indicate: boolean
  readonly write: boolean
  readonly writeWithoutResponse: boolean
}

interface RequestDeviceOptions {
  filters?: Array<{ namePrefix?: string; services?: string[] }>
  optionalServices?: string[]
  acceptAllDevices?: boolean
}

interface Bluetooth {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
  getDevices?: () => Promise<BluetoothDevice[]>
}

interface Navigator {
  bluetooth?: Bluetooth
}
