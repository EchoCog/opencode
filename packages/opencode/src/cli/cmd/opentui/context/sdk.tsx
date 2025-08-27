import { createContext, useContext, type ParentProps } from "solid-js"
import { createOpencodeClient } from "@opencode-ai/sdk"
import { Server } from "../../../../server/server"


function init() {
  const server = Server.listen({
    port: 0,
    hostname: "127.0.0.1",
  })
  const client = createOpencodeClient({
    baseUrl: server.url.toString(),
  })
  return client
}

type SDKContext = ReturnType<typeof init>

const ctx = createContext<SDKContext>()

export function SDKProvider(props: ParentProps) {
  const value = init()
  return <ctx.Provider value={value}>{props.children}</ctx.Provider>
}

export function useSDK() {
  const value = useContext(ctx)
  if (!value) {
    throw new Error("useSDK must be used within a SDKProvider")
  }
  return value
}
