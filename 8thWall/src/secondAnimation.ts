import * as ecs from '@8thwall/ecs'

// Funciones de suavizado (Easing)
const easeInQuad = (t) => t * t
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t)

// Función auxiliar para interpolación lineal (Lerp)
const lerp = (start, end, t) => start + (end - start) * t

// Mapa para almacenar el estado interno de cada entidad de forma segura
const stateMap = new Map()

ecs.registerComponent({
    name: 'Touch Move Animation Trigger',
    schema: {
        idleAnim: ecs.string,
        actionAnim: ecs.string,
        moveDuration: ecs.f32,
        holdDuration: ecs.f32,
        offsetX: ecs.f32,
        offsetY: ecs.f32,
        offsetZ: ecs.f32,
    },
    schemaDefaults: {
        idleAnim: 'Idle',
        actionAnim: 'Action',
        moveDuration: 1.0,
        holdDuration: 2.0,
        offsetX: 0.0,
        offsetY: 1.0,
        offsetZ: -2.0,
    },
    add: (world, component) => {
        const { eid, schema } = component

        // Inicializamos el estado interno mapeado al ID de esta entidad
        stateMap.set(eid, {
            status: 'IDLE',
            progressTimer: 0,
            startPos: { x: 0, y: 0, z: 0 },
            targetPos: { x: 0, y: 0, z: 0 },
        })

        const playAnim = (clipName) => {
            if (ecs.GltfModel.has(world, eid)) {
                ecs.GltfModel.mutate(world, eid, (cursor) => {
                    cursor.animationClip = clipName
                    cursor.crossFadeDuration = 0.3
                })
            }
        }

        playAnim(schema.idleAnim)

        // Evento de toque (Requiere Collider en la entidad)
        world.events.addListener(eid, ecs.input.SCREEN_TOUCH_START, () => {
            const state = stateMap.get(eid)
            if (!state || state.status !== 'IDLE') return

            if (ecs.Position.has(world, eid)) {
                const currentPos = ecs.Position.get(world, eid)
                state.startPos = { x: currentPos.x, y: currentPos.y, z: currentPos.z }
                state.targetPos = {
                    x: currentPos.x + schema.offsetX,
                    y: currentPos.y + schema.offsetY,
                    z: currentPos.z + schema.offsetZ,
                }
            }

            playAnim(schema.actionAnim)
            state.status = 'MOVING_TO_TARGET'
            state.progressTimer = 0
        })
    },

    tick: (world, component) => {
        const { eid, schema } = component
        const state = stateMap.get(eid)

        if (!state || state.status === 'IDLE' || !ecs.Position.has(world, eid)) return

        const dt = world.time.delta / 1000
        state.progressTimer += dt

        // 1. Desplazamiento hacia la posición objetivo (Ease-In)
        if (state.status === 'MOVING_TO_TARGET') {
            const t = Math.min(1.0, state.progressTimer / schema.moveDuration)
            const easedT = easeInQuad(t)

            ecs.Position.mutate(world, eid, (cursor) => {
                cursor.x = lerp(state.startPos.x, state.targetPos.x, easedT)
                cursor.y = lerp(state.startPos.y, state.targetPos.y, easedT)
                cursor.z = lerp(state.startPos.z, state.targetPos.z, easedT)
            })

            if (t >= 1.0) {
                state.status = 'HOLDING'
                state.progressTimer = 0
            }
        }

        // 2. Tiempo en posición objetivo
        else if (state.status === 'HOLDING') {
            if (state.progressTimer >= schema.holdDuration) {
                if (ecs.GltfModel.has(world, eid)) {
                    ecs.GltfModel.mutate(world, eid, (cursor) => {
                        cursor.animationClip = schema.idleAnim
                        cursor.crossFadeDuration = 0.3
                    })
                }
                state.status = 'MOVING_TO_ORIGIN'
                state.progressTimer = 0
            }
        }

        // 3. Regreso a la posición inicial (Ease-Out)
        else if (state.status === 'MOVING_TO_ORIGIN') {
            const t = Math.min(1.0, state.progressTimer / schema.moveDuration)
            const easedT = easeOutQuad(t)

            ecs.Position.mutate(world, eid, (cursor) => {
                cursor.x = lerp(state.targetPos.x, state.startPos.x, easedT)
                cursor.y = lerp(state.targetPos.y, state.startPos.y, easedT)
                cursor.z = lerp(state.targetPos.z, state.startPos.z, easedT)
            })

            if (t >= 1.0) {
                state.status = 'IDLE'
                state.progressTimer = 0
            }
        }
    },

    remove: (world, component) => {
        // Limpieza de memoria si la entidad es eliminada del mundo
        stateMap.delete(component.eid)
    },
})