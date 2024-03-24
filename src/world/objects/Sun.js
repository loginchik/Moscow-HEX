import * as THREE from "three";

const sunVertex = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const sunFragment = `
#define EPSILON 0.02

varying vec2 vUv;
uniform vec2 u_resolution;
uniform float time;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float influence1 = abs(sin(time + uv.x * .8));
    float influence2 = abs(cos(time + uv.y * .3));

    float green = influence1 * influence2;
    float red = abs(sin(time + ((uv.x + uv.y) / 2.))) * .2 + .8;
    
    vec3 col = vec3(red, green, 0.);
    gl_FragColor = vec4(col, 1.0);
}
`

export class SunBase extends THREE.Object3D {
    R;

    constructor(R = 63, animationPeriod = 20) {
        super();
        this.name = 'Sun';
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
