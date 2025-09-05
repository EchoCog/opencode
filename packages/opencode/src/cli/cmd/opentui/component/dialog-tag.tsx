import { createMemo, createResource } from "solid-js";
import { useLocal } from "../context/local";
import { useSync } from "../context/sync";
import { DialogSelect } from "../ui/dialog-select";
import { useDialog } from "../ui/dialog";
import { useSDK } from "../context/sdk";
import { createStore } from "solid-js/store";

export function DialogTag(props: {
  onSelect?: (value: string) => void
}) {
  const local = useLocal()
  const sync = useSync()
  const sdk = useSDK()
  const dialog = useDialog()

  const [store, setStore] = createStore({
    filter: ""
  })

  const [files] = createResource(() => [store.filter], async () => {
    const result = await sdk.find.files({
      query: {
        query: store.filter,
      },
    })
    if (result.error) return []
    const sliced = (result.data ?? []).slice(0, 5)
    return sliced
  })

  const options = createMemo(() => (files() ?? []).map(file => ({
    value: file,
    title: file,
  })))

  return <DialogSelect
    title="Autocomplete"
    options={options()}
    onSelect={option => {
      props.onSelect?.(option.value)
      dialog.clear()
    }}
  />

}
