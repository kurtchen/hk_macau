$(document).ready(function(){
	
	// Load Google Map
    loadGMap();
	
	// Setup for Google Map
	$("body").bind("unload", GUnload);
	
	// Get the groups
	$.getJSON('json/groups.json', setGroups);

});

/*
  After get the group data from server, add them to tab area.
*/
function setGroups(data){
    // Remove the loading image
    $('#tab_menu').empty();
    // Add the groups
    $.each(data, function(entryInx, entry){
	var groupsHtml = '<span id="tab_';
	groupsHtml += entry['id'];
	groupsHtml += '"><img class="CameraIcon" src="';
	groupsHtml += entry['image_url'];
	groupsHtml += '"/>';
	groupsHtml += entry['name'];
	groupsHtml += '</span>';
	$('#tab_menu').append(groupsHtml);
    });

    // Init the group tabs
    initTabs();
}

/*
  Init the group tabs.
*/
function initTabs(){
    // Selet first group
    $(".TabsArea .TabMenu span:first").addClass("selector");
    
    //Set hover effect for the tabs
    $(".TabsArea .TabMenu span").mouseover(function(){
	$(this).addClass("hovering");
    });
    $(".TabsArea .TabMenu span").mouseout(function(){
	$(this).removeClass("hovering");
    });
    
    //Add click action to tab menu
    $(".TabsArea .TabMenu span").click(function(){
        //Remove the exist selector
        $(".selector").removeClass("selector");
        //Add the selector class to the sender
        $(this).addClass("selector");
	
        // Get the spots and update the slider
        $(".ScrollContainer").append('<img src="img/loading.gif" width="220" height="19"/>');
        curGroup = this.id.substr(this.id.lastIndexOf("_")+1);
        $.getJSON("json/group"+curGroup+".json", setSpot);
    });
    
    // Init loading image for slider
    $(".ScrollContainer").append('<img src="img/loading.gif" width="220" height="19"/>');
    
    // Get First group of spots
    curGroup = 1;
    $.getJSON("json/group1.json", setSpot);
}

/*
  Set the spots to the slider.
*/
function setSpot(data){
    // Remove the previous group of spots or the loading image
    $('.ScrollContainer').empty();
    // Add the spots
    $.each(data, function(entryIdx, entry){
        var spotHtml = '<div class="Panel" id="panel_';
        spotHtml += (entryIdx+1);
        spotHtml += '"><div class="inside"><img src="';
        spotHtml += entry['image_url'];
        spotHtml += '" alt="';
        spotHtml += entry['description'];
        spotHtml += '" /><span>';
        spotHtml += entry['name'];
        spotHtml += '</span></div></div>';
        //alert(spotHtml);
        $('.ScrollContainer').append(spotHtml);
        
        // Set Lat & Lng info
        $("#panel_"+(entryIdx+1)).data("lat",entry["latitude"]);
        $("#panel_"+(entryIdx+1)).data("lng",entry["longitude"]);
        $("#panel_"+(entryIdx+1)).data("zoom",entry["zoom"]);
	
    });
    
    // Init Slider
    //console.debug("calling initSlider");
    initSlider();
}

/*
 Init Slider.
*/
function initSlider(){
    // Caculte the total width of the slider
    var $panels = $(".Panel");
    var width = $panels[0].offsetWidth * $panels.length + 100;
    // The first spot is in the middle at the begining
    $(".ScrollContainer").css("width", width).css("left", "350px");
    // The first spot will be bigger at first
    makeBigger("#panel_1");
    curPanel = 1;
    updatePanelEventHandlers();
    maxPanel = $panels.length;
    $("#slider").data("currentlyMoving", false);
    
    // Add event handler for navigate buttons
    $(".right").click(function(){ navigate(true); });	
    $(".left").click(function(){ navigate(false); });
    
    //console.debug("calling moveMap");
    moveMap();
}

/*
 Make the panel bigger.
*/
function makeBigger(element){
    $(element).animate({ width: biggerWidth })
              .find("img").animate({width: biggerImgWidth})
	      .end()
	      .find("span").animate({fontSize: biggerFontSize});
}

/*
 Make the panel to normal size
*/
function makeNormal(element){
    $(element).animate({ width: normalWidth })
              .find("img").animate({width: normalImgWidth})
	      .end()
	      .find("span").animate({fontSize: normalFontSize});
}

/*
 Navigate.
*/
function navigate(moving2left){
	
    var steps = arguments[1]?arguments[1]:1;
    
    // Invalid cases
    if(moving2left && curPanel+steps-1>=maxPanel || !moving2left && curPanel-steps+1 <=1){
	return false;
    }

    // If currently the slider is not moving
    if(($("#slider").data("currentlyMoving") == false)){
	$("#slider").data("currentlyMoving", true);

	var nextPanel = moving2left?curPanel+steps:curPanel-steps;
	var curPos = parseFloat($(".ScrollContainer").css("left"), 10);
	var movement = moving2left?curPos-step*steps:curPos+step*steps;
	// Move the panels
	$(".ScrollContainer")
	    .stop()
	    .animate({"left": movement},
		     function() {
                //console.debug("==>"+$(".ScrollContainer").css("left"));
                if($("#slider").data("currentlyMoving")==true)
                {
                    $("#slider").data("currentlyMoving", false);
                    //console.debug("Calling moveMap after animation");
                    moveMap();
                }
		    });
	    
	// Make the previous panel to normal size
	makeNormal("#panel_"+curPanel);
	// Make current panel bigger
	makeBigger("#panel_"+nextPanel);
	
	curPanel = nextPanel;
	
	updatePanelEventHandlers();
	
	//moveMap();
    }
        
    return true;
}

/*
 Bind click event for all the spots.
*/
function updatePanelEventHandlers(){
    var $panels = $(".Panel");
    $panels.unbind();
    $panels.click(function(){
	var inx = parseInt(this.id.substr(this.id.lastIndexOf("_")+1));
	if(inx!=curPanel){
	    navigate(inx>curPanel?true:false, Math.abs(curPanel-inx));
	}
    });

}

/*
 Load Google Map.
*/
function loadGMap(){
    //alert("Load GMap");
    map = new GMap2(document.getElementById("hk_map"));
    //map.setCenter(new GLatLng(37.4419, -122.1419), 13);
    map.setCenter(new GLatLng(31.943327048210286, 118.78591775894165), 17);
    map.setUIToDefault();
    
    markermanager = new MarkerManager(map);
}

/*
 Move Map.
*/
function moveMap(){
    var $curPanel = $("#panel_"+curPanel);
    var lat = $curPanel.data("lat");
    var lng = $curPanel.data("lng");
    
    if(lat == undefined || lat == null ||lat=="" || lng == undefined || lng == null || lng==""){
	return false;
    }
    
    var zoom = $curPanel.data("zoom");
    if(zoom == undefined || zoom == null || zoom <= 0){
	zoom = 15;
    }
    //console.debug("lat="+lat+",lng="+lng+"zoom="+zoom);
    if(map){
        zoom = parseInt(zoom);
        map.setZoom(zoom);
        //map.panTo(new GLatLng(lat,lng));
        map.setCenter(new GLatLng(lat,lng));
	
        // Show Marker and the Info window
        showMarkerAndInfo(lat,lng, zoom);
    }
    
    return true;
}

/*
 Show Maker on the map and show the info window.
*/
function showMarkerAndInfo(lat, lng, zoom){
    if(lat == undefined || lat == null ||lat=="" || lng == undefined || lng == null || lng==""){
	    return false;
    }
    
    if(zoom == undefined || zoom == null || zoom <= 0){
        zoom = 15;
    }
    
    map.closeInfoWindow();

    var marker = markermanager.getMarker(lat,lng, zoom);
    markermanager.removeMarker(marker);
    markermanager.addMarker(marker,zoom);
    
    //console.debug(markermanager.getMarkerCount(zoom));
    
    markermanager.refresh();
    
    var $curPanelImg = $("#panel_"+curPanel+" img");
    
    // Set the click event for the marker
    //GEvent.addListener(marker, "click", function(){
    //    marker.openInfoWindowHtml("<img src=\""+$curPanelImg.attr("src")+"\"/>");    
    //});
    marker.bindInfoWindowHtml("<div style=\"font-size:11px\"><a href=\"#\" onclick=\'getPhotos("+curGroup+","+curPanel+");return false;\'><img id=\"info_img\" src=\""+$curPanelImg.attr("src")+"\" width=\"150\"/><br/>点击查看相册</a></div>");

    //console.debug($curPanelImg.attr("src"));
    //marker.openInfoWindowHtml("<img src=\""+$curPanelImg.attr("src")+"\"/>");
    //GEvent.trigger(marker, "click");
    setTimeout(function(){GEvent.trigger(marker, "click");},1000);

    return true;
}

/*
 Get the photos when the img in infowindow is clicked.
*/
function getPhotos(group, spot){
    //console.debug("Enter getPhotos");
    // Show waiting notice
    $("#notice").empty().append("正在获取相册，请稍候。").css("display","inherit");
    //console.debug("Get the photos");
    //console.debug('json/photos_'+group+'_'+spot+'.json');
    // Get the photos
	$.getJSON('json/photos_'+group+'_'+spot+'.json', showLightBox);

}

/*
 Show light box for the photos.
*/
function showLightBox(data){
    
    //console.debug("Enter showLightBox");
    $("#notice").empty().css("display","none");

    // Remove the previous photos
    $("#gallery").empty();
    // Add the photos
    $.each(data, function(entryIdx, entry){
        var galleryHtml = "<a href=\"";
        galleryHtml+=entry['photo_big'];
        galleryHtml+="\" title=\"";
        galleryHtml+= entry['title'];
        galleryHtml+="\"><img src=\"";
        galleryHtml+=entry['photo_small'];
        galleryHtml+="\" width=\"72\" height=\"72\" alt=\"\" /></a>";

        //console.debug(""+galleryHtml);
        $("#gallery").append(galleryHtml);
    });
    
    // Trigger the light box
    $('#gallery a').lightBox({txtImage:'图片',txtOf:'/'});
    $("#gallery a:eq(0)").trigger("click");
}

// Constants for bigger panel
var biggerWidth = "150px";
var biggerImgWidth = "120px";
var biggerFontSize = "14px";

// Constants for normal panel
var normalWidth = "130px";
var normalImgWidth = "100px";
var normalFontSize = "12px";

// Moving step
var step = 150;

// Global Vars
var curPanel = 0;
var maxPanel = 0;
var curGroup = 0;

// The map
var map;
var markermanager;