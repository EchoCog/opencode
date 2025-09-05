import { InputRenderable, RGBA, TextAttributes } from "@opentui/core"
import { Theme } from "../context/theme"
import { entries, flatMap, groupBy, pipe, take } from "remeda"
import { batch, createEffect, createMemo, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useKeyHandler } from "@opentui/solid"
import * as fuzzysort from "fuzzysort"
import { isDeepEqual } from "remeda"

export interface DialogSelectProps<T> {
  title: string
  options: DialogSelectOption<T>[]
  onFilter?: (query: string) => void
  onSelect?: (option: DialogSelectOption<T>) => void
  current?: T
}

export interface DialogSelectOption<T> {
  value: T
  title: string
  description?: string
  category?: string
  onSelect?: () => void
}

export function DialogSelect<T>(props: DialogSelectProps<T>) {
  const [store, setStore] = createStore({
    selected: 0,
    filter: ""
  })

  let input: InputRenderable


  const grouped = createMemo(() => {
    const needle = store.filter.toLowerCase()
    return pipe(
      props.options,
      (x) => !needle ? x : fuzzysort.go(needle, x, { keys: ["title", "category"] }).map((x) => x.obj),
      take(10),
      groupBy((x) => x.category ?? ""),
      // mapValues((x) => x.sort((a, b) => a.title.localeCompare(b.title))),
      entries(),
    )
  })

  const flat = createMemo(() => {
    return pipe(
      grouped(),
      flatMap(([_, options]) => options),
    )
  })

  createEffect(() => {
    store.filter
    setStore("selected", 0)
  })

  function move(direction: -1 | 1) {
    let next = store.selected + direction
    if (next < 0) next = flat().length - 1
    if (next >= flat().length) next = 0
    setStore("selected", next)
  }


  useKeyHandler((evt) => {
    if (evt.name === "up") move(-1)
    if (evt.name === "down") move(1)
    if (evt.name === "return") {
      const option = flat()[store.selected]
      if (option.onSelect) option.onSelect()
      props.onSelect?.(option)
    }
  })


  return (
    <box>
      <box paddingLeft={2} paddingRight={2}>
        <box paddingLeft={1}>
          <box flexDirection="row" justifyContent="space-between">
            <text attributes={TextAttributes.BOLD}>{props.title}</text>
            <text fg={Theme.textMuted}>esc</text>
          </box>
          <box paddingTop={1} paddingBottom={1}>
            <input
              onInput={(e) => {
                batch(() => {
                  setStore("filter", e)
                  props.onFilter?.(e)
                })
              }}
              focusedBackgroundColor={Theme.backgroundPanel}
              cursorColor={Theme.primary}
              focusedTextColor={Theme.textMuted}
              ref={r => {
                input = r
                input.focus()
              }} placeholder="Enter search term" />
          </box>
        </box>
        <box paddingBottom={1}  >
          <For each={grouped()}>
            {([category, options]) =>
              <box flexShrink={0}  >
                <Show when={category}>
                  <box paddingTop={1} paddingLeft={1} >
                    <text fg={Theme.accent} attributes={TextAttributes.BOLD}>{category}</text>
                  </box>
                </Show>
                <For each={options}>
                  {(option) =>
                    <Option
                      title={option.title}
                      description={option.description !== category ? option.description : undefined}
                      active={isDeepEqual(option.value, flat()[store.selected].value)}
                      current={isDeepEqual(option.value, props.current)} />
                  }
                </For>
              </box>
            }
          </For>
        </box>
      </box>
      <box paddingRight={2} paddingLeft={3} paddingBottom={1} flexDirection="row"  >
        <text fg={Theme.text} attributes={TextAttributes.BOLD}>n</text>
        <text fg={Theme.textMuted}> new</text>
        <text fg={Theme.text} attributes={TextAttributes.BOLD}>{"   "}r</text>
        <text fg={Theme.textMuted}> rename</text>
      </box>
    </box>
  )
}

function Option(props: { title: string, description?: string, active?: boolean, current?: boolean }) {
  return (
    <box flexDirection="row" backgroundColor={props.active ? Theme.primary : RGBA.fromInts(0, 0, 0, 0)} paddingLeft={1} paddingRight={1}>
      <text fg={props.active ? Theme.background : props.current ? Theme.primary : Theme.text} attributes={props.active ? TextAttributes.BOLD : undefined}>{props.title}</text>
      <text fg={props.active ? Theme.background : Theme.textMuted}> {props.description}</text>
    </box>
  )
}
