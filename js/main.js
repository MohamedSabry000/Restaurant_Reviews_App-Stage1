let restaurants, neighborhoods, cuisines;
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap(); // added
    fetchNeighborhoods();
    fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    neighborhoods.forEach(neighborhood => {
        var o = new Option( neighborhood, neighborhood);
        $('#neighborhoods-select').append(o);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    cuisines.forEach(cuisine => {
        var o = new Option( cuisine, cuisine);
        $('#cuisines-select').append(o);
    });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
    if (navigator.onLine) {
        try {
            newMap = L.map('map', {
                center: [40.722216, -73.987501],
                zoom: 12,
                scrollWheelZoom: false
            });
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                mapboxToken: MAPKEY.mapbox_key,
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(newMap);
        } catch (error) {
            console.log("Map couldn't be initialized", error);
            // If an error occurred while trying to initialize the map, set map as offline
            DBHelper.mapOffline();
        }
    } else {
        // If app detects we're offline, set map as offline
        DBHelper.mapOffline();
    }
    updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    
    const cuisine = $("select#cuisines-select").children("option:selected").val();
    const neighborhood = $("select#neighborhoods-select").children("option:selected").val();

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    });
};


/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    $('#restaurants-list').empty();
    //console.log($('#restaurants-list'));
    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(marker => marker.remove());
    }
    self.markers = [];
    self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        $('#restaurants-list').append(createRestaurantHTML(restaurant));
        
    });
    
    addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
    let cardContainer = $('<div class="col-lg-4"></div>')
    let card = $('<div class="card"></div>');

    $('<img />', { 
        'class': "restaurant-img img-responsive img-thumbnail card-img-top",
        src: DBHelper.imageUrlForRestaurant(restaurant),
        alt: restaurant.name
    }).appendTo(card);
    
    let cardBody = $('<div class="card-body"></div>')
    
    $('<h2>',{text: restaurant.name, class: 'card-title'}).appendTo(cardBody);
    $('<h5>',{text: restaurant.neighborhood, class: 'card-text'}).appendTo(cardBody);
    $('<p>',{text: restaurant.address, class: 'card-text'}).appendTo(cardBody);

    $('<a>',{
        text: 'View Details',
        title: 'Know More...',
        tabIndex: '0',
        'aria-label': `View details about ${restaurant.name}`,
        href: DBHelper.urlForRestaurant(restaurant),
        class: 'btn btn-primary'
    }).appendTo(cardBody);

    cardBody.appendTo(card);
    card.appendTo(cardContainer);
    
    return cardContainer;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    // if either newMap or L (leaflet) aren't defined exit early.
    if (!newMap || !L) return;
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
        marker.on("click", onClick);

        function onClick() {
            window.location.href = marker.options.url;
        }
        self.markers.push(marker);
    });

};