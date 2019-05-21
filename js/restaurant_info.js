let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            if (navigator.onLine) {
                try {
                    newMap = L.map('map', {
                        center: [restaurant.latlng.lat, restaurant.latlng.lng],
                        zoom: 16,
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
                    DBHelper.mapMarkerForRestaurant(self.restaurant, newMap);
                } catch (error) {
                    console.log("Map couldn't be initialized", error);
                    // If an error occurred while trying to initialize the map, set map as offline
                    DBHelper.mapOffline();
                }
            } else {
                //  If app detects we're offline, set map as offline
                DBHelper.mapOffline();
            }

            fillBreadcrumb();
        }
    });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    let id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant);
        });
    }
};


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    let container = $("#restaurant-details")
    
    let cardBody = $('<div class="card-body"></div>')
    
    $('<h5>',{
        id: "restaurant-name",
        text: restaurant.name,
        class: 'card-title',
        tabIndex: "0"
    }).appendTo(cardBody);
    
    $('<p>',{
        id: "restaurant-cuisine",
        text: restaurant.cuisine_type,
        class: 'card-text'
    }).appendTo(cardBody);
    
    $('<p>',{
        id: "restaurant-address",
        text: restaurant.address,
        class: 'card-text'
    }).appendTo(cardBody);
        
    $('<img />', { 
        id: "restaurant-img",
        'class': "restaurant-img img-responsive img-thumbnail restaurant-img card-img-top",
        src: DBHelper.imageUrlForRestaurant(restaurant),
        alt: `Picture of${restaurant.name}`
    }).appendTo(container);
    
    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML().appendTo(cardBody);
    }
    
    cardBody.appendTo(container);
    
    // fill reviews
    fillReviewsHTML();
};


/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    let table = $('<table id="restaurant-hours" class="table table-striped table-dark"></table>')
    $('<thead><tr><th>Day</th><th>Openning Times</th></tr></thead>').appendTo(table);
    
    let tbody = $('<tbody></tbody>');
    for (let key in operatingHours) {
        let row = $('<tr></tr>');

        $('<td>',{text: key}).appendTo(row);
        $('<td>',{text: operatingHours[key]}).appendTo(row);

        row.appendTo(tbody);
    }
    tbody.appendTo(table);
    
    return table;
};


/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    let container = $('#reviews-container');
    $(container).prepend('<h3 class="text-center">Reviews</h3>');

    if (!reviews) {
        $('<p>',{text: 'No reviews yet!'}).appendTo(container);
        return;
    }
    
    let ul = $('#reviews-list');
    var counter = 0;
    reviews.forEach(review => {
        createReviewHTML(review, counter).appendTo(ul);
        counter ++;
    });
};


/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, counter) => {

    let card = $('<div class="card mb-4 shadow-sm"></div>');
    let name = $('<div class="card-header"></div>')
    $('<h4>',{text: review.name, class:'my-0 font-weight-normal'}).appendTo(name);
    name.appendTo(card);

    let body = $('<div class="card-body"></div>');
    $('<h1 class="card-title pricing-card-title"><small class="text-muted">'+review.date+'</small></h1>').appendTo(body);
    
    let ul = $('<ul class="list-unstyled mt-3 mb-4"></ul>');
    $('<li>',{text: `Rating: ${review.rating}`}).appendTo(ul);
    
    ul.appendTo(body);
    
    let modal = 
        $(`<div class="modal fade" id="modal`+counter+`" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="reviewModalLabel">`+review.name+`</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                `+review.comments+`
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>`);
    
    let button = $(`<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#modal`+counter+`">
  View Comment
</button>`);
    button.appendTo(body);
    
    body.appendTo(card);
    $("#maincontent").append(modal);

    return card;
};


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    let breadcrumb = $('#breadcrumb');
    $('<li>',{text: restaurant.name, class: "breadcrumb-item active", 'aria-current': "page"}).appendTo(breadcrumb);
};


/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    let regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
