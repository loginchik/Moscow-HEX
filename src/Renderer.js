import * as THREE from "three";

export function createRenderer() {
    // Создаёт ключевой обработчик, который всё обрабатывает.
    // Размеры устанавливаются в соответствии с размерами окна браузера.
    // Соотношение пикселей - не больше 2.

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const pixelRatio = Math.min(2, window.devicePixelRatio);
    renderer.setPixelRatio(pixelRatio);
    document.body.append(renderer.domElement);
    return renderer
}
