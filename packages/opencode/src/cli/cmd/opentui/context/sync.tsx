import type { Provider, Session } from "@opencode-ai/sdk"
import { createStore } from "solid-js/store"
import { useSDK } from "./sdk"
import { createContext, onMount, useContext, type ParentProps } from "solid-js"
import type { Message } from "vscode-jsonrpc"


function init() {
  const [store, setStore] = createStore<{
    provider: Provider[]
    session: Record<string, {
      info: Session
      message: Record<string, {
        info: Message
        part: Record<string, Message>
      }>
    }>
  }>({
    provider: [],
    session: {},
  })

  const sdk = useSDK()

  onMount(async () => {
    const events = await sdk.event.subscribe()
    for await (const event of events.stream) {
      switch (event.type) {
        case "storage.write":
          break
      }
    }
  })

  sdk.config.providers().then((x) => setStore("provider", x.data!.providers))

  return {
    data: store,
    set: setStore,
  }
}

type SyncContext = ReturnType<typeof init>

const ctx = createContext<SyncContext>()

export function SyncProvider(props: ParentProps) {
  const value = init()
  return <ctx.Provider value={value}>{props.children}</ctx.Provider>
}

export function useSync() {
  const value = useContext(ctx)
  if (!value) {
    throw new Error("useSync must be used within a SyncProvider")
  }
  return value
}
