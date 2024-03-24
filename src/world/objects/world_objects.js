import * as THREE from "three";
import {OBJLoader} from "three/addons";
import colors from "../../colors.json"
import {Shop} from "./Shop";
import {Building} from "./Building";
import {Bird} from "./Bird";

export const modelsPath = '../../assets/models';
export const texturesPath = '../../assets/textures';


const landR = 6;
const LandMaterial = new THREE.MeshLambertMaterial();
LandMaterial.color.set(colors['hexLand']);

class Hex extends THREE.Object3D {
    constructor(featureData, times, positions) {
        super();

        // Раскрываем данные из записи
        const id = featureData['id'];
        const meanFloors = featureData['meanFloors'];
        const maxFloors = featureData['maxFloors'];
        const meanYear = featureData['meanYear'];
        const maxYear = featureData['maxYear'];
        const commercialRatio = featureData['commercialRatio'];
        const cost = featureData['cost'];

        // Рассчитываем необходимые переменные
        const cartsCount = Math.floor(commercialRatio * 10);
        const birdsCount = Math.floor(cost * 100);

        // Присваиваем гексу уникальное имя
        this.name = `HEX_${id}`;

        // Создаём объекты гекса
        this.meanBuilding = new Building(meanFloors, meanYear, times, positions, this.name, 'Mean');
        this.maxBuilding = new Building(maxFloors, maxYear, times, positions, this.name, 'Max');
        this.shop = new Shop(cartsCount, this.name);
        this.birds = new THREE.Group();
        this.birds.name = `${this.name}_birds`;
        for (let b = 0; b <birdsCount; b++) {
            const name = `${this.name}_bird${b}`;
            const bird = new Bird(name);
            this.birds.add(bird);
        }
        // Поворачиваем здание-максимум на 180 градусов
        this.meanBuilding.rotation.set(0, Math.PI, 0);
        // Сдвигаем дома
        this.meanBuilding.position.x = -3.5 / 2;
        this.meanBuilding.position.z = -1.25;
        this.maxBuilding.position.x = -0.1 - 3.5 / 2;
        this.maxBuilding.position.z = 1.25;
        // Сдвигаем магазин
        this.shop.position.x += 3.5 / 2;
        this.shop.position.y = .1;
        this.add(this.meanBuilding, this.maxBuilding, this.shop);
        // Если в гексе должны быть птицы, создаём их
        if (birdsCount > 0) {
            this.birds.position.set(2, 1, 0);
            this.add(this.birds);
        }

        // Поднимаем все объекты над уровнем земли
        for (let object of [this.meanBuilding, this.maxBuilding, this.shop]) {
            object.position.y += .82;
        }
        // Создаём землю под гексом
        const landGeometry = new THREE.CylinderGeometry(landR, landR * 1.05, 1, 6);
        const HexLand = new THREE.Mesh(landGeometry, LandMaterial);
        HexLand.name = `${this.name}_land`;
        this.add(HexLand);

        console.log(`Создан ${this.name}`);
    }

    get birdsMixers() {
        const mixers = [];
        for (let bird of this.birds.children) {
            mixers.push(bird.mixer);
        }
        return mixers;
    }

    startBirds() {
        this.birds.children.forEach(function(bird) {
            bird.play();
        })
    }

    get buildings() {
        return [this.meanBuilding, this.maxBuilding];
    }

    get lightsMixers() {
        return [this.meanBuilding.mixer, this.maxBuilding.mixer];
    }
}

export {Hex};