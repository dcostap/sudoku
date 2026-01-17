export function determineFullscreenApi() {
    if (typeof document === 'undefined') return null;
    if (document.body.requestFullscreen) {
        return {
            ELEMENT_PROP_NAME: "fullscreenElement",
            ENTER_METHOD_NAME: "requestFullscreen",
            EXIT_METHOD_NAME: "exitFullscreen",
        }
    }
    else if (document.body.webkitRequestFullscreen) {
        return {
            ELEMENT_PROP_NAME: "webkitFullscreenElement",
            ENTER_METHOD_NAME: "webkitRequestFullscreen",
            EXIT_METHOD_NAME: "webkitExitFullscreen",
        }
    }
    else {
        return null;
    }
}

export const fsApi = determineFullscreenApi();

export function isFullscreen() {
    return fsApi && !!document[fsApi.ELEMENT_PROP_NAME];
}

export function toggleFullscreen() {
    if (!fsApi) return;
    if (isFullscreen()) {
        document[fsApi.EXIT_METHOD_NAME]();
    } else {
        document.body[fsApi.ENTER_METHOD_NAME]();
    }
}
