import * as THREE from "three";
import {World} from "./world/world";
import jsonData from "../src/data.json" assert { type: 'json' };
import {Clock} from "./world/world";
import {modelsLoadingManager} from "./world/objects/world_objects";
import {camera, cameraMixer, cameraCLip} from "./cameras/cameras";
import {Vector2} from "three";
import codeNode from "three/addons/nodes/code/CodeNode";

Clock.autoStart = false;
THREE.Cache.enabled = true;
let setupCompleted = false;

const renderer = createRenderer();
const mouse = new Vector2();
const world = createWorldScene();
let hexToOpen = null;

// Рендерит необходимые объекты на сцене так, чтобы все работало сладко-гладко
export function RenderScene() {
    requestAnimationFrame(RenderScene);
    if (setupCompleted) {
        RenderWorldScene();
    }
}


document.addEventListener('mousemove', function(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
})

const raycaster = new THREE.Raycaster()
function ManageIntersections() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(world.children);
    if (intersects.length > 0) {
        const closest = intersects[0].object;
        const intersectingHexID = defineHexFromIntersection(closest);
        if (intersectingHexID !== null) {
            for (let hex of world.hexes.children) {
                if (hex.name.includes(intersectingHexID)) {
                    hexToOpen = hex;
                    break
                }
            }
            // console.log('Intersecting', intersectingHexID);
        } else {
            hexToOpen = null;
        }
    } else {
        hexToOpen = null;
        console.log('no intersections');
    }
    console.log(hexToOpen);
}

function defineHexFromIntersection(closestObject) {
    let hexID;
    if (closestObject.name === '') {
        let object = closestObject;
        let objectName = object.name;
        while (objectName === '') {
            object = object.parent;
            objectName = object.name;
        }
        hexID = objectName;
    } else {
        hexID = closestObject.name;
    }
    if (hexID !== '') {
        if (hexID.includes('HEX')) {
            return hexID.split('_')[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
}

function RenderWorldScene() {
    const deltaTime = Clock.getDelta();
    const totalTime = Clock.getElapsedTime();

    renderer.render(world, camera);
    world.update(deltaTime, totalTime);
    cameraMixer.update(deltaTime);
    camera.lookAt(0, 0, 0);
    // ManageIntersections();
}

function setupLoadingElements(box, bar) {
    box.style.width = '100px';
    box.style.height = '10px';
    box.style.top = `${(window.innerHeight - 10) / 2}px`;
    bar.style.top = `${(window.innerHeight - 10) / 2}px`;
    box.style.left = `${(window.innerWidth - 100) / 2}px`;
    bar.style.left = `${(window.innerWidth - 100) / 2}px`;
}

function createWorldScene() {
    // Создаём ключевую сцену, в рамках которой будет происходить действие
    const world = new World();
    world.build(jsonData);

    // Анимация загрузки
    const loadingBox = document.getElementById('loadingBox');
    const loadingBar = document.getElementById('loadingBar');
    const header = document.getElementsByTagName('header')[0];
    setupLoadingElements(loadingBox, loadingBar)
    header.hidden = true;

    modelsLoadingManager.onLoad = function() {
        Clock.start();
        world.live();
        setupCompleted = true;
        cameraMixer.clipAction(cameraCLip).play();
        console.log('Загружено!');
        loadingBox.hidden = true;
        loadingBar.hidden = true;
        header.hidden = false;
    }
    modelsLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
        loadingBar.style.width = `${itemsLoaded / itemsTotal * 100}px`
    }

    // console.log(world.children);

    return world;
}

function createRenderer() {
    // Создаём ключевой обработчик, который всё обрабатывает

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(2);
    console.log(devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.body.append(renderer.domElement);
    return renderer
}

// Адаптация под изменения экрана
window.onresize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}