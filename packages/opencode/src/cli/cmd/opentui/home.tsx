import { Installation } from "../../../installation";
import { Theme } from "./context/theme";
import { TextAttributes } from "@opentui/core"

export function Home() {
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
        <group flexDirection="row">
          <group>
            <text fg={Theme.textMuted}>┃</text>
            <text fg={Theme.textMuted}>┃</text>
            <text fg={Theme.textMuted}>┃</text>
          </group>
          <box backgroundColor={Theme.backgroundElement} width={3} border={false} justifyContent="center" alignItems="center">
            <text attributes={TextAttributes.BOLD} fg={Theme.primary}>{">"}</text>
          </box>
          <box border={false} paddingTop={1} paddingBottom={2} backgroundColor={Theme.backgroundElement}>
            <input focused={false} focusedBackgroundColor={Theme.backgroundElement} cursorColor={Theme.primary} backgroundColor={Theme.backgroundElement} width={70} />
          </box>
          <box backgroundColor={Theme.backgroundElement} width={1} border={false} justifyContent="center" alignItems="center">
          </box>
          <group>
            <text fg={Theme.textMuted}>┃</text>
            <text fg={Theme.textMuted}>┃</text>
            <text fg={Theme.textMuted}>┃</text>
          </group>
        </group>
        <group paddingLeft={2} paddingRight={2} flexDirection="row" justifyContent="space-between">
          <group flexDirection="row">
            <text>enter </text>
            <text fg={Theme.textMuted}>send</text>
          </group>
          <group flexDirection="row">
            <text fg={Theme.textMuted}>opencode </text>
            <text>Sonic</text>
          </group>
        </group >
      </group >
    </group>
  )
}

function HelpRow(props: { children: string, slash: string }) {
  return (
    <group flexDirection="row">
      <text fg={Theme.primary} attributes={TextAttributes.BOLD}>/{props.slash.padEnd(10, " ")}</text>
      <text>{props.children}</text>
      <group flexGrow={1} flexDirection="row" justifyContent="flex-end">
        <text fg={Theme.textMuted}>ctrl+x n</text>
      </group>
    </group >
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
