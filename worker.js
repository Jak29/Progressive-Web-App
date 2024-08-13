var films = {};

self.onmessage = function(e) {
    const searchTerm = e.data.searchTerm.toLowerCase();
    const results = [];
    const total = Object.keys(films).length;
    let count = 0;

    for (const id in films) {
        const film = films[id];
        if (film.title.toLowerCase().includes(searchTerm)) {
            results.push({
                title: film.title.replace(new RegExp(searchTerm, 'gi'), match => `<mark>${match}</mark>`),
                url: film.link
            });
        }
        count++;
        if (count % 100 === 0 || count === total) { 
            self.postMessage({ progress: count, total: total });
        }
    }

    self.postMessage({ results: results, finished: true });
};

function processFilms(data) {
    films = data;
}

importScripts('movieObj.js');
