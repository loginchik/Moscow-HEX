import * as THREE from "three";
import {OBJLoader} from "three/addons";
import colors from "../../colors.json"

export const modelsLoadingManager = new THREE.LoadingManager();

const modelsLoader = new OBJLoader(modelsLoadingManager);
const textureLoader = new THREE.TextureLoader(modelsLoadingManager);
const modelsPath = '../../assets/models';
const texturesPath = '../../assets/textures';

class Hex extends THREE.Object3D {
    constructor(featureData, times, positions) {
        super();

        const meanFloors = featureData['meanFloors'];
        const maxFloors = featureData['maxFloors'];
        const meanYear = featureData['meanYear'];
        const maxYear = featureData['maxYear'];
        const commercialRatio = featureData['commercialRatio'];
        const cost = featureData['cost'];

        // Рассчитываем необходимые переменные
        const cartsCount = Math.floor(commercialRatio * 10);
        const birdsCount = Math.floor(cost * 100);

        this.meanBuilding = new Building(meanFloors, meanYear, times, positions);
        this.maxBuilding = new Building(maxFloors, maxYear, times, positions);
        this.shop = new Shop(cartsCount);
        this.birds = new THREE.Group();
        for (let b = 0; b <birdsCount; b++) {
            this.birds.add(new Bird());
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

        if (birdsCount > 0) {
            this.birds.position.set(2, 1, 0);
            this.add(this.birds);
        }
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

class Tree extends THREE.Group {
    constructor(leavesCount) {
        super();
        // Создаём ствол
        const TrunkMaterial = new THREE.MeshLambertMaterial();
        TrunkMaterial.color.set(new THREE.Color(colors["tree"]["trunk"]));
        const Trunk = new THREE.Mesh();
        modelsLoader.load(`${modelsPath}/treeTrunk.obj`, function (object) {
            Trunk.geometry = object.children[0].geometry;
        })
        Trunk.material = TrunkMaterial;
        this.add(Trunk);

        // Создаём листья
        const LeavesMaterial = new THREE.MeshLambertMaterial();
        LeavesMaterial.color.set(new THREE.Color(colors["tree"]["leaves"]));
        if (leavesCount > 0) {
            const crone = new THREE.Object3D();
            for (let l = 0; l < leavesCount; l++ ) {
                const r = this.#croneRadius(l);
                const geometry = new THREE.IcosahedronGeometry(r);
                const mesh = new THREE.Mesh(geometry, LeavesMaterial);
                mesh.position.y = this.#croneYPos(l);
                crone.add(mesh);
            }
            this.add(crone);
        }
    }

    static xPosition(treeNumber) {
        return treeNumber * 1.3;
    }

    #croneRadius(leaveCount) {
        const minR = 0.1;
        const maxLeaves = 8, minLeaves = 0;
        const leaveCountNormalized = (leaveCount - minLeaves) / (maxLeaves - minLeaves);
        return leaveCountNormalized * minR + minR;
    }

    #croneYPos(leaveCount) {
        return 1.3 - 0.12 * leaveCount;
    }
}

const FirstFloorMaterial = new THREE.MeshLambertMaterial();
textureLoader.load(`${texturesPath}/firstFloor.png`, function (texture) {
    FirstFloorMaterial.map = texture;
    console.log('Загружена текстура первого этажа')
}, undefined, function(error) { console.log(error) })
const OtherFloorMaterial = new THREE.MeshLambertMaterial();
textureLoader.load(`${texturesPath}/otherFloor.png`, function (texture) {
    OtherFloorMaterial.map = texture;
    console.log('Загружена текстура типичного этажа')
}, undefined, function(error) { console.log(error) })

class Building extends THREE.Object3D {
    constructor(floorCount, yearBuilt, times, positions) {
        super();
        this.name = 'building';
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

        const DoorLightColor = new THREE.Color(1, .8, .5);
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

const ShopMaterial = new THREE.MeshLambertMaterial();
textureLoader.load(`${texturesPath}/shopColor.png`, function(texture) {
    ShopMaterial.map = texture;
    console.log('Загружена текстура магазина')
}, undefined, function(error) {console.log(error)});
const CartMaterial = new THREE.MeshLambertMaterial();
textureLoader.load(`${texturesPath}/cartColor.png`, function(texture) {
    CartMaterial.map = texture;
    console.log('Загружена текстура тележки');
}, undefined, function (error) {console.log(error)});
textureLoader.load(`${texturesPath}/cartGlossy.png`, function(texture) {
    CartMaterial.specularMap = texture;
    console.log('Загружена текстура прозрачности тележки');
}, undefined, function (error) {console.log(error)});
CartMaterial.transparent = true;

class Shop extends THREE.Object3D {
    constructor(cartCount) {
        super();
        this.#building();
        this.add(this.#carts(cartCount));
    }

    #building() {
        const ShopBuilding = new THREE.Mesh();
        modelsLoader.load(`${modelsPath}/shop.obj`, function(object) {
            ShopBuilding.geometry = object.children[0].geometry;
            console.log('Загружена геометрия магазина')
        }, undefined, function (error) {console.log(error)})
        ;
        ShopBuilding.material = ShopMaterial;
        this.add(ShopBuilding);
    }

    #carts(cartCount) {
        const carts = new THREE.Object3D();
        for (let c = 0; c < cartCount; c++) {
            const cartObject = new THREE.Mesh();
            modelsLoader.load(`${modelsPath}/shoppingCart.obj`, function(object) {
                cartObject.geometry = object.children[0].geometry;
                console.log('Загружена магазинная тележка');
            }, undefined, function(error) {console.log(error)});
            cartObject.material = CartMaterial;
            cartObject.scale.set(.1, .1, .1);
            cartObject.position.set(0.8, -0.4, 1.1 - c * 0.24);
            this.add(cartObject);
        }
        return carts;
    }
}

class Bird extends THREE.Object3D {
    constructor() {
        super();

        const BirdMaterial = new THREE.MeshLambertMaterial();
        const red = Math.random() * .3 + .7;
        const green = Math.random() * .5 + .5;
        const blue = Math.random() * .3 + .7;
        BirdMaterial.color.set(red, green, blue);
        const birdMesh = new THREE.Mesh();
        modelsLoader.load(`${modelsPath}/bird.obj`, function( object ){
            birdMesh.geometry = object.children[0].geometry;
            console.log('Загружена геометрия птицы');
        })
        birdMesh.material = BirdMaterial;
        this.add(birdMesh);
        this.scale.set(.1, .1, .1);
        this.zRotation =  this.#rotationZ();
        this.rotation.z = this.zRotation * Math.PI / 180;
        this.position.x = Bird.mappedPosition(0, .8);
        this.position.y = Bird.mappedPosition(0, 5);
        this.position.z = Bird.mappedPosition(0, 2.5);

        this.createAnimation();
        this.mixer = new THREE.AnimationMixer(this);
    }

    play() {
        const clip = this.animations[0];
        this.mixer.clipAction(clip).play();
    }

    createAnimation() {
        const zRotNormalized = Math.abs(this.zRotation / 50);
        const r = zRotNormalized * .8;
        const duration = Math.ceil((r / .8) * 10 + Math.random() * 3);
        let direction;
        if (this.rotation.z < 0) {
            direction = -1;
        } else {
            direction = 1;
        }

        const times = [], positions = [], rotations = [];
        for (let i = 0; i < duration; i++) {
            const trueI = i * 360 / duration;
            const angle = trueI * Math.PI / 180 * direction;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r * 2;
            times.push(i);
            positions.push(x, this.position.y, z);
            rotations.push(Math.sin(angle) * Math.PI);
        }
        // const rotationTimes = [0, times.length], rotations = [0, 360];
        // console.log(rotationTimers);
        times.push(duration)
        const finalAngle = 360 * Math.PI / 180 * direction;
        positions.push(Math.cos(finalAngle) * r, this.position.y, Math.sin(finalAngle) * r * 2);
        rotations.push(Math.sin(finalAngle) * Math.PI);

        const track = new THREE.VectorKeyframeTrack('.position', times, positions, THREE.InterpolateSmooth);
        const rotationsTrack = new THREE.NumberKeyframeTrack('.rotation[y]', times, rotations, THREE.InterpolateLinear);
        const clip = new THREE.AnimationClip('Bird', duration, [track, rotationsTrack]);
        clip.optimize();
        this.animations.push(clip);
    }

    #rotationZ() {
        let angleMode = 1;
        if (Math.random() > 0.5) {
            angleMode = -1;
        }
        return (Math.random() * 25 + 25) * angleMode;
    }

    static mappedPosition(minPos, maxPos) {
        return (maxPos - minPos) * Math.random() + minPos;
    }
}

export {Hex};