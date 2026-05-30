# MemoryForge AI

> Agente de IA con memoria evolutiva on-chain sobre la red **Arkiv** — PunaTech 2026

---

## ¿Qué es?

MemoryForge AI es un sistema de memoria persistente para agentes de inteligencia artificial. En lugar de perder contexto entre sesiones, cada conversación queda grabada on-chain en Arkiv con ciclo de vida completo:

- **Creación**: un hecho se guarda como `memoryEntry` con TTL inicial
- **Refuerzo**: si el usuario valida una respuesta, la memoria gana score y extiende su vida
- **Decaimiento**: memorias no citadas pierden relevancia con el tiempo
- **Promoción**: las memorias más útiles escalan de scope (`entity` → `global`)

---

## Características principales

| Feature | Descripción |
|---|---|
| **Dual-Agent** | Dos respuestas en paralelo: temp 0.2 (preciso) y temp 0.9 (creativo) |
| **Memoria semántica** | Embeddings via Gemini `text-embedding-004` + reranking cosine similarity |
| **Historial desde Arkiv** | Las sesiones se reconstruyen on-chain entre recargas de página |
| **Auto-extracción de hechos** | Gemini extrae automáticamente hechos memorables de cada conversación |
| **Feedback loop** | El usuario elige la mejor respuesta → refuerza memorias citadas en Arkiv |
| **Auditoría con hash-chain** | Cada decisión genera un snapshot con hash encadenado (commitHash) |

---

## Stack

- **Frontend**: Next.js 15 + Tailwind CSS v4
- **LLM**: Gemini 2.0 Flash via AI Studio (`text-embedding-004` para embeddings)
- **Memoria on-chain**: @arkiv-network/sdk en Braga testnet
- **Red**: Braga Testnet — `https://braga.hoodi.arkiv.network/rpc`

---

## Setup

```bash
# 1. Clonar
git clone <repo-url>
cd arkiv-front

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Completar con tus claves (ver abajo)

# 4. Correr en dev
npm run dev
```

### Variables de entorno (`.env`)

```env
BRAGA_PK=<tu_private_key_hex>
BRAGA_RPC_URL=https://braga.hoodi.arkiv.network/rpc
GEMINI_API_KEY=<tu_api_key_de_ai_studio>
```

Obtén tu API key en [Google AI Studio](https://aistudio.google.com/).

---

## Estructura del proyecto

```
app/
  page.tsx              # Landing
  agent/page.tsx        # Interfaz del agente
  api/
    chat/route.ts       # Endpoint principal — orquesta todo el flujo
    memories/route.ts   # GET/POST memorias activas
    feedback/route.ts   # Refuerzo de memorias via feedback humano
    audit/route.ts      # Cadena de auditoría por sesión
lib/
  agent/vertex.ts       # Cliente Gemini (generación + embeddings + extractFacts)
  arkiv/                # SDK wrappers: client, entities, repo
  audit/hashchain.ts    # SHA-256 hash-chain para auditoría
  memory/               # lifecycle, retrieval, scoring, historial
components/
  AgentChat.tsx         # UI de chat con dual-cards + feedback
  MemoryInspector.tsx   # Panel lateral de memorias activas
```

---

## Flujo de una conversación

```
Usuario envía mensaje
       ↓
Búsqueda semántica en memorias activas (Arkiv)
       ↓
Reconstrucción del historial de sesión (Arkiv)
       ↓
Dual-agent: preciso (0.2) + creativo (0.9) en paralelo
       ↓
Respuestas mostradas en pantalla
       ↓
[async] Auto-extracción de hechos → guardados como memoryEntry en Arkiv
[async] AuditSnapshot con hash-chain
       ↓
Usuario elige la mejor respuesta → refuerza memorias citadas
```

---

## Equipo

- **Blas** — Smart contracts, arquitectura Arkiv, integración LLM

---

## Hackathon

Proyecto presentado en **PunaTech 2026** — categoría IA + Web3.

Powered by [Arkiv Network](https://arkiv.network) + [Google AI Studio](https://aistudio.google.com/).
