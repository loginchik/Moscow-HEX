import * as THREE from "three";
import {SunBase, Hex} from './world_objects'
import {EastLight, WestLight} from "./static_lights";

const Clock = new THREE.Clock();

class World extends THREE.Scene {
    constructor() {
        super();
        this.background =  new THREE.Color( '#242424');
        this.mixers = [];
        this.buildings = [];
        this.hexCollection = [];
    }

    build(jsonData) {
        const mainLand = this.#mainLand();
        this.sun = new SunBase(63, 120);
        this.mixers.push(this.sun.lightMixer, this.sun.movementMixer);

        let calculated = this.sun.positionInTime();
        const times = calculated['times'], positions = calculated['positions']
        this.hexes = this.#hexes(jsonData, times, positions);

        this.add(mainLand, this.sun, this.hexes);
        this.add(EastLight, WestLight);
        this.add(new THREE.AmbientLight(new THREE.Color(1, 1, 1), .2));
    }

    live() {
        this.sun.play();
        this.buildings.forEach(function(building) {
            building.playLights();
        });
        this.hexCollection.forEach(function(hex) {
          hex.startBirds();
        });
        console.log('Жизнь запущена');
    }

    update(deltaTime, totalTime) {
        this.mixers.forEach(function(mixer) {
            mixer.update(deltaTime);
        })
        this.sun.shaderTime = totalTime;
    }

    #hexes(jsonData, times, positions) {
        // Создаём объект гекса, который используется как земля для района
        const landR = 6;
        const LandMaterial = new THREE.MeshLambertMaterial();
        LandMaterial.color.set('#283618');
        const landGeometry = new THREE.CylinderGeometry(landR, landR * 1.05, 1, 6);
        const HexLand = new THREE.Mesh(landGeometry, LandMaterial);

        // Создаём гексы на основе данных из json-файла
        const Hexes = new THREE.Group();
        jsonData['features'].map(record => {
            // Вычисляем положение текущего гекса
            const xPosition = record['x_normalized_2'] * 44;
            const zPosition = -record['y_normalized_2'] * 15;

            // Создаём объекты, которые нужно поставить на землю
            const hexObjects = new Hex(record, times, positions);
            hexObjects.position.y = .82;
            hexObjects.name = 'hex';
            this.buildings.push(...hexObjects.buildings);
            this.mixers.push(...hexObjects.lightsMixers);
            this.mixers.push(...hexObjects.birdsMixers);
            this.hexCollection.push(hexObjects)
            // Рандомно поворачиваем объекты для разнообразия внешнего вида
            hexObjects.rotation.set(0, Math.random() * 360, 0);
            // Создаём копию земли
            const hexLand = HexLand.clone();
            // Собираем всё вместе и перемещаем в нужное положение
            const hex = new THREE.Object3D();
            hex.add(hexLand, hexObjects);
            hex.position.set(xPosition, 0, zPosition);

            // Добавляем объект на сцену
            Hexes.add(hex);
        })
        return Hexes;
    }

    #mainLand() {
        // Создаём объект самой большой земли-подставки
        const mainLandR = 60;
        const MainLandMaterial = new THREE.MeshLambertMaterial();
        MainLandMaterial.color.set('#DDA15E');
        const mainLandGeo = new THREE.CylinderGeometry(mainLandR, mainLandR * 1.2, 10, 16);
        const MainLand = new THREE.Mesh(mainLandGeo, MainLandMaterial);
        MainLand.position.y = -5.2;
        MainLand.scale.z = 0.5;
        return MainLand;
    }
}

export { World, Clock }