import * as THREE from "three";
import {OBJLoader} from "three/addons";

const modelsLoader = new OBJLoader(THREE.DefaultLoadingManager);
const modelsPath = '../../assets/models';
const textureLoader = new THREE.TextureLoader(THREE.DefaultLoadingManager);

const ShopMaterialTexture = textureLoader.load(`../assets/textures/shopColor.png`);
const ShopMaterial = new THREE.MeshLambertMaterial({
    map: ShopMaterialTexture,
});

const CartColor = textureLoader.load(`../assets/textures/cartColor.png`);
const CartSpecular = textureLoader.load(`../assets/textures/cartGlossy.png`);
const CartMaterial = new THREE.MeshLambertMaterial({
    map: CartColor,
    specularMap: CartSpecular,
    transparent: true,
});

// Содержит геометрию здания магазина и cartCount геометрий тележек,
// расположенных перед магазином.
export class Shop extends THREE.Object3D {
    constructor(cartCount, hexID) {
        super();
        // Присваиваем магазину уникальное имя
        this.name = `${hexID}_shop`;

        // Создаём объект здания
        const ShopBuilding = new THREE.Mesh();
        modelsLoader.load(`${modelsPath}/shop.obj`, function(object) {
            ShopBuilding.geometry = object.children[0].geometry;
            console.log('Загружена геометрия магазина')
        }, undefined, function (error) {console.log(error)});
        ShopBuilding.material = ShopMaterial;
        this.add(ShopBuilding);

        // Создаём массив тележек и добавляем их в объект
        const carts = this.#createCarts(cartCount, hexID);
        this.add(...carts);
    }

    // Создаёт массив тележек, состоящий из cartCount объектов тележек,
    // которые затем могут быть добавлены на сцену
    #createCarts(cartCount, hexID) {

        const carts = [];
        for (let c = 0; c < cartCount; c++) {
            const cartObject = new THREE.Mesh();
            // Загружаем геометрию
            modelsLoader.load(`${modelsPath}/shoppingCart.obj`, function(object) {
                cartObject.geometry = object.children[0].geometry;
                console.log('Загружена магазинная тележка');
            }, undefined, function(error) {console.log(error)});
            // Присваиваем материал
            cartObject.material = CartMaterial;
            // Масштабируем и позиционируем
            cartObject.scale.set(.1, .1, .1);
            cartObject.position.set(0.8, -0.4, 1.1 - c * 0.24);
            // Присваиваем уникальное имя
            cartObject.name = `${hexID}_cart${c}`;
            // Добавляем в массив тележек
            carts.push(cartObject);
        }
        return carts;
    }
}