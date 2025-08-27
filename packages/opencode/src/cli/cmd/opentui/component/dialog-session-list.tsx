import { useDialog } from "../ui/dialog"
import { DialogModel } from "./dialog-model"
import { DialogSelect } from "../ui/dialog-select"
import { useRoute } from "../context/route"
import { useSync } from "../context/sync"
import { createMemo } from "solid-js"

export function DialogSessionList() {
  const dialog = useDialog()
  const sync = useSync()
  const route = useRoute()

  const options = createMemo(() => {
    const today = new Date().toDateString()
    return Object.values(sync.data.session).map((x) => {
      let category = new Date(x.time.created).toDateString()
      if (category === today) {
        category = "Today"
      }
      return {
        title: x.title,
        value: x.id,
        category,
      }
    })
  })

  return (
    <DialogSelect
      title="Sessions"
      options={options()}
      onSelect={(option) => {
        route.navigate({
          type: "session",
          sessionID: option.value,
        })
        dialog.clear()
      }}
    />

  )
}
