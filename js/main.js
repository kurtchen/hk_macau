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
	$.getJSON("json/group"+this.id.substr(this.id.lastIndexOf("_")+1)+".json", setSpot);
    });
    
    // Init loading image for slider
    $(".ScrollContainer").append('<img src="img/loading.gif" width="220" height="19"/>');
    
    // Get First group of spots
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
			$("#slider").data("currentlyMoving", false);
			moveMap();
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
        map.setZoom(parseInt(zoom));
        map.panTo(new GLatLng(lat,lng));
    }
    
    return true;
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

// The map
var map;