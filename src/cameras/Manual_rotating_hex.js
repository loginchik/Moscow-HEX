import * as THREE from "three";
import {OrbitControls} from "three/addons";

const FOV = 40;
const near = 3;
const far = 1000;
const aspect = window.innerWidth / window.innerHeight;

// Создаём камеру, которая будет использоваться для базового отображения
const manualRotatingHexCamera = new THREE.PerspectiveCamera(FOV + 10, aspect, near, far);
manualRotatingHexCamera.position.z = -15;
manualRotatingHexCamera.position.x = 34;
manualRotatingHexCamera.position.y = 25;
manualRotatingHexCamera.lookAt(0, 0, 0);
manualRotatingHexCamera.name = 'Manual world';

function CreateManualHexControls(domElement) {
    const controls = new OrbitControls(manualRotatingHexCamera, domElement);
    controls.enabled = true;
    controls.enablePan = true;
    controls.panSpeed = 3;
    controls.enableDamping = true;
    controls.keys = {
        LEFT: null, //left arrow
        UP: 'ArrowUp', // up arrow
        RIGHT: null, // right arrow
        BOTTOM: 'ArrowDown' // down arrow
    }
    controls.listenToKeyEvents(window);
    controls.maxPolarAngle = 1.25;
    controls.maxDistance = 95;
    controls.minDistance = 10;
    controls.maxTargetRadius = 5;

    const resetButton = document.getElementById('resetManualWorldButton');
    resetButton.addEventListener('click', function(event) {
        controls.reset();
    })

    return controls;
}

export {manualRotatingHexCamera, CreateManualHexControls}