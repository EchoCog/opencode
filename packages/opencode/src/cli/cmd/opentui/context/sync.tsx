import type { Agent, Provider, Session } from "@opencode-ai/sdk"
import { createStore } from "solid-js/store"
import { useSDK } from "./sdk"
import { createContext, onMount, Show, useContext, type ParentProps } from "solid-js"
import type { Message } from "vscode-jsonrpc"


function init() {
  const [store, setStore] = createStore<{
    ready: boolean
    provider: Provider[]
    agent: Agent[]
    session: Record<string, {
      info: Session
      message: Record<string, {
        info: Message
        part: Record<string, Message>
      }>
    }>
  }>({
    ready: false,
    agent: [],
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

  Promise.all([
    sdk.config.providers().then((x) => setStore("provider", x.data!.providers)),
    sdk.app.agents().then((x) => setStore("agent", x.data ?? [])),
  ]).then(() => setStore("ready", true))

  return {
    data: store,
    set: setStore,
  }
}

type SyncContext = ReturnType<typeof init>

const ctx = createContext<SyncContext>()

export function SyncProvider(props: ParentProps) {
  const value = init()
  return (
    <Show when={value.data.ready}>
      <ctx.Provider value={value}>{props.children}</ctx.Provider>
    </Show>
  )
}

export function useSync() {
  const value = useContext(ctx)
  if (!value) {
    throw new Error("useSync must be used within a SyncProvider")
  }
  return value
}
