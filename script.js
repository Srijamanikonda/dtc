// Create the map and set its view to the center of Delhi
const map = L.map('map').setView([28.6139, 77.209], 12);

// Load and display tile layers on the map (OpenStreetMap tiles)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Simulated bus routes and bus stops
const routes = {
    1: {
        name: "Bus 101 - Route 1",
        stops: [
            { name: "Connaught Place", lat: 28.632896, lng: 77.219677 },
            { name: "Karol Bagh", lat: 28.652751, lng: 77.188654 },
            { name: "Rajendra Place", lat: 28.644800, lng: 77.174470 },
            { name: "Patel Nagar", lat: 28.651748, lng: 77.155542 },
            { name: "Janakpuri", lat: 28.625539, lng: 77.092967 }
        ]
    },
    2: {
        name: "Bus 102 - Route 2",
        stops: [
            { name: "ISBT", lat: 28.666315, lng: 77.234590 },
            { name: "Red Fort", lat: 28.656159, lng: 77.241020 },
            { name: "Chandni Chowk", lat: 28.656473, lng: 77.230328 },
            { name: "Kashmere Gate", lat: 28.667165, lng: 77.227860 },
            { name: "Vivek Vihar", lat: 28.678147, lng: 77.316812 }
        ]
    }
};

// Icons for buses
const busIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995537.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

// Variables to store bus markers and polylines (routes)
let busMarkers = {};
let routeLines = {};
let selectedRoute = null;
let currentBusLocation = null;
const minutesBetweenStops = 5; // Simulation: 5 minutes between each stop

// Function to create markers for bus stops
function addBusStops(route) {
    const stopSelector = document.getElementById('stop-selector');
    stopSelector.innerHTML = '<option value="">Select a Stop</option>';
    route.stops.forEach((stop, index) => {
        L.marker([stop.lat, stop.lng]).addTo(map).bindPopup(stop.name);
        const option = document.createElement('option');
        option.value = index;
        option.textContent = stop.name;
        stopSelector.appendChild(option);
    });
    stopSelector.classList.remove('hidden');
}

// Function to create stop options for driver dashboard
function populateDriverStops(route) {
    const driverLocationSelector = document.getElementById('driver-location');
    driverLocationSelector.innerHTML = '';  // Clear the existing options
    route.stops.forEach((stop, index) => {
        const option = document.createElement('option');
        option.value = stop.name;
        option.textContent = stop.name;
        driverLocationSelector.appendChild(option);
    });
}

// Function to display the entire bus route on the map
function drawRoute(routeId) {
    const route = routes[routeId];
    selectedRoute = routeId;

    if (routeLines[routeId]) {
        map.removeLayer(routeLines[routeId]); // Remove previous route line if exists
    }

    const latlngs = route.stops.map(stop => [stop.lat, stop.lng]);
    routeLines[routeId] = L.polyline(latlngs, { color: 'blue' }).addTo(map);
    map.fitBounds(routeLines[routeId].getBounds());
}

// Function to update bus location on the map (simulated GPS tracking)
function updateBusLocation(routeId, locationName) {
    const route = routes[routeId];
    const stop = route.stops.find(stop => stop.name === locationName);
    currentBusLocation = route.stops.indexOf(stop);

    if (stop) {
        if (busMarkers[routeId]) {
            busMarkers[routeId].setLatLng([stop.lat, stop.lng]);
        } else {
            busMarkers[routeId] = L.marker([stop.lat, stop.lng], { icon: busIcon }).addTo(map)
                .bindPopup(`${route.name} currently at ${stop.name}`);
        }
        busMarkers[routeId].getPopup().setContent(`${route.name} currently at ${stop.name}`).openPopup();
    }
}

// Function to calculate ETA based on current bus location and selected stop
function calculateETA(routeId) {
    const stopSelector = document.getElementById('stop-selector');
    const selectedStopIndex = parseInt(stopSelector.value);
    const route = routes[routeId];

    if (currentBusLocation !== null && selectedStopIndex >= currentBusLocation) {
        const stopsToGo = selectedStopIndex - currentBusLocation;
        const eta = stopsToGo * minutesBetweenStops;
        return eta;
    }

    return null;
}

// Show user dashboard
document.getElementById('user-dashboard').addEventListener('click', () => {
    document.getElementById('driver-info').classList.add('hidden');
    document.getElementById('user-info').classList.remove('hidden');
});

// Show driver dashboard
document.getElementById('driver-dashboard').addEventListener('click', () => {
    document.getElementById('user-info').classList.add('hidden');
    document.getElementById('driver-info').classList.remove('hidden');
    const selectedRouteId = document.getElementById('route-selector').value;
    populateDriverStops(routes[selectedRouteId]);
});

// Handle route selection in driver dashboard
document.getElementById('route-selector').addEventListener('change', function() {
    const selectedRouteId = this.value;
    populateDriverStops(routes[selectedRouteId]);
});

// Handle bus selection for users to display route and current bus location
document.getElementById('bus-selector').addEventListener('change', function() {
    const selectedBus = this.value;
    if (selectedBus) {
        drawRoute(selectedBus); // Draw the route on the map
        addBusStops(routes[selectedBus]); // Add bus stops markers
    }
});

// Handle stop selection for ETA calculation
document.getElementById('stop-selector').addEventListener('change', function() {
    const selectedBus = document.getElementById('bus-selector').value;
    const eta = calculateETA(selectedBus);
    if (eta !== null) {
        document.getElementById('bus-info').textContent = `ETA to selected stop: ${eta} minutes.`;
    } else {
        document.getElementById('bus-info').textContent = `The bus has already passed the selected stop.`;
    }
});

// Handle location reporting for drivers
document.getElementById('report-location').addEventListener('click', function() {
    const selectedRouteId = document.getElementById('route-selector').value;
    const location = document.getElementById('driver-location').value;
    
    updateBusLocation(selectedRouteId, location);
    document.getElementById('location-confirmation').innerText = `Location updated: ${location}`;

    // Update ETA for the next stop in the driver dashboard
    const eta = calculateETA(selectedRouteId);
    if (eta !== null) {
        document.getElementById('driver-eta').textContent = `Next stop ETA: ${eta} minutes.`;
    } else {
        document.getElementById('driver-eta').textContent = `No more upcoming stops.`;
    }
});

