import { createMemo } from "solid-js";
import { useLocal } from "../context/local";
import { useSync } from "../context/sync";
import { map, pipe, flatMap, entries, filter } from "remeda";
import { DialogSelect } from "./dialog-select";
import { useDialog } from "./dialog";

export function DialogModel() {
  const local = useLocal()
  const sync = useSync()
  const dialog = useDialog()

  const options = createMemo(() => [
    ...local.model.recent().map(key => {
      const [providerID, ...rest] = key.split("/")
      const provider = sync.data.provider.find((x) => x.id === providerID)!
      const modelID = rest.join("/")
      const model = provider.models[modelID]
      return {
        key,
        title: model.name ?? modelID,
        description: provider.name,
        category: "Recent",
      }
    }),
    ...pipe(
      sync.data.provider,
      flatMap((provider) => pipe(
        provider.models,
        entries(),
        map(([model, info]) => ({
          key: `${provider.id}/${model}`,
          title: info.name ?? model,
          description: provider.name,
          category: provider.name,
        })),
        filter(x => !local.model.recent().includes(x.key)),
      )),
    )
  ])

  return (<DialogSelect
    title="Select model"
    options={options()}
    onSelect={option => {
      local.model.set(option.key, { recent: true })
      dialog.clear()
    }} />
  )

}
