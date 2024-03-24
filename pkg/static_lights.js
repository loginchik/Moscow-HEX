import * as THREE from "three";

const bigLightIntensity = 1000;
const EastLight = new THREE.SpotLight( new THREE.Color('#FF2C21'), bigLightIntensity * .7);
EastLight.position.y = 70;
EastLight.position.x = 70;
EastLight.position.z = 5;

const WestLight = new THREE.SpotLight(new THREE.Color('#2195FF'), bigLightIntensity * .8);
WestLight.position.y = 70;
WestLight.position.x = -70;
WestLight.position.z = -5;

export {
    EastLight, WestLight,
}