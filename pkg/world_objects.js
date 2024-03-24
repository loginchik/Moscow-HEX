import * as THREE from "three";
import {OBJLoader} from "three/addons";
import {sunVertex, sunFragment} from "../public/shaders/sun";
import {mod} from "three/nodes";
export const modelsManager2 = new THREE.LoadingManager();

const modelsLoader = new OBJLoader(modelsManager2);
const textureLoader = new THREE.TextureLoader(modelsManager2);
const modelsPath = '/geometry_models';

class SunBase extends THREE.Object3D {
    R;

    constructor(R = 63, animationPeriod = 20) {
        super();
        this.R = R;
        this.animationPeriod = animationPeriod;
        this.mesh = this.#mesh();
        this.add(this.mesh);

        this.maxIntensity = 10000;
        const SunColor = new THREE.Color(1., .9, .5);
        this.light = new THREE.PointLight(SunColor, 0);
        this.add(this.light);

        this.createAnimations();

        this.movementMixer = new THREE.AnimationMixer(this);
        this.lightMixer = new THREE.AnimationMixer(this.light);
        this.shaderTime = 0;
    }

    play() {
        const movement = THREE.AnimationClip.findByName(this.animations, 'Sun');
        const light = THREE.AnimationClip.findByName(this.animations, 'SunLight');
        const color = THREE.AnimationClip.findByName(this.animations, 'SunColor');

        this.movementMixer.clipAction(movement).play();
        this.lightMixer.clipAction(light).play();
        this.lightMixer.clipAction(color).play();
    }

    #sunAngle(i) {
        const trueI = i * 360 / this.animationPeriod;
        return trueI * Math.PI / 180;
    }

    createAnimations() {
        let calculated = this.positionInTime();
        const times = calculated["times"], positions = calculated['positions']
        // Значения анимации во фреймах
        const visibles = [], intensities = [], colors = [];

        // Создаём фреймы в пределах анимации
        for (let i = 0; i < times.length; i++) {
            const y = positions[1 + i * 3];
            // Переключаем видимость солнца
            const visible = y >= -2;
            visibles.push(visible);
            // Изменяем интенсивность солнечного света
            const angle = this.#sunAngle(i);
            const intensity = Math.sin(angle) * this.maxIntensity;
            intensities.push(intensity);

            const greens = Math.sin(angle) * .8 + .1;
            const blues = Math.sin(angle) * .4 + .1;
            colors.push(1, greens, blues);
        }

        // Создаём треки
        const positionTrack = new THREE.VectorKeyframeTrack( '.position', times, positions, THREE.InterpolateSmooth);
        const visibleTrack = new THREE.BooleanKeyframeTrack('.visible', times, visibles, THREE.InterpolateDiscrete);
        const intensityTrack = new THREE.NumberKeyframeTrack('.intensity', times, intensities, THREE.InterpolateSmooth);
        const colorTrack = new THREE.VectorKeyframeTrack('.color', times, colors, THREE.InterpolateSmooth);

        // Создаём анимации
        const movementClip = new THREE.AnimationClip('Sun', -1, [positionTrack, visibleTrack]);
        const sunLightClip = new THREE.AnimationClip('SunLight', -1, [intensityTrack]);
        const sunColorClip = new THREE.AnimationClip('SunColor', -1, [colorTrack]);
        // Оптимизируем анимации
        movementClip.optimize();
        sunLightClip.optimize();
        sunColorClip.optimize();
        // Сохраняем анимации
        this.animations.push(movementClip, sunLightClip, sunColorClip);
    }

    positionInTime() {
        const times = [], positions = [];
        // Временный вектор для расчёта позиции
        const temp = new THREE.Vector3();

        for (let i = 0; i < this.animationPeriod; i++) {
            // Добавляем фрейм
            times.push(i);
            // Рассчитываем угол и положение солнца в текущем фрейме
            const angle = this.#sunAngle(i)
            const position = this.calculatePosition(angle);
            temp.set(position.x, position.y, 0).toArray(positions, positions.length);
        }
        return {times, positions};
    }

    #mesh() {
        const mesh = new THREE.Mesh();
        mesh.geometry = new THREE.SphereGeometry(2);
        mesh.material = new THREE.ShaderMaterial({
            vertexShader: sunVertex, fragmentShader: sunFragment,
            uniforms: {
                u_resolution: {
                    value: new THREE.Vector2(100, 100),
                },
                time: {
                    value: this.shaderTime,
                }
            }
        })
        return mesh;
    }

    calculatePosition(angle) {
        const x = Math.cos(angle) * this.R;
        const y = Math.sin(angle) * this.R;
        return {x, y};
    }
}

class Hex extends THREE.Object3D {
    constructor(featureData, times, positions) {
        super();

        const meanFloors = featureData['mean_floors'];
        const maxFloors = featureData['max_floors'];
        const meanYear = featureData['year_mean'];
        const maxYear = featureData['year_max'];
        const commercialRatio = featureData['commercial_ratio'];
        const cost = featureData['cost_mean_normalized'];

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
        TrunkMaterial.color.set(new THREE.Color('#283618'));
        const Trunk = new THREE.Mesh();
        modelsLoader.load(`${modelsPath}/treeTrunk.obj`, function (object) {
            Trunk.geometry = object.children[0].geometry;
        })
        Trunk.material = TrunkMaterial;
        this.add(Trunk);

        // Создаём листья
        const LeavesMaterial = new THREE.MeshLambertMaterial();
        LeavesMaterial.color.set(new THREE.Color('#606C38'));
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
textureLoader.load(`${modelsPath}/firstFloor4.png`, function (texture) {
    FirstFloorMaterial.map = texture;
    console.log('Загружена текстура первого этажа')
}, undefined, function(error) { console.log(error) })
const OtherFloorMaterial = new THREE.MeshLambertMaterial();
textureLoader.load(`${modelsPath}/Otherfloor1.png`, function (texture) {
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
        modelsLoader.load(`${modelsPath}/firstFloor3.obj`, function(object){
            floorObject.geometry = object.children[0].geometry;
            console.log('Загружена геометрия первого этажа')
        }, undefined, function(error) {console.log(error)})
        floorObject.material = FirstFloorMaterial;
        this.add(floorObject);
    }

    #otherFloor(floorNumber) {
        const floor = new THREE.Mesh();
        modelsLoader.load(`${modelsPath}/otherFloor2.obj`, function (geometry) {
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
textureLoader.load(`${modelsPath}/shopColor.png`, function(texture) {
    ShopMaterial.map = texture;
    console.log('Загружена текстура магазина')
}, undefined, function(error) {console.log(error)});
const CartMaterial = new THREE.MeshLambertMaterial();
textureLoader.load(`${modelsPath}/cartColor.png`, function(texture) {
    CartMaterial.map = texture;
    console.log('Загружена текстура тележки');
}, undefined, function (error) {console.log(error)});
textureLoader.load(`${modelsPath}/cartGlossy.png`, function(texture) {
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

export {Hex, SunBase};