MemoryForge AI
Memoria evolutiva y verificable para agentes de IA sobre Arkiv
Documento tecnico para PunaTech x Arkiv - version en espanol
Campo
Definicion
One-liner
MemoryForge AI permite que un agente de IA tenga 
memoria propia, verificable y evolutiva: cada memoria nace 
con expiracion, sobrevive si se usa en decisiones y queda 
auditada en Arkiv.
Tesis
La memoria de un agente no debe vivir para siempre por 
defecto. Debe sobrevivir cuando demuestra utilidad y debe 
expirar si no aporta valor.
Track
Aplicaciones de IA sobre Arkiv: memoria de IA propia, 
procedencia/auditoria de IA y capas de datos personales para 
IA.
Diferencial
Arkiv no es storage auxiliar. Arkiv es el mecanismo de 
estado, ownership, expiracion, prueba y aprendizaje del 
sistema.
Version orientada a competir con profundidad tecnica similar a proyectos como ark-hive y Cortex, pero con una propuesta 
propia: lifecycle de memoria evolutiva para agentes.
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
1. Resumen ejecutivo
MemoryForge AI es una aplicacion Web3 para agentes de IA donde la memoria, las decisiones, las citas y las reglas 
de refuerzo viven como entidades en Arkiv. El usuario controla los datos; el agente puede recordar, citar y 
reforzar informacion, pero cada paso queda trazado.
 Cada memoria nace como una entidad con TTL corto y atributos indexables.
 Cuando una memoria es usada por una decision del agente, se crea una citation entity.
 Si una memoria genera valor, el sistema crea reinforcementEvent y extiende su vida util.
 Si una memoria no se usa, expira naturalmente y deja un decayEvent opcional para auditoria.
 El usuario puede compartir memoria mediante accessGrant temporal, sin transferir control permanente.
 El flujo completo queda anclado en auditSnapshot con hash-chain para detectar manipulacion.
Pregunta Respuesta de producto
Que problema resuelve? Los agentes actuales guardan memoria en bases privadas, 
opacas y permanentes.
Que aporta Arkiv? Entidades publicas, ownership por wallet, atributos 
consultables, expiracion nativa y evidencia verificable.
Que ve el juez? Un agente que aprende una memoria, la usa en una decision, 
la refuerza, deja evidencia y muestra el grafo vivo.
Que no es? No es fine-tuning, no es un chatbot generico y no es un 
vector DB centralizado.
2. Encaje con el track de PunaTech x Arkiv
Vertical Como la cubre MemoryForge AI
Memoria de IA que es tuya La memoria del agente se escribe en Arkiv bajo ownership 
del usuario o de su wallet de agente.
Procedencia y auditoria de IA Cada decision registra las memorias citadas, input, output, 
hash y snapshot.
Capas de datos personales para IA El usuario puede exponer preferencias o contexto via 
accessGrant temporal.
Datos sobre Arkiv Las entidades principales viven en Arkiv; cualquier cache 
local es secundaria y reconstruible.
Criterio rector: si Arkiv se apaga, el producto pierde su memoria verificable. Esa dependencia es intencional y es 
la diferencia frente a una app de IA comun.
3. Arquitectura Arkiv-native
Usuario / Wallet
  -> Frontend Next.js
  -> Agent Runtime
      -> LLM provider para razonamiento
      -> MemoryForge Engine para memoria y scoring
  -> Arkiv Braga Testnet
      -> agentProfile, session, memoryEntry, decision, citation,
         reinforcementEvent, decayEvent, accessGrant, auditSnapshot
  -> Visualizador
      -> timeline + grafo de memoria + explorer links
Capa Responsabilidad
Frontend Crear agente, iniciar sesion, escribir prompts, revisar 
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
memorias, ver grafo y timeline.
Agent Runtime Orquesta prompts, consulta memoria relevante, genera 
decision y registra evidencia.
MemoryForge Engine Calcula relevancia, utilidad, refuerzo, expiracion sugerida y 
estados.
Arkiv SDK Crea, actualiza, consulta y extiende entidades con 
PROJECT_ATTRIBUTE y atributos tipados.
LLM Provider Genera respuestas y summaries. No es fuente de verdad del 
estado.
Visualizador Muestra la memoria viva: que se usa, que se refuerza y que 
expira.
4. Modelo mental del producto
1. El usuario crea un agente o selecciona uno existente.
2. El agente recibe una instruccion y genera una sesion en Arkiv.
3. El usuario ensena una preferencia o dato de contexto. Se crea memoryEntry con TTL inicial.
4. El agente toma una decision y cita una o mas memorias. Se crea citation.
5. El motor calcula utilidad. Si la memoria ayudo, crea reinforcementEvent y extiende TTL.
6. La decision se registra con las citas y un auditSnapshot hash-chain.
7. En una segunda sesion, el agente recupera solo memorias vigentes y relevantes.
8. Si una memoria no es usada, expira y deja de aparecer en queries.
5. Schema completo de entidades en Arkiv
Entidad Proposito TTL inicial
agentProfile Identidad y configuracion del agente. 365 dias
userProfile Preferencias del usuario, opcional y 
controlado. 365 dias
session Raiz de una conversacion o ejecucion. 12 horas
message Turno individual usuario/agente. 12 horas
memoryEntry Memoria reusable con scope, 
importancia y estado. 1h / 7d / 365d segun tipo
decision Accion o respuesta final del agente. 90 dias
citation Prueba de que una memoria fue usada 
en una decision. 180 dias
reinforcementEvent Evento que justifica extender o 
promover una memoria. 180 dias
decayEvent Registro opcional de memoria no usada 
o expirada. 90 dias
accessGrant Permiso temporal para leer memoria o 
decision. 1h / 24h / 7d
auditSnapshot Hash-chain del estado de la sesion o 
decision. 365 dias
6. Atributos, namespace y convenciones
Todas las entidades deben llevar PROJECT_ATTRIBUTE. Arkiv es un store publico compartido; sin namespace, las 
queries podrian mezclar datos de otros proyectos.
export const PROJECT_ATTRIBUTE = {
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
  key: "project",
  value: "memoryforge-ai-punatech26"
} as const;
Convenciones obligatorias:
 entityType siempre presente y consultable por eq.
 agentId y userId como foreign keys logicas.
 timestamps como numeros epoch ms para range queries.
 importanceScore, utilityScore y citationCount como numeros enteros.
 scope como string: run, entity, global o shared.
 status como string: active, reinforced, stale, expired, deprecated.
 payload JSON para contenido; atributos para indexar y filtrar.
7. Schema por entidad y atributos minimos
Entidad Atributos indexables minimos
agentProfile project, entityType, agentId, owner, status, createdAt, 
updatedAt
session project, entityType, sessionId, agentId, userId, startedAt, 
lastActivityAt, status
message project, entityType, sessionId, agentId, role, seq, createdAt
memoryEntry
project, entityType, memoryId, agentId, userId, scope, 
memoryType, status, importanceScore, utilityScore, 
citationCount, createdAt, lastUsedAt
decision project, entityType, decisionId, sessionId, agentId, userId, 
decisionType, riskLevel, createdAt
citation project, entityType, citationId, memoryId, decisionId, 
agentId, citationScore, createdAt
reinforcementEvent project, entityType, memoryId, decisionId, reason, 
deltaScore, newStatus, createdAt
decayEvent project, entityType, memoryId, reason, previousStatus, 
createdAt
accessGrant project, entityType, grantId, resourceKey, granteeAddress, 
expiresAt, status, createdAt
auditSnapshot project, entityType, snapshotId, sessionId, prevHash, 
commitHash, commitSeq, createdAt
8. Lifecycle de memoria evolutiva
Fase Estado Accion Arkiv
Creacion active createEntity(memoryEntry) con TTL 
corto y atributos iniciales.
Uso active createEntity(citation) vinculando 
memoryId y decisionId.
Refuerzo reinforced createEntity(reinforcementEvent) y 
extendEntity(memoryEntry).
Promocion global crear nueva memoryEntry con scope 
mas amplio o actualizar atributos.
Decaimiento stale si no hay citas recientes, marcar como 
candidata a expirar.
Expiracion expired
la entidad deja de aparecer por TTL; 
decayEvent opcional preserva el 
motivo.
Regla simple de refuerzo MVP:
utilityScore = citationScore + humanFeedback + recencyBoost - contradictionPenalty
Si utilityScore >= 80:
extender memoria 7 dias
Si citationCount >= 3 y feedback humano positivo:
promover de run -> entity o entity -> global
Si no se usa antes de expirar:
dejar que Arkiv la omita naturalmente de las queries
9. Motor de refuerzo y scoring
Variable
Descripcion
citationScore
Valor de 0 a 100 segun cuanto aporto la memoria a la 
decision.
humanFeedback
+20 confirmado, 0 sin revisar, -40 marcado como incorrecto.
recencyBoost
Confianza del LLM en la recuperacion; nunca suficiente sin 
trazabilidad.
contradictionPenalty
Aumenta si la memoria fue usada recientemente.
Penaliza si entra en conflicto con una memoria mas reciente 
o validada.
confidence
El scoring debe ser transparente: cada reinforcementEvent guarda el motivo, el delta aplicado y la decision que 
justifico el refuerzo. No se actualiza memoria en silencio.
10. Query patterns necesarios para la demo
// Memorias activas de un agente
where(eq("project", PROJECT_VALUE))
where(eq("entityType", "memoryEntry"))
where(eq("agentId", agentId))
where(eq("status", "active"))
// Memorias por scope
where(eq("scope", "entity"))
where(eq("userId", userAddress))
// Historial de una decision
where(eq("entityType", "citation"))
where(eq("decisionId", decisionId))
// Reglas reforzadas recientemente
where(eq("entityType", "reinforcementEvent"))
where(gt("createdAt", since))
// Snapshot chain de una sesion
where(eq("entityType", "auditSnapshot"))
where(eq("sessionId", sessionId))
// ordenar por commitSeq en cliente
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
11. Audit snapshots y hash-chain
Cada decision relevante debe generar un snapshot. El objetivo es demostrar que el historial no fue reescrito 
despues de la decision.
payload = {
sessionId,
decisionId,
inputHash,
outputHash,
citedMemoryIds,
timestamp
}
commitHash = sha256(prevHash + JSON.stringify(payload))
createEntity(auditSnapshot, {
prevHash,
commitHash,
commitSeq,
sessionId,
decisionId
})
12. Ownership, privacidad y access grants





Para el MVP, usar wallet del usuario con Privy o Dynamic para firmar escrituras cuando sea posible.
Si se usa backend wallet por simplicidad, explicitar que es demo y mantener creator/owner claro.
Los accessGrant permiten compartir una memoria, decision o sesion con otra wallet por tiempo limitado.
Los payloads sensibles pueden cifrarse antes de enviarse a Arkiv; Arkiv guarda metadata consultable y 
ciphertext.
Las grants expiran naturalmente, lo que evita listas manuales de revocacion para el demo.
AccessGrant atributo
Uso
resourceKey
Entidad protegida: memoryEntry, decision o session.
granteeAddress
Wallet que puede acceder.
expiresAt
Timestamp numerico consultable.
grantScope
read-memory, read-decision, read-session.
status
active, revoked, expired.
13. Implementacion tecnica recomendada
Modulo
Tecnologia
Frontend
Next.js, TypeScript, Tailwind, shadcn/ui.
Wallet
Privy o Dynamic para embedded wallet y signing UX.
Arkiv
LocalStorage o SQLite/Supabase solo como cache 
reconstruible.
@arkiv-network/sdk, Braga testnet, PROJECT_ATTRIBUTE 
global.
LLM
OpenAI, Claude o Gemini para reasoning; salida JSON 
estructurada.
Embeddings opcionales
Solo si hay tiempo; para MVP se puede usar tags + scoring 
textual.
Visualizador
React Flow o D3 para grafo memory -> citation -> decision.
Cache opcional
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
/lib/arkiv/project.ts       
PROJECT_ATTRIBUTE
/lib/arkiv/client.ts        
/lib/arkiv/entities.ts      
/lib/arkiv/repo.ts          
wallet/public client
builders de atributos
create/query/update/extend helpers
/lib/memory/scoring.ts      
utilityScore y reglas de refuerzo
/lib/memory/retrieval.ts    recuperacion por scope y query
/lib/audit/hashchain.ts     commitHash y snapshots
/app/agent                  
UI del agente
/app/memory                 
/app/graph                  
memoria viva
visualizador de entidades
14. Alcance MVP
Incluido
No incluido
Crear agente y sesion.
Fine-tuning de modelos.
Guardar memoria con TTL.
Vector DB externa como fuente de verdad.
Citar memoria en una decision.
Entrenamiento de LLM.
Refuerzo y extension de TTL.
Privacidad criptografica avanzada obligatoria.
Grafo y timeline de memoria.
Marketplace de agentes.
AccessGrant basico.
15. Sprints detallados
Multi-chain complejo.
Sprint
Objetivo
Entregables
Sprint 0 - Setup
Repo, stack base y entorno Arkiv.
Next.js, Arkiv SDK, wallet, 
faucet, .env.example, README inicial.
Sprint 1 - Schema Arkiv
Crear entidades base y queries.
agentProfile, session, memoryEntry, 
decision, citation; 
PROJECT_ATTRIBUTE; explorer interno.
Sprint 2 - Agente + memoria
El agente escribe y recupera memoria.
accessGrant temporal, grafo visual, 
seed demo, video script.
Chat simple, guardar memoryEntry, 
recuperar por agentId/scope/status, 
mostrar memoria activa.
Sprint 3 - Decision + citation
Cada decision cita memorias usadas.
decision entity, citation entity, timeline 
decision -> memory.
Sprint 4 - Reinforcement
Memorias utiles sobreviven.
utilityScore, reinforcementEvent, 
extendEntity, status reinforced.
Sprint 5 - Audit hash-chain
Trazabilidad verificable.
auditSnapshot, prevHash, commitHash, 
vista de cadena.
Sprint 6 - Grants + UX
Compartir memoria y pulir demo.
16. Tareas por sprint
Sprint 0 - Setup tecnico





Crear repo memoryforge-ai-arkiv.
Instalar Next.js, Tailwind, shadcn/ui y @arkiv-network/sdk.
Configurar Braga RPC y faucet.
Crear .env.example con variables de wallet, RPC y provider de IA.
Definir README con tesis, demo y arquitectura.
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
Sprint 1 - Arkiv schema y repo layer





Implementar PROJECT_ATTRIBUTE unico.
Crear builders de atributos por entidad.
Implementar createEntity, queryByProject, updateEntity y extendEntity wrappers.
Crear script smoke:arkiv que escriba y lea memoryEntry.
Agregar docs/schema.md con tabla de entidades y TTL.
Sprint 2 - Memoria y agente





Crear UI de agente con prompt input.
Guardar cada instruccion relevante como memoryEntry.
Agregar scope run/entity/global.
Recuperar memorias activas antes de responder.
Mostrar panel Memory Inspector.
Sprint 3 - Decision provenance





Crear decision con inputHash y outputHash.
Detectar memorias usadas y crear citation.
Relacionar citation con memoryId y decisionId.
UI de timeline para decision -> citations -> memory entries.
Validar que las queries se filtren por project + agentId.
Sprint 4 - Reinforcement Engine





Implementar scoring utilityScore.
Crear reinforcementEvent cuando una memoria supera umbral.
Ejecutar extendEntity para ampliar TTL.
Promover memoria de run a entity/global si se cita varias veces.
Registrar motivo legible para el juez.
Sprint 5 - Auditoria y hash-chain





Crear auditSnapshot por decision.
Implementar computeCommitHash(prevHash, payload).
Mostrar cadena de snapshots en UI.
Abrir links a Arkiv Explorer si estan disponibles.
Agregar script smoke:audit.
Sprint 6 - Demo y polish





Crear seed de dos sesiones y varias memorias.
Agregar grafo con nodos: memory, citation, decision, reinforcement.
Agregar accessGrant temporal basico.
Escribir video-demo.md de 3 minutos.
Completar README con rubric map y evidencia.
17. Plan tactico de 48 horas
Bloque
Horas
Resultado esperado
Arquitectura y repo
0-4
Repo funcional, README, 
PROJECT_ATTRIBUTE y entorno Arkiv.
Schema + smoke tests
4-12
Crear y consultar 
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
memoryEntry/session/decision en 
Arkiv.
UI agente 12-20 Chat simple con memoria activa.
Citations + decisions 20-28 Cada decision cita memorias.
Reinforcement 28-34 Memoria citada se extiende y registra 
evento.
Hash-chain + graph 34-42 Snapshot auditado y visualizador.
Demo + video + docs 42-48 Seed, README final, video script, 
checklist.
18. Demo script de 3 minutos
Tiempo Accion Mensaje
0:00-0:20 Problema
Los agentes recuerdan en bases 
privadas. El usuario no controla ni 
audita esa memoria.
0:20-0:45 Crear agente y memoria Creo una memoria con TTL: nace viva, 
pero no permanente.
0:45-1:15 Decision El agente toma una decision y cita la 
memoria usada.
1:15-1:45 Refuerzo
Como la memoria fue util, Arkiv 
registra reinforcementEvent y extiende 
su vida.
1:45-2:15 Segunda sesion El agente recupera solo memorias 
vigentes y relevantes.
2:15-2:40 Grafo Se ve memory -> citation -> decision -> 
reinforcement.
2:40-3:00 Cierre La IA razona, pero Arkiv recuerda, 
prueba y expira.
19. Rubric map para jueces
Criterio Evidencia en MemoryForge AI
Arkiv integration depth Schema multi-entidad, PROJECT_ATTRIBUTE, queries 
filtradas, TTL diferenciado, extendEntity y hash-chain.
Functionality Crear agente, guardar memoria, tomar decision, citar, 
reforzar, ver grafo y compartir.
Design & UX Memory graph, timeline, estados claros: active, reinforced, 
stale, expired.
Code quality Repo modular, docs/schema.md, scripts smoke, README con 
demo y .env.example.
20. Riesgos y mitigaciones
Riesgo Mitigacion
Scope demasiado amplio No hacer marketplace, pagos ni entrenamiento. Solo 
memoria evolutiva.
Arkiv queda como storage La logica de refuerzo, expiracion y auditoria debe depender 
de Arkiv.
Wallet UX compleja Usar embedded wallet o backend wallet solo para demo, 
explicando limitacion.
LLM output inestable Usar JSON schema estricto y seeds de demo.
MemoryForge AI - Documento tecnico en espanol para PunaTech x Arkiv
Queries lentas o ambiguas Atributos tipados, PROJECT_ATTRIBUTE y filtros por 
agentId/scope/status.
Privacidad incompleta Para MVP usar grants y opcion de payload cifrado; no 
prometer privacidad total si no esta implementada.
21. Estructura de repo sugerida
memoryforge-ai-arkiv/
  app/
    agent/
    memory/
    graph/
    api/
  components/
    MemoryGraph.tsx
    Timeline.tsx
    MemoryInspector.tsx
  lib/
    arkiv/
      project.ts
      client.ts
      entities.ts
      repo.ts
      queries.ts
    memory/
      scoring.ts
      retrieval.ts
      lifecycle.ts
    audit/
      hashchain.ts
  scripts/
    smoke-arkiv.ts
    seed-demo.ts
  docs/
    schema.md
    architecture.md
    video-demo.md
  README.md
  .env.example
22. Definition of Done
 El repo corre localmente con instrucciones claras.
 Existe al menos una escritura real en Arkiv para cada entidad clave.
 El README explica por que Arkiv es core, no storage auxiliar.
 La demo muestra una memoria que se crea, se cita y se refuerza.
 El visualizador muestra relaciones entre entidades.
 Hay links, hashes o keys que demuestran trazabilidad.
 Los sprints y decisiones tecnicas estan documentados.
23. Cierre estrategico
Frase de cierre para pitch: MemoryForge AI convierte la memoria de los agentes en una capa verificable: la IA 
decide, Arkiv recuerda, el usuario controla y las memorias sobreviven solo si demuestran utilidad.
La prioridad tecnica es que cada parte importante del producto use Arkiv de forma verificable: schema, atributos, 
relationships, expiraciones, ownership, access grants, citations, reinforcement y audit snapshots.
MemoryForge AI - Documento tecnico en e