import { cmd } from "../cmd"
import { render, useKeyHandler, useRenderer, useSelectionHandler, useTerminalDimensions } from "@opentui/solid"
import { TextAttributes } from "@opentui/core"
import { RouteProvider, useRoute } from "./context/route"
import { Home } from "./home"
import { Switch, Match, createSignal, Show } from "solid-js"
import { Theme } from "./context/theme"
import { Installation } from "../../../installation"
import { Global } from "../../../global"
import { Dialog } from "./ui/dialog"
import { Log } from "../../../util/log"

export const OpentuiCommand = cmd({
  command: "opentui",
  describe: "print hello",
  handler: async () => {
    render(() => (
      <RouteProvider>
        <App />
      </RouteProvider>
    ), {

    })
  },
})

function App() {
  const route = useRoute()
  const dimensions = useTerminalDimensions()
  const renderer = useRenderer()
  const [dialog, setDialog] = createSignal(false)
  useKeyHandler((evt) => {
    if (evt.meta && evt.name === "m") {
      setDialog(v => !v)
    }
  })
  useSelectionHandler((evt) => {
    console.log(evt.getSelectedText())
    renderer.console.show()
  })
  return (
    <box border={false} width={dimensions().width} height={dimensions().height} backgroundColor={Theme.background}>
      <group flexDirection="column" flexGrow={1}>
        <Switch>
          <Match when={route.route.type === "home"}>
            <Home />
          </Match>
        </Switch>
      </group>
      <box border={false} height={1} backgroundColor={Theme.backgroundPanel} flexDirection="row" justifyContent="space-between">
        <group flexDirection="row">
          <box border={false} flexDirection="row" backgroundColor={Theme.backgroundElement} paddingLeft={1} paddingRight={1}>
            <text fg={Theme.textMuted}>open</text>
            <text attributes={TextAttributes.BOLD}>code{" "}</text>
            <text fg={Theme.textMuted}>v{Installation.VERSION}</text>
          </box>
          <group paddingLeft={1} paddingRight={1}>
            <text fg={Theme.textMuted}>{process.cwd().replace(Global.Path.home, "~")}</text>
          </group>
        </group>
        <group flexDirection="row">
          <text paddingRight={1} fg={Theme.textMuted}>tab</text>
          <text fg={Theme.secondary}>┃</text>
          <box border={false} backgroundColor={Theme.secondary} paddingLeft={1} paddingRight={1} flexDirection="row" >
            <text fg={Theme.background} attributes={TextAttributes.BOLD}>BUILD </text>
            <text fg={Theme.background}>AGENT</text>
          </box>
        </group>
      </box>
      <group position="absolute">
        <Dialog show={dialog()} onClose={() => setDialog(false)}>
          <group height={10} />
        </Dialog>
      </group>
    </box>
  )
}
