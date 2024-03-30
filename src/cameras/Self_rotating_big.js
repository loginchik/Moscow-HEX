import * as THREE from "three";

const FOV = 40;
const near = 1;
const far = 1000;
const aspect = window.innerWidth / window.innerHeight;
// Создаём камеру, которая будет использоваться для базового отображения
const selfRotatingWorldCamera = new THREE.PerspectiveCamera(FOV + 10, aspect, near, far);
selfRotatingWorldCamera.position.z = -15;
selfRotatingWorldCamera.position.x = 126;
selfRotatingWorldCamera.position.y = 26;
selfRotatingWorldCamera.lookAt(0, 0, 0);
selfRotatingWorldCamera.name = 'Auto world';

const cameraR = 100;
const cameraY = 50;
const cameraTimes = [], cameraPositions = [];
const duration = 120;
for (let i = 0; i <= duration; i++) {
    const angle = i * 360 / duration;
    const angleRadian = angle * Math.PI / 180;
    const xDominant = Math.cos(angleRadian) * cameraR * .3;
    const x = Math.cos(angleRadian) * cameraR * .7 + xDominant;
    const z = Math.sin(angleRadian) * cameraR * .7 + xDominant;
    const y = Math.abs(Math.cos(angleRadian)) * cameraY * .4 + cameraY * .6;
    cameraTimes.push(i);
    cameraPositions.push(x, y, z);
}
const cameraTrack = new THREE.VectorKeyframeTrack('.position', cameraTimes, cameraPositions, THREE.InterpolateSmooth);
const cameraCLip = new THREE.AnimationClip('Camera around', -1, [cameraTrack]);
const cameraMixer = new THREE.AnimationMixer(selfRotatingWorldCamera);


export {selfRotatingWorldCamera, cameraMixer, cameraCLip}