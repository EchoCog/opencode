import { InputRenderable, TextAttributes, fg, bold, BoxRenderable } from "@opentui/core"
import { createEffect, createMemo, createResource, For, Match, Switch } from "solid-js"
import { useLocal } from "../context/local"
import { Theme } from "../context/theme"
import { useDialog } from "../ui/dialog"
import { SplitBorder } from "./border"
import { useSDK } from "../context/sdk"
import { useRoute } from "../context/route"
import { useSync } from "../context/sync"
import { Identifier } from "../../../../id/id"
import { createStore } from "solid-js/store"
import { DialogCommand } from "./dialog-command"
import { DialogTag } from "./dialog-tag"


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

  const [files] = createResource(() => [filter()], async () => {
    if (!store.autocomplete.visible) return []
    const result = await sdk.find.files({
      query: {
        query: filter(),
      },
    })
    if (result.error) return []
    const sliced = (result.data ?? []).slice(0, 5)
    return sliced
  })

  createEffect(() => {
    if (dialog.stack.length === 0 && input)
      input.focus()
    if (dialog.stack.length > 0)
      input.blur()
  })

  return (
    <>
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
                  store.autocomplete.visible && value.length <= store.autocomplete.index
                )
                  setStore("autocomplete", "visible", false)
              }}
              value={store.input}
              onKeyDown={e => {
                if (e.name === "@" && (store.input.at(-1) === " " || store.input.at(-1) === undefined)) {
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
                    model: local.model.current(),
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
      <box
        visible={store.autocomplete.visible}
        position="absolute"
        top={store.autocomplete.position.y - 5}
        left={store.autocomplete.position.x}
        width={store.autocomplete.position.width}
        zIndex={100}
        {...SplitBorder}
      >
        <box
          backgroundColor={Theme.backgroundElement}
          paddingLeft={1}
          paddingRight={1}
          height={5}
        >
          <For each={files() ?? []}>
            {(file) =>
              <box>
                <text>{file}</text>
              </box>
            }

          </For>
        </box>
      </box>
    </>
  )
}

