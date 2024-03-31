// Импорт из сторонних библиотек
import * as THREE from "three";
import {Vector2} from "three";

// Импорт данных
import jsonData from "../src/data.json" assert { type: 'json' };

// Импорт собственных объектов
import {World} from "./world/World_scene";
import {Clock} from "./world/World_scene";
import {selfRotatingWorldCamera, cameraMixer, cameraCLip} from "./cameras/Self_rotating_world";
import {CreateManualControls, manualRotatingWorldCamera} from "./cameras/Manual_rotating_world";
import {ManageIntersections} from "./Manage_intersections";
import {CreateSoloHexScene} from "./world/objects/Hex";
import {manualRotatingHexCamera, CreateManualHexControls} from "./cameras/Manual_rotating_hex";
import {setupLoadingElements, removeLoadingElements, updateProgress} from "./Loading";
import {createRenderer} from "./Renderer";

// Базовые донастройки
THREE.Cache.enabled = true;
// Ключевой обработчик
const renderer = createRenderer();
// Вектор, где хранится положение мыши
const mouse = new Vector2();

// Часы, которые будут отсчитывать время от начала нажатия мышью на объект гекса
const mouseDownClock = new THREE.Clock(false);

let setupCompleted = false;

const worldAndHexes = createWorldScene();
const world = worldAndHexes['world'];

let hexIdToOpen = null;
let birdsMixers = null;

const camerasAvailable = [selfRotatingWorldCamera, manualRotatingWorldCamera];
let currentCamera = camerasAvailable[1];
let currentScene = world;
const WorldManualControls = CreateManualControls(renderer.domElement);
const HexManualControls = CreateManualHexControls(renderer.domElement);

const hexLoader = document.getElementById('hexLoader');
const hexLoaderBar = document.getElementById('hexLoaderBar');
const hexLoaderProgressText = document.getElementById('hexLoaderStatus');

const resetWorldManualButton = document.getElementById('resetManualWorldButton');

// Рендерит необходимые объекты на сцене так, чтобы все работало сладко-гладко
export function RenderScene() {
    requestAnimationFrame(RenderScene);
    if (setupCompleted) {
        const deltaTime = Clock.getDelta();
        const totalTime = Clock.getElapsedTime();

        renderer.render(currentScene, currentCamera);
        world.update(deltaTime, totalTime);

        switch (currentCamera) {
            case selfRotatingWorldCamera:
                cameraMixer.update(deltaTime);
                selfRotatingWorldCamera.lookAt(0, 0, 0);
                break;
            case manualRotatingWorldCamera:
                WorldManualControls.update();
                break;
            case manualRotatingHexCamera:
                HexManualControls.update();
                break;
        }

        if (currentScene === world) {
            if (mouseDownClock.running) {
                const progress = Math.min(100, mouseDownClock.getElapsedTime() / 3 * 100);
                hexLoaderBar.style.width = `${progress}%`;
                hexLoaderProgressText.innerText = Math.round(progress / 10) * 10;
            }
        } else {
            if (birdsMixers !== null) {
                birdsMixers.forEach(function(mixer) {
                    mixer.update(deltaTime);
                })
            }
        }
    }
}

function MouseDownListener(event) {
    if (currentScene !== world) {
        return
    }
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    hexIdToOpen = ManageIntersections(mouse, currentCamera, world.children);
    if (hexIdToOpen != null) {
        const hexLoader = document.getElementById('hexLoader');
        hexLoader.style.display = 'flex';
        hexLoaderBar.style.width = '0%';
        mouseDownClock.start();
    }
}
function MouseUpListener(event) {
    if (mouseDownClock.running) {
        const timePassed = mouseDownClock.getElapsedTime();
        mouseDownClock.stop();
        if (timePassed > 3) {
            let hexData;
            for (let record of jsonData['features']) {
                if (record['id'] == hexIdToOpen) {
                    hexData = record;
                }
            }
            if (!(hexData === undefined)) {
                const HexSceneMixer= CreateSoloHexScene(hexData);
                const hexScene = HexSceneMixer[0];
                birdsMixers = HexSceneMixer[1];
                currentScene = hexScene;
                currentCamera = manualRotatingHexCamera;
            }
        } else {
            hexLoaderBar.style.width = '0%';
        }
        hexLoader.style.display = 'none';
    }
}


renderer.domElement.addEventListener('mousedown', MouseDownListener)
renderer.domElement.addEventListener('mouseup', MouseUpListener)

const backToWorldButton = document.getElementById('backToWorldButton');
backToWorldButton.addEventListener('click', function (event) {
    const worldHeader = document.getElementById('worldInfo');
    worldHeader.hidden = false;
    const hexInfo = document.getElementById('hexInfo');
    hexInfo.hidden = true;
    const topNavigation = document.getElementById('top');
    topNavigation.hidden = true;

    currentScene = world;
    currentCamera = selfRotatingWorldCamera;
    resetWorldManualButton.hidden = true;
})

THREE.DefaultLoadingManager.onLoad = function() {
    // Когда загрузка, завершается уничтожаем загрузчики
    removeLoadingElements();

    // Находим две возможных шапки: одну из них нужно будет скрыть, другую показать
    const worldHeader = document.getElementById('worldInfo');
    const hexInfo = document.getElementById('hexInfo');

    // Если нудно загрузить целый мир
    if (currentScene === world) {
        // Находим навигацию вида и показываем её
        const viewControls = document.getElementById('view-controls');
        viewControls.style.display = 'flex';
        // Включаем нужный заголовок и выключаем ненужный
        worldHeader.hidden = false;
        hexInfo.hidden = true;

        const loaderBarBlock = document.getElementById('hexLoader');
        loaderBarBlock.style.display = 'none';

        // Запускаем часы и мир
        Clock.start();
        world.live();
        // Запускаем камеру
        cameraMixer.clipAction(cameraCLip).play();

    } else {
        // Если нужно загрузить отдельный гекс

        // Находим навигацию вида и скрываем её
        const nav = document.getElementById('view-controls');
        nav.style.display = 'none';
        // Находим верхнюю навигацию и включаем её
        const navTop = document.getElementById('top');
        navTop.hidden = false;
        // Переключаем заголовки
        worldHeader.hidden = true;
        hexInfo.hidden = false;

        console.log('Гекс загружен')
    }
    // Устанавливаем статус загрузки на завершённый
    setupCompleted = true;
}

THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = itemsLoaded / itemsTotal;
    // Если элементы загрузки уже есть, то обновляем их
    try {
        updateProgress(progress);
    } catch (error) {
        // В противном случае, создаём элементы
        setupLoadingElements(progress);
    }
    setupCompleted = false;
}

function createWorldScene() {
    // Создаём ключевую сцену, в рамках которой будет происходить действие
    const world = new World();
    world.build(jsonData);

    const header = document.getElementById('worldInfo');
    header.hidden = true;
    const hexHeader = document.getElementById('hexInfo');
    hexHeader.hidden = true;
    const topNavigation = document.getElementById('top');
    topNavigation.hidden = true;
    const viewControls = document.getElementById('view-controls');
    viewControls.style.display = 'none';

    const camerasAvailable = [selfRotatingWorldCamera, manualRotatingWorldCamera];
    const camerasDiv = document.getElementById('cameraSwitchButtons')
    let cameraI = 1;
    for (let camera of camerasAvailable) {
        const button = document.createElement('button')
        button.id = camera.name;
        button.innerText = `C${cameraI}`;
        button.title = camera.name;
        button.addEventListener('click', function (event) {
            currentCamera = camera;
            resetWorldManualButton.hidden = camera !== manualRotatingWorldCamera;
        })
        camerasDiv.appendChild(button);
        cameraI++;
    }

    return {
        "world": world,
        "hexes": world.hexes.children
    };
}

// Адаптация под изменения экрана
window.onresize = function() {
    currentCamera.aspect = window.innerWidth / window.innerHeight;
    currentCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}