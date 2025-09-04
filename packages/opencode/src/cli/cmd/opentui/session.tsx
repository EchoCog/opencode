import { batch, createMemo, For, Match, onMount, Show, Switch } from "solid-js";
import { useRouteData } from "./context/route";
import { useSync } from "./context/sync";
import { SplitBorder } from "./component/border";
import { Theme } from "./context/theme";
import { bold, fg } from "@opentui/core";
import { Prompt } from "./component/prompt";
import { useSDK } from "./context/sdk";
import { produce } from "solid-js/store";
import type { TextPart } from "ai";

export function Session() {
  const route = useRouteData("session")
  const sdk = useSDK()
  const sync = useSync()
  const session = createMemo(() => sync.data.session[route.sessionID])
  const messages = createMemo(() => Object.values(sync.data.message[route.sessionID] ?? {}))

  const working = createMemo(() => {
    const last = messages()[messages().length - 1]
    if (!last) return false
    if (last.role === "user") return true
    return !last.time.completed
  })

  onMount(() => {
    sdk.session.messages({
      path: {
        id: route.sessionID,
      },
    }).then(result => {
      if (result.data) {
        sync.set(produce(draft => {
          for (const message of result.data) {
            draft.message[route.sessionID] ??= {}
            draft.message[route.sessionID][message.info.id] = message.info
            for (const part of message.parts) {
              draft.part[route.sessionID] ??= {}
              draft.part[route.sessionID][message.info.id] ??= {}
              draft.part[route.sessionID][message.info.id][part.id] = part
            }
          }
        }))
      }
    })

  })

  return (
    <box paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={2} flexGrow={1}>
      <Show when={session()}>
        <box paddingLeft={1} paddingRight={1} {...SplitBorder} borderColor={Theme.backgroundElement} >
          <text>{bold(fg(Theme.accent)("#"))} {bold(session().title)}</text>
          <box flexDirection="row">
            <Switch>
              <Match when={session().share?.url}>
                <text fg={Theme.textMuted}>{session().share!.url}</text>
              </Match>
              <Match when={true}>
                <text>/share {fg(Theme.textMuted)("to create a shareable link")}</text>
              </Match>
            </Switch>
          </box>
        </box>
        <box flexGrow={1} gap={1} paddingTop={1}>
          <For each={messages()}>
            {(message) =>
              <For each={Object.values(sync.data.part[route.sessionID]?.[message.id] ?? {})}>
                {(part) =>
                  <Switch>
                    <Match when={part.type === "text" && message.role === "user"}>
                      <box border={["left"]} paddingTop={1} paddingBottom={1} paddingLeft={2} backgroundColor={Theme.backgroundPanel} customBorderChars={SplitBorder.customBorderChars} borderColor={Theme.secondary}>
                        <text>{part.text.trim()}</text>
                        <text>thdxr (07:26pm)</text>
                      </box>
                    </Match>
                    <Match when={part.type === "text" && message.role === "assistant"}>
                      <box paddingLeft={3} >
                        <text>{part.text.trim()}</text>
                      </box>
                    </Match>
                  </Switch>
                }
              </For>
            }
          </For>
        </box>
        <box>
          <Prompt working={working()} onSubmit={async value => {
            await sdk.session.prompt({
              path: {
                id: route.sessionID,
              },
              body: {
                parts: [
                  {
                    type: "text",
                    text: value,
                  }
                ]
              },
            })
          }} />
        </box>
      </Show >
    </box >
  )
}
