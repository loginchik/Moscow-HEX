import * as THREE from "three";


const raycaster = new THREE.Raycaster()
function ManageIntersections(mouse, currentCamera, objects) {
    let hexID;
    raycaster.setFromCamera(mouse, currentCamera);
    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        const closest = intersects[0].object;
        const intersectingHexID = getHexIDFromIntersection(closest);
        if (intersectingHexID !== null) {
            hexID = intersectingHexID;
        } else {
            hexID = null;
        }
    } else {
        hexID = null;
    }
    return hexID
}

function getHexIDFromIntersection(closestObject) {
    let hexID;
    if (closestObject.name === '') {
        let object = closestObject;
        let objectName = object.name;
        while (objectName === '') {
            object = object.parent;
            objectName = object.name;
        }
        hexID = objectName;
    } else {
        hexID = closestObject.name;
    }
    if (hexID !== '') {
        if (hexID.includes('HEX')) {
            return hexID.split('_')[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
}

export {ManageIntersections}