import * as THREE from "three";
import {OBJLoader} from "three/addons";
import {modelsPath} from "./world_objects";
const modelsLoader = new OBJLoader(THREE.DefaultLoadingManager);

// Содержит геометрию птицы и анимацию её полёта.
export class Bird extends THREE.Object3D {
    constructor(name) {
        super();
        this.name = name;
        // Создаём материал со случайным цветом птицы
        const BirdMaterial = new THREE.MeshLambertMaterial();
        BirdMaterial.color.set(this.#materialRandomColor());
        // Загружаем геометрию птицы и создаём геометрический объект
        const birdMesh = new THREE.Mesh();
        modelsLoader.load(`${modelsPath}/bird.obj`, function( object ){
            birdMesh.geometry = object.children[0].geometry;
            console.log('Загружена геометрия птицы');
        })
        birdMesh.material = BirdMaterial;
        // Добавляем геометрический объект в объект
        this.add(birdMesh);
        // Масштабируем и позиционируем птицу
        this.scale.set(.1, .1, .1);
        this.zRotation =  this.#rotationZ();
        this.rotation.z = this.zRotation * Math.PI / 180;
        this.position.x = Bird.mappedPosition(0, .8);
        this.position.y = Bird.mappedPosition(0, 5);
        this.position.z = Bird.mappedPosition(0, 2.5);
        // Создаём анимацию полёта
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

    #materialRandomColor() {
        const red = Math.random() * .3 + .7;
        const green = Math.random() * .5 + .5;
        const blue = Math.random() * .3 + .7;
        return new THREE.Color(red, green, blue);
    }

    static mappedPosition(minPos, maxPos) {
        return (maxPos - minPos) * Math.random() + minPos;
    }
}