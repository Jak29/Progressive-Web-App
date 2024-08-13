const searchTerms = ['Clouds', 'Waterfalls', 'Sunset'];
let worker;

function setupWebWorker() {
    if ("serviceWorker" in navigator) {
        worker = new Worker("worker.js");
        worker.onmessage = function(event) {
            handleWorkerMessages(event.data);
        };
    }
}

function handleWorkerMessages(data) {
    if (data.results) {
        displayResults(data.results);
    }
    if (data.progress) {
        updateProgress(data.progress, data.total);
    }
    if (data.finished) {
        enableButtons();
    }
}

function searchFilms(searchTerm) {
    if (!navigator.onLine) {
        alert("You are offline.");
        return;
    }
    worker.postMessage({ searchTerm: searchTerm.trim() });
    disableButtons();
}

function displayResults(results) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';
    results.forEach(result => {
        const button = document.createElement('button');
        button.classList.add('button');
        button.innerHTML = result.title;
        button.onclick = () => window.open(result.url);
        container.appendChild(button);
    });
}

function updateProgress(current, total) {
    const progressElement = document.getElementById('searchProgress');
    progressElement.textContent = `${current} / ${total}`;
}

function createSearchButtons() {
    const buttonContainer = document.getElementById('buttonContainer');
    buttonContainer.innerHTML = '';  

    searchTerms.forEach(term => {
        const button = document.createElement('button');
        button.classList.add('button');
        button.textContent = term;
        button.onclick = () => fetchImages(term);
        buttonContainer.appendChild(button);
    });
}

function ImageLoader(url, title) {
    this.url = url;
    this.title = title;

    this.loadImage = function(container) {
        return new Promise((resolve) => {
            const img = document.createElement('img');
            img.src = './icons/loader.gif';
            img.alt = 'Loading...';
            img.className = 'photo';
            container.appendChild(img);

            const actualImage = new Image();
            actualImage.onload = () => {
                img.src = this.url;
                img.onclick = () => showImageTitle(this.title);
                resolve(true);
            };
            actualImage.onerror = () => {
                img.src = './icons/error.png';
                resolve(false);
            };
            actualImage.src = this.url;
        });
    };
}

function fetchImages(searchTerm) {
    alert('Fetching images for ' + searchTerm);
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = ''; 


    for (let i = 0; i < 10; i++) {  
        const img = document.createElement('img');
        img.src = './icons/loader.gif';
        img.alt = 'Loading image...';
        img.className = 'photo';
        imageContainer.appendChild(img);
    }

    const script = document.createElement('script');
    script.src = `https://api.flickr.com/services/feeds/photos_public.gne?format=json&jsoncallback=displayImages&tags=${encodeURIComponent(searchTerm)}`;
    script.onerror = () => {
        alert('Failed to fetch images, check internet connection.');
        enableButtons();
    };
    document.head.appendChild(script);
    disableButtons();
}

function displayImages(data) {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = ''; 

    const itemsToDisplay = data.items.slice(0, 10); 
    const promises = itemsToDisplay.map(item => {
        const loader = new ImageLoader(item.media.m, item.title);
        return loader.loadImage(imageContainer); 
    });

    Promise.all(promises).then(() => {
        enableButtons(); 
        localStorage.setItem('lastSearch', JSON.stringify(itemsToDisplay.map(item => item.media.m)));
    }).catch(error => {
        console.error('Error loading some images:', error);
        enableButtons();
    });
}



function showImageTitle(title) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.fontSize = '2em';
    overlay.style.color = 'white';
    overlay.textContent = title;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

function loadImagesFromLocalStorage() {
    const imageContainer = document.getElementById('imageContainer');
    const storedUrls = localStorage.getItem('lastSearch');
    imageContainer.innerHTML = '';

    if (storedUrls) {
        const urls = JSON.parse(storedUrls);
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
            img.alt = 'Loaded image';
            imageContainer.appendChild(img);
        });
    } else {
        imageContainer.innerHTML = '<p>No images available.</p>';
    }
}

function clearFlickrCache() {
    console.log('Clearing Cache');
    caches.open('jak').then(cache => {
        cache.keys().then(keys => {
            keys.forEach(request => {
                if (request.url.includes('/photos_public.gne')) { 
                    cache.delete(request);
                }
            });
        });
    });
    console.log('Flickr specific cache cleared.');
    localStorage.removeItem('lastSearch'); 
}

function disableButtons() {
    document.querySelectorAll('#buttonContainer .button').forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.5'; 
    });
}

function enableButtons() {
    document.querySelectorAll('#buttonContainer .button').forEach(button => {
        button.disabled = false;
        button.style.opacity = '1'; 
    });
}

function attachSearchButtonListener() {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            searchFilms(searchInput.value);
        });
    } 
    console.log("Searching")
}

function attachDeleteButtonListeners() {
    const deleteCacheButton = document.getElementById('deleteCacheButton');
    if (deleteCacheButton) {
        deleteCacheButton.addEventListener('click', clearFlickrCache);
    } 
    console.log("Deleting")
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {navigator.serviceWorker.register('./serviceWorker.js')});
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Document is ready.');
    setupWebWorker();
    attachSearchButtonListener();
    attachDeleteButtonListeners();
    createSearchButtons();
    loadImagesFromLocalStorage();
});

