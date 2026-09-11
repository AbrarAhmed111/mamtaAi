import { OXIMETER_ALERT_COOLDOWN_MS, OXIMETER_ALERT_SUSTAINED_MS } from './baby-thresholds'

/** Tracks how long each breach key has been active; confirms after sustained duration. */
export class SustainedBreachTracker {
  private activeSince = new Map<string, number>()
  private lastFiredAt = new Map<string, number>()

  constructor(
    private sustainedMs = OXIMETER_ALERT_SUSTAINED_MS,
    private cooldownMs = OXIMETER_ALERT_COOLDOWN_MS,
  ) {}

  update(activeKeys: string[], now = Date.now()): string[] {
    const confirmed: string[] = []
    const activeSet = new Set(activeKeys)

    for (const key of activeKeys) {
      if (!this.activeSince.has(key)) {
        this.activeSince.set(key, now)
      }
      const since = this.activeSince.get(key)!
      const lastFired = this.lastFiredAt.get(key) ?? 0
      if (now - since >= this.sustainedMs && now - lastFired >= this.cooldownMs) {
        confirmed.push(key)
        this.lastFiredAt.set(key, now)
      }
    }

    for (const key of [...this.activeSince.keys()]) {
      if (!activeSet.has(key)) {
        this.activeSince.delete(key)
      }
    }

    return confirmed
  }

  reset() {
    this.activeSince.clear()
    this.lastFiredAt.clear()
  }
}
