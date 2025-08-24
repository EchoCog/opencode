import { useKeyHandler, useTerminalDimensions } from "@opentui/solid"
import { Show, type ParentProps } from "solid-js"
import { Theme } from "../context/theme"
import { RGBA } from "@opentui/core"


export function Dialog(props: ParentProps<{ show: boolean, onClose: () => void }>) {
  const dimensions = useTerminalDimensions()
  useKeyHandler((evt) => {
    if (evt.name === "escape") {
      props.onClose()
    }
  })
  return (
    <Show when={props.show}>
      <box
        border={false}
        width={dimensions().width}
        height={dimensions().height}
        justifyContent="center"
        alignItems="center"
        position="absolute"
        left={0}
        top={0}
        backgroundColor={RGBA.fromInts(0, 0, 0, 200)}>
        <box border={false} width={76} height={10} justifyContent="center" alignItems="center" maxWidth={dimensions().width - 2} backgroundColor={Theme.backgroundPanel} borderColor={Theme.primary}>
          <text>This is a modal wtf</text>
        </box>
      </box>
    </Show >
  )
}
