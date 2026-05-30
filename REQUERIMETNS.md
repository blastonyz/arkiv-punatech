## Track: Aplicaciones de IA sobre [ ARKIV ]
[](https://github.com/Arkiv-Network/arkiv-puna-tech-hackathon#track-aplicaciones-de-ia-sobre--arkiv-)
Construí aplicaciones de IA que usen [ ARKIV ] como capa de datos. Tres verticales para orientarte (aunque no son las únicas):

- **Memoria de IA que es tuya** — memoria de agentes, historial de chat portable, contexto a prueba de manipulación que sobrevive entre apps.
- **Procedencia y auditoría de IA** — registros consultables y a prueba de manipulación de lo que un modelo dijo o hizo (útil para periodismo, compliance, debate).
- **Capas de datos personales para IA** — perfiles y preferencias propiedad del usuario que cualquier app de IA puede leer con permiso explícito.

¿Tu idea no encaja exacto en estas tres? Si combina IA con [ ARKIV ] como capa de datos, queremos verla
¿Qué vas a construir?
Una aplicación Web3 donde todos los datos viven en [ ARKIV ]. Los usuarios son dueños de sus propios datos — no la plataforma.

El track es Aplicaciones de IA sobre [ ARKIV ]. La idea es simple: reemplazás las capas de datos centralizadas que usan los agentes de IA y las apps de IA por [ ARKIV ] — una base de datos Web3 alineada con Ethereum.

Tres verticales de ejemplo para orientarte (pero no son las únicas):

Vertical	De qué se trata
Memoria de IA que es tuya	Agentes de IA que almacenan su contexto y memoria en [ ARKIV ] — datos que le pertenecen al usuario, no a la plataforma
Procedencia y auditoría de IA	Registros a prueba de manipulación de decisiones, outputs o cadenas de razonamiento de modelos de IA
Capas de datos personales para IA	Perfiles, preferencias o historial controlados por el usuario que las apps de IA leen con permiso
¿Tenés otra idea con IA y datos? Si usa [ ARKIV ] como capa de datos, vale.

Construí lo que te entusiasme.

Cómo funciona [ ARKIV ] (modelo mental en 60 segundos)
1. Entidades = payload + atributos tipados + expiresIn
Cada entidad de [ ARKIV ] tiene:

Payload — el dato en sí (JSON, texto o bytes). Se almacena tal cual.
Atributos — pares clave-valor tipados. Este es tu índice. Todos los filtros, ordenamientos y búsquedas se hacen sobre atributos, no sobre el payload.
expiresIn — una duración en segundos que se define al crear la entidad.
2. Los atributos tienen tipos — elegí bien
Atributos de texto soportan igualdad y matching con glob (~). Usalos para etiquetas, estados, nombres, identificadores.
Atributos numéricos soportan rangos (gt, lt, gte, lte). Usalos para cualquier valor que vayas a filtrar o ordenar por rango — timestamps, scores, contadores.
Si guardás priority como el string "5", perdés las consultas de rango. Siempre almacená numéricos como números.

3. Las relaciones son atributos compartidos
No hay un campo de foreign key incorporado. Para vincular entidades, usá una clave de atributo compartida con el entity key del padre como valor (p. ej., { key: "agentKey", value: agentEntityKey }). Consultar los hijos de un padre es entonces un único where(eq(...)).

4. Dos campos de metadatos importantes: $owner y $creator
$owner — la wallet que controla la entidad. Es mutable. Solo el owner puede actualizar o eliminar.
$creator — la wallet que creó la entidad originalmente. Inmutable — no se puede falsificar.
Buena práctica: PROJECT_ATTRIBUTE
[ ARKIV ] es una base de datos pública y compartida. Todas las entidades de todos los proyectos viven en el mismo store. Sin un namespace de proyecto, tus queries devuelven datos de todo el mundo.

Todo proyecto en [ ARKIV ] debe:

Definir una constante PROJECT_ATTRIBUTE única (p. ej., en lib/arkiv.ts).
Estamparla en cada llamada de creación y actualización.
Filtrar por ella en cada query.
// lib/arkiv.ts
export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "miequipo-arkiv-punatech26-7x9k",  // único globalmente para tu proyecto
} as const;
Esto se evalúa. No te lo saltés.

Una nota sobre la expiración
Todas las entidades de [ ARKIV ] tienen fechas de expiración — esto es central en cómo funciona [ ARKIV ], no una feature opcional. En testnet, la expiración no tiene implicaciones de costo. En mainnet, las entidades de vida más corta son más baratas. Elegí las fechas de expiración con criterio: distintos tipos de entidades deberían tener duraciones distintas que reflejen lógica de producto real. Esa intencionalidad es lo que suma puntos en la evaluación de integración con [ ARKIV ].

⚠️ KYC obligatorio para cobrar el premio
Para recibir el pago del premio, todos los integrantes del equipo ganador deben completar el proceso de KYC (verificación de identidad). Sin KYC completado, el pago no puede procesarse.

Premios
Posición	Premio
1° lugar	USDC 600
2° lugar	USDC 450
3° lugar	USDC 300
4° lugar	USDC 150
Los premios se pagan en USDC. El KYC es obligatorio para todos los integrantes del equipo que cobren el premio.

Consejo de diseño
Design & UX es el 20% del puntaje — llegá a un kit de componentes open source como shadcn/ui (también podés considerar Tailwind UI, Radix o daisyUI) para entregar una interfaz pulida más rápido y dedicar más tiempo a la integración con [ ARKIV ] (40%).

Uso de la marca Arkiv
Podés mencionar a [ ARKIV ] para acreditar la tecnología que usaste — eso está bien y se alienta.

Lo que no está permitido es usar la marca, el nombre o los logos de Arkiv / [ ARKIV ] de forma que implique respaldo oficial, patrocinio o asociación, a menos que operes bajo un acuerdo firmado.

Para empezar
Elegí tu idea dentro del track de IA sobre [ ARKIV ]

Leé la documentación de [ ARKIV ] — docs.arkiv.network

Instalá el agent skill de [ ARKIV ] — docs/agent-skill.md — carga el conocimiento del SDK en tu asistente de IA para que entienda [ ARKIV ] desde el primer prompt

Conectate al Testnet de [ ARKIV ]:

Configuración	Valor
Network ID	60138453102
RPC (HTTP)	https://braga.hoodi.arkiv.network/rpc
RPC (WebSocket)	wss://braga.hoodi.arkiv.network/rpc/ws
Bridge contract	0xB52b417A79c9dE21ffe221dF9a3821B7EaC60813
Faucet	https://braga.hoodi.arkiv.network/faucet/
Instalá el SDK:

npm install @arkiv-network/sdk@0.6.8  # o superior
Hacé funcionar crear + leer + consultar para un tipo de entidad primero — después agregás relaciones y más tipos

Entrega
Fecha límite: sábado 30 de mayo, 2:00 PM (hora Argentina)

Entregable	Detalle
Repo GitHub	Público, open source, README con instrucciones de setup. Todos los integrantes del equipo deben figurar como colaboradores.
Video demo	Público (YouTube o Google Drive). Walkthrough de 2–3 minutos.
Formulario	Completá el formulario en https://forms.arkiv.network/punatech26
Pitch	En español, el día del evento
Info del equipo	Nombres, handles de GitHub, wallet address para el premio