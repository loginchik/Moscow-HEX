import * as THREE from "three";
import {Hex} from './objects/Hex'
import {SunBase} from "./objects/Sun";
import {EastLight, WestLight} from "./Lights";
import colors from "../colors.json"

const Clock = new THREE.Clock(false);

class World extends THREE.Scene {
    constructor() {
        super();
        this.background =  new THREE.Color(colors["background"]);
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
         // Создаём гексы на основе данных из json-файла
        const Hexes = new THREE.Group();
        jsonData['features'].map(record => {
            // Вычисляем положение текущего гекса
            const xPosition = record['x'] * 44;
            const zPosition = -record['y'] * 15;

            // Создаём объекты, которые нужно поставить на землю
            const hexObjects = new Hex(record, times, positions);
            this.buildings.push(...hexObjects.buildings);
            this.mixers.push(...hexObjects.lightsMixers);
            this.mixers.push(...hexObjects.birdsMixers);
            this.hexCollection.push(hexObjects)
            // Рандомно поворачиваем объекты для разнообразия внешнего вида
            const rotation = Math.round(Math.random() * 6);
            const angle = rotation * 60 * Math.PI / 180;
            hexObjects.rotateY(angle);

            hexObjects.position.set(xPosition, 0, zPosition);

            // Добавляем объект на сцену
            Hexes.add(hexObjects);
        })
        return Hexes;
    }

    #mainLand() {
        // Создаём объект самой большой земли-подставки
        const mainLandR = 60;
        const MainLandMaterial = new THREE.MeshLambertMaterial();
        MainLandMaterial.color.set(colors["mainLand"]);
        const mainLandGeo = new THREE.CylinderGeometry(mainLandR, mainLandR * 1.2, 10, 16);
        const MainLand = new THREE.Mesh(mainLandGeo, MainLandMaterial);
        MainLand.position.y = -5.2;
        MainLand.scale.z = 0.5;
        MainLand.name = 'Main land';
        return MainLand;
    }
}

export { World, Clock }