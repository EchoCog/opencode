# OpenCode Technical Architecture

OpenCode is a comprehensive AI coding agent system built with a client-server architecture, designed to provide intelligent code assistance through terminal interfaces, web applications, and various SDKs.

## Table of Contents

- [System Overview](#system-overview)
- [Core Components](#core-components)
- [Architecture Patterns](#architecture-patterns)
- [Data Flow](#data-flow)
- [Infrastructure](#infrastructure)
- [Development Workflow](#development-workflow)
- [API Structure](#api-structure)
- [Security & Authentication](#security--authentication)

## System Overview

OpenCode follows a modular, client-server architecture that separates concerns and enables scalability:

```mermaid
graph TB
    subgraph "Client Layer"
        TUI[Terminal UI<br/>Go Application]
        WEB[Web Application<br/>SolidJS]
        VSCODE[VS Code Extension]
        SDK[SDK Clients<br/>JS/Go/Python]
    end
    
    subgraph "Server Layer"
        SERVER[OpenCode Server<br/>TypeScript/Bun]
        API[REST API<br/>Hono Framework]
        AUTH[Authentication<br/>OpenAuth]
    end
    
    subgraph "Core Services"
        SESSION[Session Management]
        AGENT[AI Agent System]
        TOOLS[Tool Execution]
        PROJECT[Project Management]
        LSP[Language Server Protocol]
        MCP[Model Context Protocol]
    end
    
    subgraph "Infrastructure"
        CLOUD[Cloud Functions<br/>SST/Cloudflare]
        DB[(Database<br/>Storage)]
        PROVIDERS[AI Providers<br/>Anthropic/OpenAI/etc]
    end
    
    TUI --> SERVER
    WEB --> SERVER
    VSCODE --> SERVER
    SDK --> SERVER
    
    SERVER --> SESSION
    SERVER --> AGENT
    SERVER --> TOOLS
    SERVER --> PROJECT
    SERVER --> LSP
    SERVER --> MCP
    
    AGENT --> PROVIDERS
    SERVER --> CLOUD
    CLOUD --> DB
```

## Core Components

### 1. Terminal UI (TUI) - Go Application

The primary interface for developers, built in Go for performance and native system integration.

**Location**: `packages/tui/`

```mermaid
graph TD
    subgraph "TUI Architecture"
        CLI[Command Line Interface]
        INPUT[Input Handling]
        RENDER[Terminal Rendering]
        CLIENT[API Client<br/>Stainless SDK]
    end
    
    CLI --> INPUT
    INPUT --> RENDER
    CLI --> CLIENT
    CLIENT --> |HTTP/WebSocket| SERVER[OpenCode Server]
```

**Key Features**:
- Native terminal UI with rich interactions
- Real-time session management
- File system integration
- Git integration
- Cross-platform support

### 2. OpenCode Server - TypeScript/Bun

The core server application that orchestrates all AI coding operations.

**Location**: `packages/opencode/`

```mermaid
graph TB
    subgraph "Server Architecture"
        ENTRY[index.ts<br/>CLI Entry Point]
        SERVER[server.ts<br/>HTTP Server]
        
        subgraph "Core Services"
            SESSION[Session Management]
            AGENT[Agent System]
            TOOLS[Tool Execution]
            PROJECT[Project Management]
            CONFIG[Configuration]
        end
        
        subgraph "External Integrations"
            LSP[Language Server Protocol]
            MCP[Model Context Protocol]
            PROVIDERS[AI Provider APIs]
            AUTH[Authentication]
        end
    end
    
    ENTRY --> SERVER
    SERVER --> SESSION
    SERVER --> AGENT
    SERVER --> TOOLS
    SERVER --> PROJECT
    SERVER --> CONFIG
    
    AGENT --> LSP
    AGENT --> MCP
    AGENT --> PROVIDERS
    SERVER --> AUTH
```

### 3. Cloud Infrastructure - SST/Cloudflare

Scalable cloud deployment using SST (Serverless Stack) on Cloudflare.

**Location**: `cloud/`, `infra/`

```mermaid
graph TB
    subgraph "Cloud Infrastructure"
        CF[Cloudflare Workers]
        APP[Cloud App<br/>SolidJS]
        FUNCTIONS[Cloud Functions]
        RESOURCES[Cloud Resources]
    end
    
    subgraph "SST Configuration"
        CONFIG[sst.config.ts]
        INFRA[Infrastructure Definitions]
    end
    
    CONFIG --> CF
    CONFIG --> APP
    CONFIG --> FUNCTIONS
    CONFIG --> RESOURCES
    
    CF --> |Hosts| APP
    CF --> |Executes| FUNCTIONS
```

### 4. Web Application - SolidJS

Browser-based interface for OpenCode functionality.

**Location**: `cloud/app/`, `packages/web/`

```mermaid
graph TB
    subgraph "Web Application"
        SOLID[SolidJS Framework]
        ROUTES[Route Handlers]
        COMPONENTS[UI Components]
        STATE[State Management]
    end
    
    subgraph "Features"
        SESSIONS[Session Browser]
        EDITOR[Code Editor]
        CHAT[AI Chat Interface]
        SHARING[Session Sharing]
    end
    
    SOLID --> ROUTES
    SOLID --> COMPONENTS
    SOLID --> STATE
    
    ROUTES --> SESSIONS
    ROUTES --> EDITOR
    ROUTES --> CHAT
    ROUTES --> SHARING
```

### 5. SDK Ecosystem

Multi-language SDKs for integrating OpenCode into various environments.

**Location**: `packages/sdk/`, `sdks/`

```mermaid
graph LR
    subgraph "SDK Languages"
        JS[JavaScript/TypeScript<br/>Stainless Generated]
        GO[Go SDK]
        PYTHON[Python SDK]
        VSCODE[VS Code Extension]
    end
    
    subgraph "Common Features"
        CLIENT[API Client]
        TYPES[Type Definitions]
        AUTH[Authentication]
        STREAMING[Real-time Streaming]
    end
    
    JS --> CLIENT
    GO --> CLIENT
    PYTHON --> CLIENT
    VSCODE --> CLIENT
    
    CLIENT --> TYPES
    CLIENT --> AUTH
    CLIENT --> STREAMING
```

## Architecture Patterns

### 1. Session-Based Architecture

OpenCode organizes work around sessions that encapsulate project context, conversation history, and state.

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Session
    participant Agent
    participant Tools
    
    Client->>Server: Create Session
    Server->>Session: Initialize
    Session->>Session: Load Project Context
    
    Client->>Server: Send Message
    Server->>Session: Add Message
    Session->>Agent: Process Request
    Agent->>Tools: Execute Tools
    Tools-->>Agent: Results
    Agent-->>Session: Response
    Session-->>Server: Updated State
    Server-->>Client: Stream Response
```

### 2. Tool-Based Execution

The system uses a tool-based architecture where AI agents can execute various tools to interact with the codebase.

```mermaid
graph TB
    subgraph "Tool System"
        REGISTRY[Tool Registry]
        EXECUTOR[Tool Executor]
        CONTEXT[Execution Context]
    end
    
    subgraph "Built-in Tools"
        FILE[File Operations]
        GIT[Git Commands]
        SHELL[Shell Execution]
        LSP_TOOL[LSP Integration]
        SEARCH[Code Search]
    end
    
    subgraph "Plugin Tools"
        CUSTOM[Custom Tools]
        MCP_TOOLS[MCP Tools]
        EXTERNAL[External APIs]
    end
    
    REGISTRY --> EXECUTOR
    EXECUTOR --> CONTEXT
    
    REGISTRY --> FILE
    REGISTRY --> GIT
    REGISTRY --> SHELL
    REGISTRY --> LSP_TOOL
    REGISTRY --> SEARCH
    
    REGISTRY --> CUSTOM
    REGISTRY --> MCP_TOOLS
    REGISTRY --> EXTERNAL
```

### 3. Provider-Agnostic AI Integration

OpenCode supports multiple AI providers through a unified interface.

```mermaid
graph TB
    subgraph "AI Provider Layer"
        INTERFACE[Provider Interface]
        ROUTER[Provider Router]
        CONFIG[Provider Config]
    end
    
    subgraph "Supported Providers"
        ANTHROPIC[Anthropic<br/>Claude]
        OPENAI[OpenAI<br/>GPT Models]
        GOOGLE[Google<br/>Gemini]
        BEDROCK[AWS Bedrock]
        LOCAL[Local Models<br/>Ollama]
    end
    
    INTERFACE --> ROUTER
    ROUTER --> CONFIG
    
    ROUTER --> ANTHROPIC
    ROUTER --> OPENAI
    ROUTER --> GOOGLE
    ROUTER --> BEDROCK
    ROUTER --> LOCAL
```

## Data Flow

### Message Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant TUI
    participant Server
    participant Session
    participant Agent
    participant Provider
    participant Tools
    
    User->>TUI: Input Command/Message
    TUI->>Server: HTTP Request
    Server->>Session: Route to Session
    Session->>Session: Validate & Store Message
    
    Session->>Agent: Process Message
    Agent->>Agent: Analyze Request
    
    alt Tool Execution Required
        Agent->>Tools: Execute Tool
        Tools->>Tools: Perform Operation
        Tools-->>Agent: Tool Results
    end
    
    Agent->>Provider: Generate Response
    Provider-->>Agent: AI Response
    
    Agent->>Session: Update with Response
    Session->>Server: Stream Updates
    Server->>TUI: SSE/WebSocket Stream
    TUI->>User: Display Response
```

### File Operation Flow

```mermaid
sequenceDiagram
    participant Agent
    participant FileSystem
    participant Git
    participant LSP
    participant Session
    
    Agent->>FileSystem: Read/Write Files
    FileSystem-->>Agent: File Contents
    
    Agent->>Git: Check Status
    Git-->>Agent: Git Information
    
    Agent->>LSP: Request Symbols/Types
    LSP-->>Agent: Language Information
    
    Agent->>Session: Update Context
    Session->>Session: Store Changes
```

## Infrastructure

### Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        CDN[Cloudflare CDN]
        WORKERS[Cloudflare Workers]
        PAGES[Cloudflare Pages]
        KV[Cloudflare KV Storage]
    end
    
    subgraph "Development Environment"
        LOCAL[Local Development]
        SST_DEV[SST Dev Mode]
        TUNNELS[Dev Tunnels]
    end
    
    subgraph "External Services"
        AI_APIS[AI Provider APIs]
        GITHUB[GitHub Integration]
        AUTH_PROVIDERS[Auth Providers]
    end
    
    CDN --> PAGES
    CDN --> WORKERS
    WORKERS --> KV
    
    LOCAL --> SST_DEV
    SST_DEV --> TUNNELS
    
    WORKERS --> AI_APIS
    WORKERS --> GITHUB
    WORKERS --> AUTH_PROVIDERS
```

### Build and Deployment Pipeline

```mermaid
graph LR
    subgraph "Development"
        CODE[Source Code]
        LINT[ESLint/Prettier]
        TYPE[TypeScript Check]
        TEST[Tests]
    end
    
    subgraph "Build Process"
        BUN[Bun Build]
        BUNDLE[Bundle Assets]
        OPTIMIZE[Optimize]
    end
    
    subgraph "Deployment"
        SST[SST Deploy]
        CF_DEPLOY[Cloudflare Deploy]
        ASSETS[Asset Upload]
    end
    
    CODE --> LINT
    LINT --> TYPE
    TYPE --> TEST
    TEST --> BUN
    
    BUN --> BUNDLE
    BUNDLE --> OPTIMIZE
    OPTIMIZE --> SST
    
    SST --> CF_DEPLOY
    SST --> ASSETS
```

## Development Workflow

### Local Development Setup

```mermaid
graph TB
    subgraph "Prerequisites"
        BUN[Bun Runtime]
        GO[Go 1.24+]
        GIT[Git]
    end
    
    subgraph "Setup Steps"
        CLONE[Clone Repository]
        DEPS[Install Dependencies<br/>bun install]
        BUILD[Build Packages<br/>bun run build]
        DEV[Start Development<br/>bun dev]
    end
    
    subgraph "Development Tools"
        TYPECHECK[Type Checking<br/>bun run typecheck]
        LINT_TOOL[Linting<br/>prettier]
        TESTING[Testing<br/>bun test]
    end
    
    BUN --> CLONE
    GO --> CLONE
    GIT --> CLONE
    
    CLONE --> DEPS
    DEPS --> BUILD
    BUILD --> DEV
    
    DEV --> TYPECHECK
    DEV --> LINT_TOOL
    DEV --> TESTING
```

### Package Development Workflow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Core as opencode Core
    participant TUI as TUI Client
    participant Cloud as Cloud App
    participant SDK as SDK
    
    Dev->>Core: Make Changes
    Core->>Core: bun run typecheck
    Core->>Core: bun test
    
    alt API Changes
        Core->>SDK: Generate New SDK
        SDK->>TUI: Update Client
        SDK->>Cloud: Update Client
    end
    
    Dev->>Dev: Test Integration
    Dev->>Dev: Commit Changes
```

## API Structure

### REST API Endpoints

The server exposes a comprehensive REST API for all client interactions:

```mermaid
graph TB
    subgraph "Project Management"
        PROJ_LIST[GET /project]
        PROJ_INIT[POST /project/init]
    end
    
    subgraph "Session Management"
        SESS_LIST[GET /project/:id/session]
        SESS_CREATE[POST /project/:id/session]
        SESS_GET[GET /project/:id/session/:id]
        SESS_DELETE[DELETE /project/:id/session/:id]
    end
    
    subgraph "Message Handling"
        MSG_LIST[GET /project/:id/session/:id/message]
        MSG_CREATE[POST /project/:id/session/:id/message]
        MSG_GET[GET /project/:id/session/:id/message/:id]
    end
    
    subgraph "File Operations"
        FILE_FIND[GET /project/:id/session/:id/find/file]
        FILE_GET[GET /project/:id/session/:id/file]
        FILE_STATUS[GET /project/:id/session/:id/file/status]
    end
    
    subgraph "Utilities"
        LOG[POST /log]
        CONFIG[GET /config]
        PROVIDER[GET /provider]
    end
```

### WebSocket/SSE Streaming

Real-time communication for streaming responses and updates:

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Agent
    
    Client->>Server: Establish SSE Connection
    Client->>Server: Send Message Request
    
    Server->>Agent: Process Message
    loop Streaming Response
        Agent->>Server: Partial Response
        Server->>Client: SSE Event
    end
    
    Agent->>Server: Final Response
    Server->>Client: Complete Event
    Server->>Client: Close Stream
```

## Security & Authentication

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Auth as Auth Service
    participant Server
    participant Provider as AI Provider
    
    User->>Client: Login Request
    Client->>Auth: Authenticate
    Auth->>Auth: Validate Credentials
    Auth-->>Client: Access Token
    
    Client->>Server: API Request + Token
    Server->>Server: Validate Token
    Server->>Provider: AI Request
    Provider-->>Server: AI Response
    Server-->>Client: Response
```

### Permission System

```mermaid
graph TB
    subgraph "Permission Levels"
        READ[Read Access]
        WRITE[Write Access]
        EXECUTE[Execute Access]
        ADMIN[Admin Access]
    end
    
    subgraph "Resource Types"
        FILES[File System]
        GIT_OPS[Git Operations]
        SHELL_OPS[Shell Commands]
        NET[Network Access]
    end
    
    subgraph "Permission Context"
        PROJECT[Project Scope]
        SESSION[Session Scope]
        USER[User Scope]
    end
    
    READ --> FILES
    WRITE --> FILES
    EXECUTE --> SHELL_OPS
    ADMIN --> NET
    
    FILES --> PROJECT
    GIT_OPS --> PROJECT
    SHELL_OPS --> SESSION
    NET --> USER
```

---

## Key Technologies

- **Runtime**: Bun (TypeScript/JavaScript), Go
- **Frameworks**: Hono (API), SolidJS (Web), Cobra (CLI)
- **Infrastructure**: SST, Cloudflare Workers/Pages
- **AI Integration**: Multiple providers via unified interface
- **Communication**: REST API, Server-Sent Events, WebSocket
- **Storage**: Cloudflare KV, Local file system
- **Authentication**: OpenAuth
- **Build Tools**: Bun, Go toolchain, SST

This architecture provides a scalable, maintainable, and extensible foundation for AI-powered coding assistance across multiple platforms and environments.