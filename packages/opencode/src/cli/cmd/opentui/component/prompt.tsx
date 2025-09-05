import { InputRenderable, TextAttributes, fg, bold, BoxRenderable, type ParsedKey } from "@opentui/core"
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

  const [store, setStore] = createStore({
    input: "",
    autocomplete: {
      index: 0, selected: 0, visible: false, position: { x: 0, y: 0, width: 0 }
    }
  })

  const autocomplete = (function () {
    const filter = createMemo(() => {
      if (!store.autocomplete.visible) return ""
      return store.input.substring(store.autocomplete.index + 1)
    })

    const [files] = createResource(() => [filter()], async () => {
      console.log(filter())
      if (!store.autocomplete.visible) return []
      const result = await sdk.find.files({
        query: {
          query: filter(),
        },
      })
      if (result.error) return []
      const sliced = (result.data ?? []).slice(0, 5)
      return sliced
    }, {
      initialValue: []
    })

    createEffect(() => {
      filter()
      setStore("autocomplete", "selected", 0)
    })


    return {
      get selection() {
        return store.autocomplete.selected
      },
      get filter() {
        return filter()
      },
      get visible() {
        return store.autocomplete.visible
      },
      get position() {
        return store.autocomplete.position
      },
      get files() {
        return files()
      },
      move(direction: -1 | 1) {
        if (!store.autocomplete.visible) return
        let next = store.autocomplete.selected + direction
        if (next < 0) next = files().length - 1
        if (next >= files().length) next = 0
        setStore("autocomplete", "selected", next)
      },
      show() {
        setStore("autocomplete", {
          visible: true,
          index: store.input.length,
          position: {
            x: anchor.x,
            y: anchor.y,
            width: anchor.width,
          },
        })
      },
      hide() {
        setStore("autocomplete", "visible", false)
      },
      onInput(value: string) {
        if (value.length <= store.autocomplete.index)
          autocomplete.hide()
      },
      onKeyDown(e: ParsedKey) {
        if (store.autocomplete.visible) {
          if (e.name === "up") autocomplete.move(-1)
          if (e.name === "down") autocomplete.move(1)
          if (e.name === "escape") autocomplete.hide()
        }
        if (!store.autocomplete.visible && e.name === "@") {
          const last = input.value.at(-1)
          if (last === " " || last === undefined) {
            autocomplete.show()
          }
        }
      }
    }
  })()




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
                autocomplete.onInput(value)
              }}
              value={store.input}
              onKeyDown={e => {
                autocomplete.onKeyDown(e)
              }}
              onSubmit={async (val) => {
                if (store.autocomplete.visible) return
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
        top={autocomplete.position.y - 5}
        left={autocomplete.position.x}
        width={autocomplete.position.width}
        zIndex={100}
        {...SplitBorder}
      >
        <box
          backgroundColor={Theme.backgroundElement}
          height={5}
        >
          <For each={autocomplete.files}>
            {(file, index) =>
              <box
                paddingLeft={1}
                paddingRight={1}
                backgroundColor={index() === autocomplete.selection ? Theme.primary : undefined}
              >
                <text
                  fg={index() === autocomplete.selection ? Theme.background : Theme.text}
                >{file}</text>
              </box>
            }

          </For>
        </box>
      </box>
    </>
  )
}

