// Импорт из сторонних библиотек
import * as THREE from "three";
import {Vector2} from "three";

// Импорт данных
import jsonData from "../src/data.json" assert { type: 'json' };
import worldInfoElements from "../src/worldInfoElements.json" assert {type: 'json'};

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
import {createWorldInfoHeader} from "./Headers";

// Базовые донастройки
THREE.Cache.enabled = true;
// Ключевой обработчик
const renderer = createRenderer();
// Вектор, где хранится положение мыши
const mouse = new Vector2();

// Часы, которые будут отсчитывать время от начала нажатия мышью на объект гекса
const mouseDownClock = new THREE.Clock(false);

let setupCompleted = false;

const world = createWorldScene();

let hexIdToOpen = null;
let birdsMixers = null;

const camerasAvailable = [selfRotatingWorldCamera, manualRotatingWorldCamera];
let currentCamera = camerasAvailable[0];
let lastWorldCamera;
let currentScene = world;
const WorldManualControls = CreateManualControls(renderer.domElement);
const HexManualControls = CreateManualHexControls(renderer.domElement);

const hexLoader = document.getElementById('hexLoader');
const hexLoaderBar = document.getElementById('hexLoaderBar');
const hexLoaderProgressText = document.getElementById('hexLoaderStatus');

const resetWorldManualButton = document.getElementById('resetManualWorldButton');
resetWorldManualButton.hidden = currentCamera !== manualRotatingWorldCamera;

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
            if (mouseDownClock.running && mouseDownClock.getElapsedTime() >= .5) {
                const hexLoader = document.getElementById('hexLoader');
                hexLoader.style.display = 'flex';

                const progress = Math.min(100, (mouseDownClock.getElapsedTime() - .5) / 3 * 100);
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
    // Определяем координаты мыши внутри трёхмерного пространства
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // Находим ближайший гекс, если нажатие на него
    hexIdToOpen = ManageIntersections(mouse, currentCamera, world.children);
    // Если гекс найден, то отображаем загрузку
    if (hexIdToOpen != null) {
        mouseDownClock.start();
    }
}
function MouseUpListener(event) {
    // Сохраняем время и останавливаем часы
    const timePassed = mouseDownClock.getElapsedTime();
    mouseDownClock.stop();
    // Если прошло достаточно времени, то открываем просмотр гекса
    if (timePassed >= 3.5) {
        let hexData;
        for (let record of jsonData['features']) {
            if (record['id'] == hexIdToOpen) {
                hexData = record;
            }
        }
        if (!(hexData === undefined)) {
            const HexSceneMixer= CreateSoloHexScene(hexData);
            birdsMixers = HexSceneMixer[1];
            currentScene = HexSceneMixer[0];
            lastWorldCamera = currentCamera;
            currentCamera = manualRotatingHexCamera;
        }
    } else {
        hexLoaderBar.style.width = '0%';
    }
    hexLoader.style.display = 'none';
}

function BackToWorldListener (event) {

    // Создаём заголовок мира
    try {
        const worldHeader = document.getElementById('worldInfo');
        worldHeader.hidden = false;
    } catch (error) {
        const worldHeader = createWorldInfoHeader();
        document.body.append(worldHeader);
    }
    // Удаляем ненужные элементы
    const hexInfo = document.getElementById('hexInfo');
    hexInfo.remove();
    const topNavigation = document.getElementById('top');
    topNavigation.remove();

    // Включаем отображение контроля
    const viewControls = document.getElementById('view-controls');
    viewControls.style.display = 'flex';

    // Возвращаем действия по мыши
    renderer.domElement.addEventListener('mousedown', MouseDownListener)
    renderer.domElement.addEventListener('mouseup', MouseUpListener)

    // Переключаем параметры отображения
    currentScene = world;
    currentCamera = lastWorldCamera || selfRotatingWorldCamera;
    resetWorldManualButton.hidden = true;
}


THREE.DefaultLoadingManager.onLoad = function() {
    // Когда загрузка, завершается уничтожаем загрузчики
    removeLoadingElements();
    const viewControls = document.getElementById('view-controls');
    // Если нужно загрузить целый мир
    if (currentScene === world) {
        // Создаём заголовок
        const worldInfo = createWorldInfoHeader();
        document.body.append(worldInfo);

        // Находим навигацию вида и показываем её
        viewControls.style.display = 'flex';
        // Скрываем загрузчик гекса, так как он сейчас не нужен
        const loaderBarBlock = document.getElementById('hexLoader');
        loaderBarBlock.style.display = 'none';

        // Запускаем часы и мир
        Clock.start();
        world.live();
        // Запускаем камеру
        cameraMixer.clipAction(cameraCLip).play();
        // Добавляем действия по нажатию мыши
        renderer.domElement.addEventListener('mousedown', MouseDownListener)
        renderer.domElement.addEventListener('mouseup', MouseUpListener)
    } else {
        // Если нужно загрузить отдельный гекс
        const backToWorldButton = document.getElementById('backToWorldButton');
        backToWorldButton.addEventListener('click', BackToWorldListener);
        // Находим навигацию вида и скрываем её
        viewControls.style.display = 'none';
        // Убираем действия по нажатию мыши
        renderer.domElement.removeEventListener('mousedown', MouseDownListener)
        renderer.domElement.removeEventListener('mouseup', MouseUpListener)
    }
    // Устанавливаем статус загрузки на завершённый
    setupCompleted = true;
    renderer.domElement.style.display = 'block';
}

// Во время загрузки прогресс отображается на странице сайта
THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = itemsLoaded / itemsTotal;
    // Если элементы загрузки уже есть, то обновляем их
    try {
        updateProgress(progress);
    } catch (error) {
        // В противном случае, создаём элементы
        setupLoadingElements(progress);
    }
    renderer.domElement.style.display = 'none';
    setupCompleted = false;
}

function createWorldScene() {
    // Создаём ключевую сцену, в рамках которой будет происходить действие
    const world = new World();
    world.build(jsonData);

    const viewControls = document.getElementById('view-controls');
    viewControls.style.display = 'none';

    // Создаём кнопки для переключения между камерами
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
    return world;
}

// При изменении размера окна браузера
// камера автоматически перестраивается под соотношение сторон,
// главный обработчик заполняет всё возможное новое допустимое пространство
window.onresize = function() {
    currentCamera.aspect = window.innerWidth / window.innerHeight;
    currentCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}