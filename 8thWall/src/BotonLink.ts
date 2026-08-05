import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
    name: 'Open Link',
    schema: {
        // Campo de texto en el editor para ingresar la URL deseada
        url: ecs.string,
    },
    schemaDefaults: {
        url: 'https://8thwall.com',
    },
    add: (world, component) => {
        const { eid, schema } = component

        // Escucha el toque/clic en la entidad botón
        world.events.addListener(eid, ecs.input.SCREEN_TOUCH_START, () => {
            // Verifica que exista una URL válida configurada
            if (schema.url && schema.url.trim() !== '') {
                // Abre la URL en una pestaña nueva
                window.open(schema.url, '_blank', 'noopener,noreferrer')
            }
        })
    },
})