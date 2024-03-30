import * as THREE from "three";
import {OrbitControls} from "three/addons";

const FOV = 40;
const near = 3;
const far = 1000;
const aspect = window.innerWidth / window.innerHeight;

// Создаём камеру, которая будет использоваться для базового отображения
const manualRotatingWorldCamera = new THREE.PerspectiveCamera(FOV + 10, aspect, near, far);
manualRotatingWorldCamera.position.z = -15;
manualRotatingWorldCamera.position.x = 126;
manualRotatingWorldCamera.position.y = 26;
manualRotatingWorldCamera.lookAt(0, 0, 0);
manualRotatingWorldCamera.name = 'Manual world';

function CreateManualControls(domElement) {
    const controls = new OrbitControls(manualRotatingWorldCamera, domElement);
    controls.enabled = true;
    controls.enablePan = true;
    controls.panSpeed = 3;
    controls.enableDamping = true;
    controls.keys = {
        LEFT: 'ArrowLeft', //left arrow
        UP: 'ArrowUp', // up arrow
        RIGHT: 'ArrowRight', // right arrow
        BOTTOM: 'ArrowDown' // down arrow
    }
    controls.listenToKeyEvents(window);
    controls.maxPolarAngle = 1.5;
    controls.maxDistance = 130;
    controls.minDistance = 35;
    controls.maxTargetRadius = 15;

    const resetButton = document.getElementById('resetManualWorldButton');
    resetButton.addEventListener('click', function(event) {
        controls.reset();
    })

    return controls;
}

export {manualRotatingWorldCamera, CreateManualControls}