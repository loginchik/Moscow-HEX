import * as THREE from "three";
import {World} from "./world";
import jsonData from "../src/data.json" assert { type: 'json' };
import {Clock} from "./world";
import {modelsManager2} from "./world_objects";
import {camera, cameraMixer, cameraCLip} from "./cameras";

Clock.autoStart = false;
THREE.Cache.enabled = true;
let setupCompleted = false;

// Рендерит необходимые объекты на сцене так, чтобы все работало сладко-гладко
export function RenderScene() {
    requestAnimationFrame(RenderScene);
    const deltaTime = Clock.getDelta();
    const totalTime = Clock.getElapsedTime();
    if (setupCompleted) {
        renderer.render(world, camera);
        world.update(deltaTime, totalTime);
        cameraMixer.update(deltaTime);
        camera.lookAt(0, 0, 0);
    }
}

// Создаём ключевую сцену, в рамках которой будет происходить действие
const world = new World();
world.build(jsonData);

// Анимация загрузки
const loadingBox = document.getElementById('loadingBox');
const loadingBar = document.getElementById('loadingBar');
const header = document.getElementsByTagName('header')[0];
loadingBox.style.width = '100px';
loadingBox.style.height = '10px';
loadingBox.style.top = `${(window.innerHeight - 10) / 2}px`;
loadingBar.style.top = `${(window.innerHeight - 10) / 2}px`;
loadingBox.style.left = `${(window.innerWidth - 100) / 2}px`;
loadingBar.style.left = `${(window.innerWidth - 100) / 2}px`;
header.hidden = true;

modelsManager2.onLoad = function() {
    Clock.start();
    world.live();
    setupCompleted = true;
    cameraMixer.clipAction(cameraCLip).play();
    console.log('Загружено!');
    loadingBox.hidden = true;
    loadingBar.hidden = true;
    header.hidden = false;
}
modelsManager2.onProgress = function (url, itemsLoaded, itemsTotal) {
    loadingBar.style.width = `${itemsLoaded / itemsTotal * 100}px`
}

// Создаём ключевой обработчик, который всё обрабатывает
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(2);
console.log(devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.append(renderer.domElement);

// Адаптация под изменения экрана
window.onresize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}