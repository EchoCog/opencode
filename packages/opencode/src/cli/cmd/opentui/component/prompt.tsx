import { InputRenderable, TextAttributes, fg, bold } from "@opentui/core"
import { createEffect } from "solid-js"
import { useLocal } from "../context/local"
import { Theme } from "../context/theme"
import { useDialog } from "../ui/dialog"


export type PromptProps = {
  onSubmit?: (value: string) => void
}
export function Prompt(props: PromptProps) {
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
    <box>
      <box flexDirection="row">
        <box backgroundColor={Theme.backgroundElement} width={3} border={false} justifyContent="center" alignItems="center">
          <text attributes={TextAttributes.BOLD} fg={Theme.primary}>{">"}</text>
        </box>
        <box border={false} paddingTop={1} paddingBottom={2} backgroundColor={Theme.backgroundElement} flexGrow={1}>
          <input onSubmit={props.onSubmit} ref={r => input = r} onMouseDown={r => r.target?.focus()} focusedBackgroundColor={Theme.backgroundElement} cursorColor={Theme.primary} backgroundColor={Theme.backgroundElement} />
        </box>
        <box backgroundColor={Theme.backgroundElement} width={1} border={false} justifyContent="center" alignItems="center">
        </box>
      </box>
      <group paddingLeft={2} paddingRight={1} flexDirection="row" justifyContent="space-between">
        <text>enter {fg(Theme.textMuted)("send")}</text>
        <text>{fg(Theme.textMuted)(local.model.parsed().provider)} {bold(local.model.parsed().model)}</text>
      </group >
    </box>
  )
}
