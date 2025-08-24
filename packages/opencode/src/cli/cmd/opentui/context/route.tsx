import { createStore } from "solid-js/store"
import { createContext, useContext, type ParentProps } from "solid-js"

type Route =
  | {
    type: "home"
  }
  | {
    type: "session"
    sessionID: string
  }

function init() {
  const [store, setStore] = createStore<Route>({
    type: "home",
  })

  return {
    get route() {
      return store
    },
    set navigate(route: Route) {
      setStore(route)
    },
  }
}

export type RouteContext = ReturnType<typeof init>

const ctx = createContext<RouteContext>(init())

export function RouteProvider(props: ParentProps) {
  const value = init()
  // @ts-ignore
  return <ctx.Provider value={value}>{props.children}</ctx.Provider>
}

export function useRoute() {
  const value = useContext(ctx)
  if (!value) {
    throw new Error("useRoute must be used within a RouteProvider")
  }
  return value
}
