import WebGL from 'three/addons/capabilities/WebGL.js';
import { RenderScene } from './pkg/main_contents'
import { SpeedInsights } from "@vercel/speed-insights/next"

if (WebGL.isWebGLAvailable()) {
    RenderScene();
} else {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById( 'container' ).appendChild( warning );
}

<SpeedInsights/>