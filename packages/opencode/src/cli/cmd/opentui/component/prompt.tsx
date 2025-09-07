import {
  InputRenderable,
  TextAttributes,
  fg,
  bold,
  BoxRenderable,
  type ParsedKey,
} from "@opentui/core"
import {
  createEffect,
  createMemo,
  createResource,
  For,
  Match,
  onMount,
  Switch,
} from "solid-js"

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
  let autocomplete: AutocompleteRef

  const dialog = useDialog()
  const local = useLocal()
  const sdk = useSDK()
  const route = useRoute()
  const sync = useSync()

  const [store, setStore] = createStore({
    input: "",
  })

  const messages = createMemo(() => {
    if (!props.sessionID) return []
    return sync.data.message[props.sessionID] ?? []
  })
  const working = createMemo(() => {
    const last = messages()[messages().length - 1]
    if (!last) return false
    if (last.role === "user") return true
    return !last.time.completed
  })

  createEffect(() => {
    if (dialog.stack.length === 0 && input) input.focus()
    if (dialog.stack.length > 0) input.blur()
  })

  return (
    <>
      <Autocomplete
        ref={(r) => (autocomplete = r)}
        anchor={() => anchor}
        setInput={(cb) => {
          setStore("input", cb)
          input.cursorPosition = store.input.length
        }}
        value={store.input}
      />
      <box ref={(r) => (anchor = r)}>
        <box flexDirection="row" {...SplitBorder}>
          <box
            backgroundColor={Theme.backgroundElement}
            width={3}
            justifyContent="center"
            alignItems="center"
          >
            <text attributes={TextAttributes.BOLD} fg={Theme.primary}>
              {">"}
            </text>
          </box>
          <box
            paddingTop={1}
            paddingBottom={2}
            backgroundColor={Theme.backgroundElement}
            flexGrow={1}
          >
            <input
              onInput={(value) => {
                setStore("input", value)
                autocomplete.onInput(value)
              }}
              value={store.input}
              onKeyDown={(e) => {
                autocomplete.onKeyDown(e)
              }}
              onSubmit={async (val) => {
                if (autocomplete.visible) return
                console.log("submitting")
                input.value = ""
                console.log({ sessionID: props.sessionID })
                const sessionID = props.sessionID
                  ? props.sessionID
                  : await (async () => {
                    const sessionID = await sdk.session
                      .create({})
                      .then((x) => x.data!.id)
                    route.navigate({
                      type: "session",
                      sessionID,
                    })
                    return sessionID
                  })()
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
                      },
                    ],
                  },
                })
              }}
              ref={(r) => (input = r)}
              onMouseDown={(r) => r.target?.focus()}
              focusedBackgroundColor={Theme.backgroundElement}
              cursorColor={Theme.primary}
              backgroundColor={Theme.backgroundElement}
            />
          </box>
          <box
            backgroundColor={Theme.backgroundElement}
            width={1}
            justifyContent="center"
            alignItems="center"
          ></box>
        </box>
        <box
          paddingLeft={2}
          paddingRight={1}
          flexDirection="row"
          justifyContent="space-between"
        >
          <Switch>
            <Match when={working()}>
              <text>working...</text>
            </Match>
            <Match when={true}>
              <text>enter {fg(Theme.textMuted)("send")}</text>
            </Match>
          </Switch>
          <text>
            {fg(Theme.textMuted)(local.model.parsed().provider)}{" "}
            {bold(local.model.parsed().model)}
          </text>
        </box>
      </box>
    </>
  )
}

type AutocompleteRef = {
  onInput: (value: string) => void
  onKeyDown: (e: ParsedKey) => void
  visible: boolean
}

function Autocomplete(props: {
  value: string
  setInput: (input: (value: string) => string) => void
  anchor: () => BoxRenderable
  ref: (ref: AutocompleteRef) => void
}) {
  const sdk = useSDK()
  const [store, setStore] = createStore({
    index: 0,
    selected: 0,
    visible: false,
    position: { x: 0, y: 0, width: 0 },
  })
  const filter = createMemo(() => {
    if (!store.visible) return ""
    return props.value.substring(store.index + 1)
  })

  const [files] = createResource(
    () => [filter()],
    async () => {
      if (!store.visible) return []
      const result = await sdk.find.files({
        query: {
          query: filter(),
        },
      })
      if (result.error) return []
      const sliced = (result.data ?? []).slice(0, 5)
      return sliced
    },
    {
      initialValue: [],
    },
  )

  createEffect(() => {
    filter()
    setStore("selected", 0)
  })

  function move(direction: -1 | 1) {
    if (!store.visible) return
    let next = store.selected + direction
    if (next < 0) next = files().length - 1
    if (next >= files().length) next = 0
    setStore("selected", next)
  }

  function show(input: string) {
    setStore({
      visible: true,
      index: input.length,
      position: {
        x: props.anchor().x,
        y: props.anchor().y,
        width: props.anchor().width,
      },
    })
  }

  function hide() {
    setStore("visible", false)
  }

  onMount(() => {
    props.ref({
      get visible() {
        return store.visible
      },
      onInput(value: string) {
        if (value.length <= store.index) hide()
      },
      onKeyDown(e: ParsedKey) {
        if (store.visible) {
          if (e.name === "up") move(-1)
          if (e.name === "down") move(1)
          if (e.name === "escape") hide()
          if (e.name === "return") {
            props.setInput((val) => {
              const append = files()[store.selected] + " "
              if (store.index === 0) return append
              return val.slice(0, store.index) + append
            })
            setTimeout(() => hide(), 0)
          }
        }
        if (!store.visible && e.name === "@") {
          const last = props.value.at(-1)
          if (last === " " || last === undefined) {
            show(props.value)
          }
        }
      },
    })
  })

  return (
    <box
      visible={store.visible}
      position="absolute"
      top={store.position.y - 5}
      left={store.position.x}
      width={store.position.width}
      zIndex={100}
      {...SplitBorder}
    >
      <box backgroundColor={Theme.backgroundElement} height={5}>
        <For each={files()}>
          {(file, index) => (
            <box
              paddingLeft={1}
              paddingRight={1}
              backgroundColor={
                index() === store.selected ? Theme.primary : undefined
              }
            >
              <text
                fg={index() === store.selected ? Theme.background : Theme.text}
              >
                {file}
              </text>
            </box>
          )}
        </For>
      </box>
    </box>
  )
}
