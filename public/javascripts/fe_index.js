// Generate formating CSS element to resize map
function createClass(name,rules){
    var style = document.createElement('style');
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    if(!(style.sheet||{}).insertRule) 
    (style.styleSheet || style.sheet).addRule(name, rules);
    else
    style.sheet.insertRule(name+"{"+rules+"}",0);
}
createClass('#map',"height: 700px;");

var markers = [];
var ioSocketIsOpen = false;
var ioSocket
var moveOldMarker = false;
var moveOldMarkerDd

function delMarker(markerDbId) {
    var r = confirm("You sure?");
    if (r == true) {
        console.log("Deleting marker "+markerDbId+".");
        if (ioSocketIsOpen) {
            var req = {
                type: 'delOne',
                date: Date.now(),
                data: markerDbId
            };
            console.log(req);
            ioSocket.send(JSON.stringify(req));
        } else {
            console.log("ERROR, unable to delete marker, ioSocket is down.");
        }
    }  
}
function moveMarker(markerDbId) {
    var r = confirm("You sure?");
    if (r == true) {
        moveOldMarker = true;
        moveOldMarkerId = markerDbId;
        if(typeof openinfowindow !== 'undefined') { 
            openinfowindow.close();
        }
    }
}
function addMarker() {
    if (document.querySelectorAll('#newMarkerName')[0].value && document.querySelectorAll('#newMarkerComment')[0].value && typeof $.grep(document.querySelectorAll('#newMarkerIcon'), function(obj){return obj.checked === true;})[0] !== 'undefined') {
        if (ioSocketIsOpen) {
            data = {
                position: {
                    lat: document.querySelectorAll('#newMarkerLat')[0].value,
                    lng: document.querySelectorAll('#newMarkerLng')[0].value
                },
                name: document.querySelectorAll('#newMarkerName')[0].value,
                icon: $.grep(document.querySelectorAll('#newMarkerIcon'), function(obj){return obj.checked === true;})[0].value,
                content: document.querySelectorAll('#newMarkerComment')[0].value
            };
            
            var req = {
                type: 'addOne',
                date: Date.now(),
                data: data
            };
            console.log(req);
            ioSocket.send(JSON.stringify(req));
        } else {
            console.log("ERROR, unable to add new marker, ioSocket is down.");
        }
        
        if(typeof temporaryMarker !== 'undefined') {
            temporaryMarker.setMap(null);
        }
        
    } else {
        window.alert("You need to fill all the fields and select icon!");
    }
}

function saveMarker() {
    if (ioSocketIsOpen) {
        data = {
            position: {
                lat: document.querySelectorAll('#markerNewLat')[0].value,
                lng: document.querySelectorAll('#markerNewLng')[0].value
            },
            id: moveOldMarkerId
        };
        
        var req = {
            type: 'moveOne',
            date: Date.now(),
            data: data
        };
        console.log(req);
        ioSocket.send(JSON.stringify(req));
    } else {
        console.log("ERROR, unable to move marker, ioSocket is down.");
    }
}

function pointNewMarker(parentEvent) {
    if(typeof temporaryMarker !== 'undefined') {
        temporaryMarker.setMap(null);
    }
    if (moveOldMarker) {
        var obj = $.grep(markers, function(obj){return obj._id === moveOldMarkerId;})[0];
        console.log(obj);
        obj.setPosition(parentEvent.latLng);
        obj.infoWindow = temporaryInfoWindow;
        obj.infoWindow.setContent('<input type="hidden" id="markerNewLat" value="'+parentEvent.latLng.lat()+'">'+
        '<input type="hidden" id="markerNewLng" value="'+parentEvent.latLng.lng()+'">'+
        '<button onclick="saveMarker();" id="saveMarker">Save</button><br></br>');
        if(typeof openinfowindow !== 'undefined') { 
            openinfowindow.close();
        }
        obj.infoWindow.open(map, obj);
    } else {
        temporaryMarker = new google.maps.Marker({
            position: parentEvent.latLng,
            map: map
        });
        temporaryMarker.infowindow = temporaryInfoWindow;
        temporaryMarker.infowindow.setContent('<input type="hidden" id="newMarkerLat" value="'+parentEvent.latLng.lat()+'">'+
        '<input type="hidden" id="newMarkerLng" value="'+parentEvent.latLng.lng()+'">'+
        '<input type="text" id="newMarkerName" placeholder="Marker name"><br>'+
        '<input type="text" id="newMarkerComment" placeholder="Marker comment"><br>'+
        'Marker icon:<br><img src="http://start.hk.tlu.ee/sahtelbeta/icon.ico"><input type="radio" id="newMarkerIcon" name="newMarkerIcon" value="http://start.hk.tlu.ee/sahtelbeta/icon.ico">'+
        '<img src="https://maps.google.com/mapfiles/kml/shapes/parking_lot_maps.png"><input type="radio" id="newMarkerIcon" name="newMarkerIcon" value="https://maps.google.com/mapfiles/kml/shapes/parking_lot_maps.png">'+
        '<img src="https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png"><input type="radio" id="newMarkerIcon" name="newMarkerIcon" value="https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png">'+
        '<br>'+
        '<button onclick="addMarker();" id="addMarker">Add new marker</button><br>');
        if(typeof openinfowindow !== 'undefined') { 
            openinfowindow.close();
        }
        temporaryMarker.infowindow.open(map, temporaryMarker);
    }
}

function renderMarker(marker) {
    marker.map = map;
    var mapsMarker = new google.maps.Marker(marker);
    mapsMarker.infowindow=new google.maps.InfoWindow();
    google.maps.event.addListener(mapsMarker, 'click', function() {
        mapsMarker.infowindow.setContent('<H1>'+this.name+'</H1><br><p>'+this.content+'</p><br><button onclick="delMarker(\''+this._id+'\')">Delete Marker</button><button onclick="moveMarker(\''+this._id+'\')">Move Marker</button>');
        if(typeof openinfowindow !== 'undefined') { 
            openinfowindow.close();
        }
        if(typeof temporaryMarker !== 'undefined') {
            temporaryMarker.setMap(null);
        }
        mapsMarker.infowindow.open(map, this);
        openinfowindow = mapsMarker.infowindow;
    });
    markers.push(mapsMarker);
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 58.935561, lng: 23.541794 },
        zoom: 18
    });
    
    initioSocket();
    
    google.maps.event.addListener(map, 'click', function(event){
        pointNewMarker(event);
    });
    
    temporaryInfoWindow = new google.maps.InfoWindow();
    
    google.maps.event.addListener(temporaryInfoWindow,'closeclick',function(){
        if(typeof temporaryMarker !== 'undefined') {
            temporaryMarker.setMap(null);
        }
    });
    
}

function initioSocket() {
    ioSocket = new WebSocket("ws://localhost:8080/", "superapp-protocol");
    
    ioSocket.onmessage = function (event) {
        console.log('Data from server:');
        console.log(JSON.parse(event.data));
        parsedData = JSON.parse(event.data);
        reqType = parsedData.type;
        switch(reqType) {
            case "getAll":
            console.log('Request type: getAll');
            allMarkers = parsedData.data;
            var infowindow = new google.maps.InfoWindow();
            for (i = 0; i < allMarkers.length; i++) {
                renderMarker(allMarkers[i], i);
            }
            break;
            case "getOne":
            renderMarker(parsedData.data);
            break;
            case "delOne":
            if (parsedData.data.status === "DONE") {
                var obj = $.grep(markers, function(obj){return obj._id === parsedData.data.mId;})[0];
                obj.setMap(null);
                markers = $.grep(markers, function(obj){return obj._id === parsedData.data.mId;}, true);
            }
            break;
            default:
            console.log(reqType);
        }
    }
    ioSocket.onopen = function (event) {
        ioSocketIsOpen = true;
        
        var req = {
            type: 'getAll',
            date: Date.now()
        };
        
        ioSocket.send(JSON.stringify(req));
    };
}



$.getScript( "https://maps.googleapis.com/maps/api/js?key=AIzaSyBGddUsBz7guYYMh-HZJk827nFNvudkUTE&callback=initMap" )
.done(function( script, textStatus ) {
    console.log( 'Google maps API load ' + textStatus );
})
.fail(function( jqxhr, settings, exception ) {
    $( "div.log" ).text( "Triggered ajaxError handler." );
});