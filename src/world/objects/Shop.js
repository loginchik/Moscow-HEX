import * as THREE from "three";
import {modelsLoader, modelsPath, textureLoader, texturesPath} from "./world_objects";

// Содержит геометрию здания магазина и cartCount геометрий тележек,
// расположенных перед магазином.
export class Shop extends THREE.Object3D {
    constructor(cartCount, hexID) {
        super();
        // Присваиваем магазину уникальное имя
        this.name = `${hexID}_shop`;

        // Создаём объект здания
        const ShopMaterial = new THREE.MeshLambertMaterial();
        textureLoader.load(`${texturesPath}/shopColor.png`, function(texture) {
            ShopMaterial.map = texture;
            console.log('Загружена текстура магазина')
        }, undefined, function(error) {console.log(error)});
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