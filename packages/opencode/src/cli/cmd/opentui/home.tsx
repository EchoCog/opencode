import { createEffect } from "solid-js";
import { Installation } from "../../../installation";
import { Theme } from "./context/theme";
import { InputRenderable, TextAttributes, bold, fg } from "@opentui/core"
import { useDialog } from "./ui/dialog";
import { useLocal } from "./context/local";

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
        <Prompt />
      </group >
    </group>
  )
}

function Prompt() {
  let input: InputRenderable
  const dialog = useDialog()
  const local = useLocal()

  createEffect(() => {
    if (dialog.stack.length === 0 && input)
      input.focus()
    if (dialog.stack.length > 0)
      input.blur()
  })

  return (
    <group>
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
          <input ref={r => input = r} onMouseDown={r => r.target?.focus()} focusedBackgroundColor={Theme.backgroundElement} cursorColor={Theme.primary} backgroundColor={Theme.backgroundElement} width={70} />
        </box>
        <box backgroundColor={Theme.backgroundElement} width={1} border={false} justifyContent="center" alignItems="center">
        </box>
        <group>
          <text fg={Theme.textMuted}>┃</text>
          <text fg={Theme.textMuted}>┃</text>
          <text fg={Theme.textMuted}>┃</text>
        </group>
      </group>
      <group paddingLeft={2} paddingRight={1} flexDirection="row" justifyContent="space-between">
        <text>enter {fg(Theme.textMuted)("send")}</text>
        <text>{fg(Theme.textMuted)(local.model.parsed().provider)} {bold(local.model.parsed().model)}</text>
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
