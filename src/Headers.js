import worldInfoElements from "./worldInfoElements.json";

function createWorldInfoHeader() {
    const worldInfo = document.createElement('header')
    worldInfo.id = 'worldInfo';
    for (let element of worldInfoElements) {
        const htmlElement = document.createElement(element['tag']);
        if (element['id'] !== null) {
            htmlElement.id = element['id'];
        }
        htmlElement.innerHTML = element['text'];
        worldInfo.appendChild(htmlElement);
    }
    return worldInfo;
}

function createHexInfoHeader() {
    const header = document.createElement('header');
    header.id = 'hexInfo';

    const heading = document.createElement('h1');
    heading.innerHTML = 'HEX #<span id="hexID"></span>';
    header.appendChild(heading);

    const meanTable = document.createElement('table');
    meanTable.innerHTML =
        '<tr>\n' +
        '<td class="row-label">Этажей в&nbsp;среднем</td>\n' +
        '<td  class="row-value" id="hexMeanFloors"></td>\n' +
        '</tr>\n' +
        '<tr>\n' +
        '<td class="row-label">Средний год постройки</td>\n' +
        '<td  class="row-value" id="hexMeanYear"></td>\n' +
        '</tr>';
    header.appendChild(meanTable);

    const maxTable = document.createElement('table');
    maxTable.innerHTML =
        '<tr>\n' +
        '<td class="row-label">Этажей в&nbsp;высочайшем здании</td>\n' +
        '<td  class="row-value" id="hexMaxFloors"></td>\n' +
        '</tr>\n' +
        '<tr>\n' +
        '<td class="row-label">Год постройки</td>\n' +
        '<td class="row-value" id="hexMaxYear"></td>\n' +
        '</tr>'
    header.appendChild(maxTable);

    const otherTable = document.createElement('table');
    otherTable.innerHTML =
        '<tr>\n' +
        '<td class="row-label" title="Назначение здания фиксируется при&nbsp;регистрации кадастрового объекта">\n' +
        'Доля коммерческой застройки\n' +
        '</td>\n' +
        '<td class="row-value"><span id="hexCommercial"></span>%</td>\n' +
        '</tr><tr>\n' +
        '<td class="row-label">Место среди гексов по&nbsp;средней кадастровой стоимости (1&nbsp;&mdash; макс.)</td>\n' +
        '<td class="row-value"><span id="hexCostPlace"></span>/<span id="hexCount">24</span>\n' +
        '</tr>';
    header.appendChild(otherTable);

    return header;
}

function createTopNavigation() {
    const button = document.createElement('button');
    button.id = 'backToWorldButton';
    button.title = 'К миру';
    button.innerHTML = '<span class="icon">&larr;</span>';

    const navigation = document.createElement('nav');
    navigation.id = 'top';
    navigation.appendChild(button);
    return navigation;
}


export {createHexInfoHeader, createWorldInfoHeader, createTopNavigation};