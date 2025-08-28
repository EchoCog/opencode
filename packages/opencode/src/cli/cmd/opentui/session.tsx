import { createMemo, Match, Show, Switch } from "solid-js";
import { useRouteData } from "./context/route";
import { useSync } from "./context/sync";
import { SplitBorder } from "./component/border";
import { Theme } from "./context/theme";
import { bold, fg } from "@opentui/core";
import { Prompt } from "./component/prompt";

export function Session() {
  const route = useRouteData("session")
  const sync = useSync()
  const session = createMemo(() => sync.data.session[route.sessionID])

  return (
    <box paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={2} flexGrow={1}>
      <Show when={session()}>
        <box paddingLeft={1} paddingRight={1} {...SplitBorder} borderColor={Theme.backgroundElement} >
          <text>{bold(fg(Theme.accent)("#"))} {bold(session().title)}</text>
          <group flexDirection="row">
            <Switch>
              <Match when={session().share?.url}>
                <text fg={Theme.textMuted}>{session().share!.url}</text>
              </Match>
              <Match when={true}>
                <text>/share {fg(Theme.textMuted)("to create a shareable link")}</text>
              </Match>
            </Switch>
          </group>
        </box>
        <box flexGrow={1}>
        </box>
        <group>
          <Prompt />
        </group>
      </Show >
    </box >
  )
}
