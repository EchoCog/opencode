import { createEffect, createMemo, For, Match, Show, Switch } from "solid-js"
import { useRouteData } from "./context/route"
import { useSync } from "./context/sync"
import { SplitBorder } from "./component/border"
import { Theme } from "./context/theme"
import { bold, fg, SyntaxStyle } from "@opentui/core"
import { Prompt } from "./component/prompt"
import { useSDK } from "./context/sdk"
import { produce } from "solid-js/store"
import type { AssistantMessage, Part, ToolPart, UserMessage } from "@opencode-ai/sdk"
import type { TextPart } from "ai"
import { useLocal } from "./context/local"
import { Locale } from "../../../util/locale"
import { RGBA, hastToStyledText } from "@opentui/core"
import highlight from "tree-sitter-highlight"
import type { Tool } from "../../../tool/tool"
import type { BashTool } from "../../../tool/bash"
import type { ReadTool } from "../../../tool/read"
import type { WriteTool } from "../../../tool/write"

export function Session() {
  const route = useRouteData("session")
  const sdk = useSDK()
  const sync = useSync()
  const session = createMemo(() => sync.data.session[route.sessionID])
  const messages = createMemo(() => Object.values(sync.data.message[route.sessionID] ?? {}))

  createEffect(() => {
    sdk.session
      .messages({
        path: {
          id: route.sessionID,
        },
      })
      .then((result) => {
        if (result.data) {
          sync.set(
            produce((draft) => {
              for (const message of result.data) {
                draft.message[route.sessionID] ??= {}
                draft.message[route.sessionID][message.info.id] = message.info
                for (const part of message.parts) {
                  draft.part[route.sessionID] ??= {}
                  draft.part[route.sessionID][message.info.id] ??= {}
                  draft.part[route.sessionID][message.info.id][part.id] = part
                }
              }
            }),
          )
        }
      })
  })

  return (
    <box paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={2} flexGrow={1} maxHeight="100%">
      <Show when={session()}>
        <box paddingLeft={1} paddingRight={1} {...SplitBorder} borderColor={Theme.backgroundElement}>
          <text>
            {bold(fg(Theme.accent)("#"))} {bold(session().title)}
          </text>
          <box flexDirection="row">
            <Switch>
              <Match when={session().share?.url}>
                <text fg={Theme.textMuted}>{session().share!.url}</text>
              </Match>
              <Match when={true}>
                <text>/share {fg(Theme.textMuted)("to create a shareable link")}</text>
              </Match>
            </Switch>
          </box>
        </box>
        <scrollbox
          paddingTop={1}
          paddingBottom={1}
          contentOptions={{
            minWidth: "100%",
            flexGrow: 1,
            gap: 1,
          }}
        >
          <For each={messages()}>
            {(message) => (
              <Switch>
                <Match when={message.role === "user"}>
                  <UserMessage
                    message={message as UserMessage}
                    parts={Object.values(sync.data.part[route.sessionID]?.[message.id] ?? {})}
                  />
                </Match>
                <Match when={message.role === "assistant"}>
                  <AssistantMessage
                    message={message as AssistantMessage}
                    parts={Object.values(sync.data.part[route.sessionID]?.[message.id] ?? {})}
                  />
                </Match>
              </Switch>
            )}
          </For>
        </scrollbox>
        <box flexShrink={0}>
          <Prompt sessionID={route.sessionID} />
        </box>
      </Show>
    </box>
  )
}

function UserMessage(props: { message: UserMessage; parts: Part[] }) {
  return (
    <For each={props.parts}>
      {(part) => (
        <Switch>
          <Match when={part.type === "text"}>
            <UserTextPart part={part as TextPart} message={props.message} />
          </Match>
        </Switch>
      )}
    </For>
  )
}

function UserTextPart(props: { part: TextPart; message: UserMessage }) {
  const sync = useSync()
  return (
    <box
      border={["left"]}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      backgroundColor={Theme.backgroundPanel}
      customBorderChars={SplitBorder.customBorderChars}
      borderColor={Theme.secondary}
    >
      <text>{props.part.text.trim()}</text>
      <text>
        {sync.data.config.username ?? "You"} {fg(Theme.textMuted)("(" + Locale.time(props.message.time.created) + ")")}
      </text>
    </box>
  )
}

function AssistantMessage(props: { message: AssistantMessage; parts: Part[] }) {
  return (
    <For each={props.parts}>
      {(part) => (
        <Switch>
          <Match when={part.type === "text"}>
            <TextPart part={part as TextPart} message={props.message} />
          </Match>
          <Match when={part.type === "tool"}>
            <ToolPart part={part as ToolPart} message={props.message} />
          </Match>
        </Switch>
      )}
    </For>
  )
}

function TextPart(props: { part: TextPart; message: AssistantMessage }) {
  const sync = useSync()
  const agent = createMemo(() => sync.data.agent.find((x) => x.name === props.message.mode)!)
  const local = useLocal()

  return (
    <box paddingLeft={3}>
      <text>{props.part.text.trim()}</text>
      <text>
        {fg(local.agent.color(agent().name))(Locale.titlecase(agent().name))}{" "}
        {fg(Theme.textMuted)(props.message.providerID + "/" + props.message.modelID)}
      </text>
    </box>
  )
}

const PendingCopy: Record<string, string> = {
  task: "Delegating...",
  bash: "Writing command...",
  edit: "Preparing edit...",
  webfetch: "Fetching from the web...",
  glob: "Finding files...",
  grep: "Searching content...",
  list: "Listing directory...",
  read: "Reading file...",
  write: "Preparing write...",
  todowrite: "Planning...",
  patch: "Preparing patch...",
  default: "Working...",
}

function ToolPart(props: { part: ToolPart; message: AssistantMessage }) {
  const toolProps = createMemo(
    (): ToolProps<any> => ({
      input: "input" in props.part.state ? props.part.state.input : ({} as any),
      metadata: "metadata" in props.part.state ? props.part.state.metadata : ({} as any),
      output: "output" in props.part.state ? props.part.state.output : undefined,
    }),
  )


  return (
    <box {...SplitBorder} borderColor={Theme.backgroundPanel}>
      <box paddingTop={1} paddingBottom={1} paddingLeft={2} backgroundColor={Theme.backgroundPanel} gap={1}>
        <Switch>
          <Match when={props.part.state.status === "pending"}>
            {PendingCopy[props.part.tool] ?? PendingCopy["default"]}
          </Match>
          <Match when={true}>
            <Switch>
              <Match when={props.part.tool === "bash"}>
                <BashToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "read"}>
                <ReadToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "write"}>
                <WriteToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "glob"}>
                <GlobToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "grep"}>
                <GrepToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "list"}>
                <ListToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "task"}>
                <TaskToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "webfetch"}>
                <WebFetchToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "edit"}>
                <EditToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "patch"}>
                <PatchToolPart {...(toolProps() as any)} />
              </Match>
              <Match when={props.part.tool === "todowrite"}>
                <TodoWriteToolPart {...(toolProps() as any)} />
              </Match>
            </Switch>
          </Match>
        </Switch>
      </box>
    </box>
  )
}

type ToolProps<T extends Tool.Info> = {
  input: Tool.InferParameters<T>
  metadata: Tool.InferMetadata<T>
  output?: string
}

function BashToolPart(props: ToolProps<typeof BashTool>) {
  return (
    <>
      <text fg={Theme.textMuted}>Shell {props.input["description"]}</text>
      <box>
        <text>$ {props.input["command"]}</text>
        <text>{props.output?.trim()}</text>
      </box>
    </>
  )
}

const syntax = new SyntaxStyle({
  keyword: { fg: RGBA.fromHex(Theme.syntaxKeyword), bold: true },
  string: { fg: RGBA.fromHex(Theme.syntaxString) },
  comment: { fg: RGBA.fromHex(Theme.syntaxComment), italic: true },
  number: { fg: RGBA.fromHex(Theme.syntaxNumber) },
  function: { fg: RGBA.fromHex(Theme.syntaxFunction) },
  type: { fg: RGBA.fromHex(Theme.syntaxType) },
  operator: { fg: RGBA.fromHex(Theme.syntaxOperator) },
  variable: { fg: RGBA.fromHex(Theme.syntaxVariable) },
  bracket: { fg: RGBA.fromHex(Theme.syntaxPunctuation) },
  punctuation: { fg: RGBA.fromHex(Theme.syntaxPunctuation) },
  default: { fg: RGBA.fromHex(Theme.syntaxVariable) },
})

function ReadToolPart(props: ToolProps<typeof ReadTool>) {
  const hast = createMemo(() =>
    props.metadata["preview"] ? highlight.highlightHast(props.metadata["preview"], highlight.Language.TS) : "",
  )
  return (
    <>
      <text fg={Theme.textMuted}>Read {props.input["filePath"]}</text>
      <box>
        <text>{hastToStyledText(hast() as any, syntax)}</text>
      </box>
    </>
  )
}

function WriteToolPart(props: ToolProps<typeof WriteTool>) {
  const hast = createMemo(() =>
    props.input.content ? highlight.highlightHast(props.input.content, highlight.Language.TS) : "",
  )
  return (
    <>
      <text fg={Theme.textMuted}>Wrote {props.input.filePath}</text>
      <box>
        <text>{hastToStyledText(hast() as any, syntax)}</text>
      </box>
    </>
  )
}

function GlobToolPart(props: ToolProps<Tool.Info>) {
  return (
    <>
      <text fg={Theme.textMuted}>Glob {(props.input as any).pattern}</text>
      <box>
        <text>{props.output?.trim()}</text>
      </box>
    </>
  )
}

function GrepToolPart(props: ToolProps<Tool.Info>) {
  return (
    <>
      <text fg={Theme.textMuted}>Grep {(props.input as any).pattern}</text>
      <box>
        <text>{props.output?.trim()}</text>
      </box>
    </>
  )
}

function ListToolPart(props: ToolProps<Tool.Info>) {
  return (
    <>
      <text fg={Theme.textMuted}>List {(props.input as any).path || "."}</text>
      <box>
        <text>{props.output?.trim()}</text>
      </box>
    </>
  )
}

function TaskToolPart(props: ToolProps<Tool.Info>) {
  return (
    <>
      <text fg={Theme.textMuted}>Task {(props.input as any).description}</text>
      <box>
        <text>{props.output?.trim()}</text>
      </box>
    </>
  )
}

function WebFetchToolPart(props: ToolProps<Tool.Info>) {
  return (
    <>
      <text fg={Theme.textMuted}>WebFetch {(props.input as any).url}</text>
      <box>
        <text>{props.output?.trim()}</text>
      </box>
    </>
  )
}

function EditToolPart(props: ToolProps<Tool.Info>) {
  return (
    <>
      <text fg={Theme.textMuted}>Edit {(props.input as any).filePath}</text>
      <box>
        <text>{(props.metadata as any).diff}</text>
        <text>{props.output?.trim()}</text>
      </box>
    </>
  )
}

function PatchToolPart(props: ToolProps<Tool.Info>) {
  return (
    <>
      <text fg={Theme.textMuted}>Patch</text>
      <box>
        <text>{props.output?.trim()}</text>
      </box>
    </>
  )
}

function TodoWriteToolPart(props: ToolProps<Tool.Info>) {
  return (
    <>
      <text fg={Theme.textMuted}>Todo</text>
      <box>
        <text>{props.output?.trim()}</text>
      </box>
    </>
  )
}
