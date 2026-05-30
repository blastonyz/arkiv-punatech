<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

MemoryForge AI
Memoria evolutiva para agentes: las memorias que se usan sobreviven; las que no aportan valor
expiran en Arkiv.
Documento de implementacion para Arkiv x PunaTech
Objetivo
El producto toma el patron de memoria darwiniana, pero lo orienta a un MVP visual y simple: cada memoria nace con
TTL corto, una decision puede citarla y esa cita crea reinforcement. El usuario ve que la memoria util se extiende y la
memoria inutil desaparece.
Criterio rector: Arkiv debe ser la logica de estado, memoria, permisos, expiracion y auditoria del
producto; no una base de datos secundaria.
Supuestos de diseno
• El track objetivo es Aplicaciones de IA sobre Arkiv: memoria de IA propia, procedencia/auditoria y datos personales
para IA.
• La integracion con Arkiv pesa 40% de la evaluacion: schema, queries, ownership, relaciones, expiraciones y
features avanzadas.
• El MVP debe demostrar datos reales en Arkiv Braga testnet, no solo mocks de frontend.
• El README debe explicar por que Arkiv es necesario para el producto, no solo donde se guardan datos