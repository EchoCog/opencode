import { InputRenderable, TextAttributes, fg, bold, BoxRenderable } from "@opentui/core"
import { createEffect, createMemo, Match, Switch } from "solid-js"
import { useLocal } from "../context/local"
import { Theme } from "../context/theme"
import { useDialog } from "../ui/dialog"
import { SplitBorder } from "./border"
import { useSDK } from "../context/sdk"
import { useRoute } from "../context/route"
import { useSync } from "../context/sync"
import { Identifier } from "../../../../id/id"
import { createStore } from "solid-js/store"


export type PromptProps = {
  sessionID?: string
}
export function Prompt(props: PromptProps) {
  let input: InputRenderable
  let anchor: BoxRenderable


  const dialog = useDialog()
  const local = useLocal()
  const sdk = useSDK()
  const route = useRoute()
  const sync = useSync()
  const [store, setStore] = createStore<{
    input: string
    autocomplete: {
      visible: boolean
      index: number
      position: {
        x: number
        y: number
        width: number
      }
    },
  }>({
    input: "",
    autocomplete: { index: 0, visible: false, position: { x: 0, y: 0, width: 0 } }
  })

  const filter = createMemo(() => {
    if (!store.autocomplete.visible) return ""
    return store.input.substring(store.autocomplete.index + 1)
  })

  const messages = createMemo(() => {
    if (!props.sessionID) return []
    return Object.values(sync.data.message[props.sessionID] ?? {})
  })
  const working = createMemo(() => {
    const last = messages()[messages().length - 1]
    if (!last) return false
    if (last.role === "user") return true
    return !last.time.completed
  })

  createEffect(() => {
    if (dialog.stack.length === 0 && input)
      input.focus()
    if (dialog.stack.length > 0)
      input.blur()
  })

  createEffect(() => {
    if (store.autocomplete.visible) {
      console.log(store.input.substring(store.autocomplete.index))
    }
  })


  return (
    <>
      <box
        visible={store.autocomplete.visible}
        position="absolute"
        backgroundColor={Theme.backgroundElement}
        top={store.autocomplete.position.y - 5}
        left={store.autocomplete.position.x}
        width={store.autocomplete.position.width}
        height={5}
        zIndex={100}
        {...SplitBorder}
      >
      </box>
      <box ref={r => anchor = r}>
        <box flexDirection="row" {...SplitBorder}>
          <box backgroundColor={Theme.backgroundElement} width={3} justifyContent="center" alignItems="center">
            <text attributes={TextAttributes.BOLD} fg={Theme.primary}>{">"}</text>
          </box>
          <box paddingTop={1} paddingBottom={2} backgroundColor={Theme.backgroundElement} flexGrow={1}>
            <input
              onInput={(value) => {
                setStore("input", value)

                if (
                  // backspaced past the autocomplete index, hide autocomplete
                  store.autocomplete.visible && value.length <= store.autocomplete.index ||
                  // hit space to move on 
                  filter().includes(" ")
                )
                  setStore("autocomplete", "visible", false)
              }}
              onKeyDown={e => {
                if (e.name === "@") {
                  setStore("autocomplete", {
                    visible: true,
                    index: input.value.length,
                    position: {
                      x: anchor.x,
                      y: anchor.y,
                      width: anchor.width,
                    },
                  })
                }
                if (e.name === "escape") {
                  setStore("autocomplete", "visible", false)
                }
              }}
              onSubmit={async (val) => {
                input.value = ""
                const sessionID = props.sessionID ? props.sessionID : await sdk.session.create({}).then((x) => x.data!.id)
                route.navigate({
                  type: "session",
                  sessionID,
                })
                await sdk.session.prompt({
                  path: {
                    id: sessionID,
                  },
                  body: {
                    ...local.model.current(),
                    messageID: Identifier.ascending("message"),
                    agent: local.agent.current().name,
                    parts: [
                      {
                        type: "text",
                        text: val,
                      }
                    ]
                  },
                })
              }}
              ref={r => input = r} onMouseDown={r => r.target?.focus()}
              focusedBackgroundColor={Theme.backgroundElement}
              cursorColor={Theme.primary}
              backgroundColor={Theme.backgroundElement} />
          </box>
          <box backgroundColor={Theme.backgroundElement} width={1} justifyContent="center" alignItems="center">
          </box>
        </box>
        <box paddingLeft={2} paddingRight={1} flexDirection="row" justifyContent="space-between">
          <Switch>
            <Match when={working()}>
              <text>working...</text>
            </Match>
            <Match when={true}>
              <text>enter {fg(Theme.textMuted)("send")}</text>
            </Match>

          </Switch>
          <text>{fg(Theme.textMuted)(local.model.parsed().provider)}{" "}{bold(local.model.parsed().model)}</text>
        </box >
      </box >
    </>
  )
}
