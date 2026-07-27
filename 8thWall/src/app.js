const onxrloaded = () => {
    XR8.XrController.configure({
        imageTargetData: [
            require('../image-targets/Tarjeta.json')
        ],
    })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)