type ProgressSnapshot = { raw: string; temporary: boolean }

/** A tab keeps its last known progress if storage stops accepting reads or writes. */
export function createBrowserProgressStore(key: string, changeEvent: string) {
  const serverSnapshot: ProgressSnapshot = { raw: '', temporary: false }
  let snapshot = serverSnapshot
  let unsaved = false

  function updateSnapshot(raw: string, temporary: boolean) {
    if (snapshot.raw !== raw || snapshot.temporary !== temporary) {
      snapshot = { raw, temporary }
    }
    return snapshot
  }

  function getSnapshot() {
    // Unsaved work belongs to this tab until a later save succeeds. Reading an
    // older stored value (or another tab's value) must not silently discard it.
    if (unsaved) return snapshot
    try {
      return updateSnapshot(localStorage.getItem(key) ?? '', false)
    } catch {
      // A failed read alone is not an unsaved edit. Retry on the next read so
      // transient access problems cannot hide existing durable progress.
      return updateSnapshot(snapshot.raw, true)
    }
  }

  function subscribe(onChange: () => void) {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key && event.key !== null) return
      try {
        // sessionStorage events from same-origin frames are unrelated.
        if (event.storageArea !== window.localStorage) return
      } catch {
        return
      }
      if (!unsaved) onChange()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(changeEvent, onChange)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(changeEvent, onChange)
    }
  }

  function save(update: (raw: string) => string) {
    const raw = update(getSnapshot().raw)
    try {
      localStorage.setItem(key, raw)
      unsaved = false
      updateSnapshot(raw, false)
    } catch {
      unsaved = true
      updateSnapshot(raw, true)
    }
    window.dispatchEvent(new Event(changeEvent))
  }

  return { getSnapshot, getServerSnapshot: () => serverSnapshot, subscribe, save }
}
