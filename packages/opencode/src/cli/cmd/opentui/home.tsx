import { Installation } from "../../../installation";
import { Theme } from "./context/theme";
import { TextAttributes, bold, fg } from "@opentui/core"
import { Prompt } from "./component/prompt";
import { useSDK } from "./context/sdk";
import { useRoute } from "./context/route";
import { useLocal } from "./context/local";

export function Home() {
  const sdk = useSDK()
  const route = useRoute()
  const local = useLocal()
  return (
    <group flexGrow={1} justifyContent="center" alignItems="center">
      <group>
        <Logo />
        <group paddingTop={2}>
          <HelpRow slash="new">new session</HelpRow>
          <HelpRow slash="help">show help</HelpRow>
          <HelpRow slash="share">share session</HelpRow>
          <HelpRow slash="models">list models</HelpRow>
          <HelpRow slash="agents">list agents</HelpRow>
        </group>
      </group>
      <group paddingTop={3} >
        <Prompt onSubmit={async (val) => {
          const session = await sdk.session.create({
            body: {
            },
          })
          route.navigate({
            type: "session",
            sessionID: session.data!.id,
          })
          await sdk.session.chat({
            path: {
              id: session.data!.id,
            },
            body: {
              ...local.model.current(),
              agent: local.agent.current().name,
              parts: [
                {
                  type: "text",
                  text: val,
                }
              ]
            },
          })
        }} />
      </group >
    </group>
  )
}

function HelpRow(props: { children: string, slash: string }) {
  return (
    <text>
      {bold(fg(Theme.primary)("/" + props.slash.padEnd(10, " ")))} {props.children.padEnd(15, " ")} {fg(Theme.textMuted)("ctrl+x n")}
    </text>
  )
}

function Logo() {
  return (
    <group>
      <group flexDirection="row">
        <text fg={Theme.textMuted}>
          {"█▀▀█ █▀▀█ █▀▀ █▀▀▄"}
        </text>
        <text fg={Theme.text} attributes={TextAttributes.BOLD} >
          {" █▀▀ █▀▀█ █▀▀▄ █▀▀"}
        </text>
      </group>
      <group flexDirection="row">
        <text fg={Theme.textMuted}>
          {`█░░█ █░░█ █▀▀ █░░█`}
        </text>
        <text fg={Theme.text}>
          {` █░░ █░░█ █░░█ █▀▀`}
        </text>
      </group>
      <group flexDirection="row">
        <text fg={Theme.textMuted}>
          {`▀▀▀▀ █▀▀▀ ▀▀▀ ▀  ▀`}
        </text>
        <text fg={Theme.text}>
          {` ▀▀▀ ▀▀▀▀ ▀▀▀  ▀▀▀`}
        </text>
      </group>
      <group flexDirection="row" justifyContent="flex-end">
        <text fg={Theme.textMuted}>{Installation.VERSION}</text>
      </group>
    </group>
  )
}
