import WebGL from 'three/addons/capabilities/WebGL.js';
import { RenderScene } from './src/Contents'

if (WebGL.isWebGLAvailable()) {
    RenderScene();
} else {
    const warning = WebGL.getWebGLErrorMessage();
    document.body.appendChild( warning );
}