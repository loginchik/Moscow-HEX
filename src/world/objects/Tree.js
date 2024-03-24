import * as THREE from "three";
import colors from "../../colors.json";
import {modelsLoader, modelsPath} from "./world_objects";

export class Tree extends THREE.Group {
    constructor(leavesCount) {
        super();
        // Создаём ствол
        const TrunkMaterial = new THREE.MeshLambertMaterial();
        TrunkMaterial.color.set(new THREE.Color(colors["tree"]["trunk"]));
        const Trunk = new THREE.Mesh();
        // Trunk.geometry = LoadTrunkGeometry()
        modelsLoader.load(`${modelsPath}/treeTrunk.obj`, function (object) {
            Trunk.geometry = object.children[0].geometry;
            console.log('Загружена геометрия ствола дерева')
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