import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
    name: 'Toggle Video Play',
    schema: {
        // Select the entity containing the Video / VideoControls component in Studio
        videoEntity: ecs.eid,
    },
    add: (world, component) => {
        const { eid, schema } = component

        // Listen for touch/click events on this button entity
        world.events.addListener(eid, ecs.input.SCREEN_TOUCH_START, () => {
            // Fallback to self if no videoEntity was selected in the Inspector
            const targetEntity = schema.videoEntity || eid

            // Verify the target entity has the VideoControls component
            if (ecs.VideoControls.has(world, targetEntity)) {
                // Mutate the videoControls state directly
                ecs.VideoControls.mutate(world, targetEntity, (cursor) => {
                    cursor.paused = !cursor.paused
                })
            }
        })
    },
})