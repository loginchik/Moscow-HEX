function setupLoadingElements(progress) {
    const box = document.createElement('div');
    box.id = 'loadingBox';
    const bar = document.createElement('div');
    bar.id = 'loadingBar';

    box.style.width = '100px';
    box.style.height = '10px';
    box.style.top = `${(window.innerHeight - 10) / 2}px`;
    bar.style.top = `${(window.innerHeight - 10) / 2}px`;
    box.style.left = `${(window.innerWidth - 100) / 2}px`;
    bar.style.left = `${(window.innerWidth - 100) / 2}px`;

    document.body.appendChild(box);
    document.body.appendChild(bar);

    updateProgress(progress);
}

function updateProgress(progress) {
    const loadingBar = document.getElementById('loadingBar');
    loadingBar.style.width = `${progress * 100}px`;
}

function removeLoadingElements() {
    const box = document.getElementById('loadingBox');
    const bar = document.getElementById('loadingBar');
    box.remove();
    bar.remove();
}

export {setupLoadingElements, removeLoadingElements, updateProgress};