import * as THREE from "three";
import {Tree} from "./Tree";
import {OBJLoader} from "three/addons";

const textureLoader = new THREE.TextureLoader(THREE.DefaultLoadingManager);
const modelsLoader = new OBJLoader(THREE.DefaultLoadingManager);
const modelsPath = '../../assets/models';

const firstFloorTexture = textureLoader.load(`../assets/textures/firstFloor.png`)
const FirstFloorMaterial = new THREE.MeshLambertMaterial({
    map: firstFloorTexture,
});

const otherFloorTexture = textureLoader.load(`../assets/textures/otherFloor.png`)
const OtherFloorMaterial = new THREE.MeshLambertMaterial({
    map: otherFloorTexture,
});

const DoorLightColor = new THREE.Color(1, .8, .5);

export class Building extends THREE.Object3D {
    constructor(floorCount, yearBuilt, times, positions, hexID, buildingType) {
        super();
        this.name = `${hexID}_building${buildingType}`;
        // Ставим первый этаж
        this.#firstFloor();
        // Ставим остальные этажи на первый
        for (let f = 1; f < floorCount; f++) {
            const floor = this.#otherFloor(f);
            floor.position.x += .06;
            floor.position.y -= .05;
            floor.position.z -= .255;
            this.add(floor);
        }
        // Добавляем красный огонёк, если здание высотное
        if (floorCount > 25) {
            this.#redLight(floorCount);
        }
        // Высаживаем деревья
        const trees = new THREE.Group();
        const yearValues = Building.YearToDigits(yearBuilt);
        for (let t = 0; t < yearValues.length; t++) {
            const tree = new Tree(yearValues[t]);
            tree.position.x = Tree.xPosition(t);
            trees.add(tree);
        }
        trees.position.set(-1.5, -0.35, 0.8);
        this.add(trees);

        // Подсветка подъезда
        const entrance = Math.floor(Math.random() * 4);
        const xPos = -1.9 + entrance * 1.3;

        const doorLight = new THREE.SpotLight(DoorLightColor, 0);
        doorLight.angle = Math.PI / 4;
        doorLight.penumbra = .3;
        doorLight.position.z = .55;
        doorLight.position.y = .082;
        doorLight.position.x = xPos;

        const doorLightTarget = new THREE.Object3D();
        doorLightTarget.name = 'Door light target';
        doorLightTarget.position.z = doorLight.position.z;
        doorLightTarget.position.y = 0;
        doorLightTarget.position.x = xPos;
        doorLight.target = doorLightTarget;

        this.add(doorLight, doorLightTarget);
        this.mixer = new THREE.AnimationMixer(doorLight);
        if (times.length > 0 && positions.length > 0)
            this.createAnimations(times, positions)
    }

    playLights() {
        const clip = THREE.AnimationClip.findByName(this.animations, 'Lights');
        this.mixer.clipAction(clip).play();
    }

    createAnimations(times, positions) {
        const values = [];
        for (let t = 0; t < times.length; t++) {
            const posY = positions[1 + t * 3];
            if (posY < 3) {
                const intensity = Math.random() * 0.3 + 0.7;
                values.push(intensity);
            } else {
                values.push(0);
            }
        }
        const track = new THREE.NumberKeyframeTrack('.intensity', times, values, THREE.InterpolateLinear);
        const clip = new THREE.AnimationClip('Lights', -1, [track]);
        clip.optimize();
        this.animations.push(clip);
    }

    #firstFloor() {
        const floorObject = new THREE.Mesh();
        modelsLoader.load(`${modelsPath}/firstFloor.obj`, function(object){
            floorObject.geometry = object.children[0].geometry;
            console.log('Загружена геометрия первого этажа')
        }, undefined, function(error) {console.log(error)})
        floorObject.material = FirstFloorMaterial;
        this.add(floorObject);
    }

    #otherFloor(floorNumber) {
        const floor = new THREE.Mesh();
        modelsLoader.load(`${modelsPath}/otherFloor.obj`, function (geometry) {
            floor.geometry = geometry.children[0].geometry;
            console.log('Загружена геометрия типичного этажа')
        }, undefined, function (error) {
            console.log(error);
        })
        floor.material = OtherFloorMaterial;
        floor.position.set(.081, floorNumber * 0.45, 0.004);
        return floor;
    }

    #redLight(floorsCount) {
        const BuildingLightColor = new THREE.Color(1, 0, 0);
        const light = new THREE.PointLight(BuildingLightColor, .2);
        light.position.y = floorsCount * 0.45;
        light.position.z = -.25;
        this.add(light);

        const sphere = new THREE.SphereGeometry(.05);
        const BuildingLightMaterial = new THREE.MeshBasicMaterial();
        BuildingLightMaterial.color = BuildingLightColor;
        const sphereObj = new THREE.Mesh(sphere, BuildingLightMaterial);
        sphereObj.position.x = light.position.x;
        sphereObj.position.y = light.position.y;
        sphereObj.position.z = light.position.z;
        this.add(sphereObj);
    }

    static YearToDigits(year) {
        return Array.from(year.toString()).map(x => {
            return parseInt(x);
        })
    }
}