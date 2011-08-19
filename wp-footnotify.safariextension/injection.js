if (window == window.parent) { /* you're not inside a frame! */ 



var FootnotifySingleton = function($,settings) {
  if (document.footnotify_installed) {return;}
  document.footnotify_installed = true;
          
  var selectorRegExp = /[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\[\\\]\^\`\{\|\}\~]/g;  
  var rgbaRegExp = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
  
  var isOpaque = function(color,treshold) {
    treshold = treshold || 1;
    m = color.match(rgbaRegExp);
    return (m && m[4] < treshold) ? false : true;    
  };
  
      
  var lightbox = $('<div id="footnotify_lightbox"></div>');  
  var holder = $('<div id="footnotify_holder"></div>');
  var arrow = $('<div id="footnotify_arrow">&#x25E2;&#x25E3;</div>');
  var panel = $('<div id="footnotify_panel"></div>');
  var content = $('<div id="footnotify_content"></div>');    
  var flash_notification = $('<div id="footnotify_notification"></div>');  
  
  var active = true;
  var current_target = null;
  
  var body_background = $('body').css('background-color');
  var text_color = 'inherit';   
  if (!isOpaque(body_background)) {
    //Body is transparent, falling back to black on white;
    body_background = "#ffffff";
    text_color = "#000000";
  }
    
  flash_notification.css({position:'fixed',top:'5px',left:'5px',zIndex:999,padding:'1em',color:"#ffffff",background:'rgba(0,0,0,.7)'});    
  lightbox.css({position:'fixed',width:'100%',height:'100%',top:'0',left:'0',background:'rgba(0,0,0,.7)'});  
  holder.css({position:'absolute'});
  panel.css({padding:'1px',margin:'0 -240px',width:'480px',background:body_background,color:text_color});
  content.css({margin:'2em'});
  arrow.css({letterSpacing:'-1px',width:'32px',margin:'0 -11px',textAlign:'center',fontSize:'13px',paddingTop:'2em',lineHeight:'0.9em',color:body_background});
  
  lightbox.hide();
  holder.hide();
  flash_notification.hide();
  
  $("body").append(lightbox);  
  $("body").append( holder.append(arrow,panel.append(content) ) );
  $("body").append(flash_notification);
  
  this.flash = function(message) {
    flash_notification.hide();    
    flash_notification.html(message);
    flash_notification.fadeIn(130).delay(1000).fadeOut(250);    
  };
  
  this.flashStatus = function() {
    this.flash('<strong>Footnotify</strong> is '+ (active ? 'active':'disabled') +'.');
  };
  
  this.toggle = function() {
    active = !active;
    this.flashStatus();
  };    
  
  
  var position_footnotify = function(target) {
    current_target = target || current_target;
    if (current_target) {            
      var target_offset = current_target.offset();        
      holder.css({top:target_offset.top+'px',left:target_offset.left+'px'});
      
      var p = 10;
      var svo,x = target_offset.left;
      if (settings.blockPositioning) {
        var parentBlock = current_target.parents().filter(function(i) {return $(this).css('display') == 'block'; }).first();
        var px = parentBlock.offset().left;
        var pw = parentBlock.innerWidth()-p*2;        
        svo = px - x + p;
        panel.css({marginLeft:svo+'px',width:pw+'px'});        
      } else if (settings.activePositioning || target) { 
        var s = $(window).scrollLeft();
        var tw = window.innerWidth || $(window).width(); //inner width for mobile safari.                
        var w = Math.min(settings.maxWidth,tw-p*2);
        var svo = Math.min(Math.max(s-x-(w-tw)/2 ,-x+p,-w+25),-17); //20 and -12 accounts for arrow width.
        panel.css({marginLeft:svo+'px',width:w+'px'});        
      }
      
    }    
  };
           
  var hide_footnotify = function(event){
    if (panel.has(event.target).length > 0) { return; }
    lightbox.fadeOut(150); 
    holder.hide();
    current_target = null;
    
    $('.footnotify_target_clone').fadeOut(400,function(){ $(this).remove(); });
  };
  lightbox.click(hide_footnotify);
  holder.click(hide_footnotify);
  
  
  $(window).bind('resize scroll',function() {
    position_footnotify();
  });
  
  $("a").click(function(event){
    if (!active) {return;}
    
    var target = $(event.currentTarget);
    var href = target.attr('href');    
    if (href.indexOf('#') === 0) {            
      var selector = '#'+href.substr(1).replace(selectorRegExp,'\\$&');      
      var footnote_el = $(selector);            
      if (footnote_el.length > 0) {
        //No paragraphs inside, better take precautions,it might be a backlink or have no content.
        if (footnote_el.children('p').length === 0) { 
          //let it pass if it is a list item.
          if (footnote_el.filter('li').length === 0) {
            return; 
          }          
        }        
        content.html(footnote_el.html());        
        position_footnotify(target);

        var cloned_target = $('<span class="footnotify_target_clone"></span>');
        cloned_target.html(current_target.html()); // dirty! current_target set inside position_footnotify.
        cloned_target.insertBefore(current_target);
        // cloned_target.addClass('footnotify_target_clone');
        cloned_target.css({display:'none',position:'absolute'});
        
        if (settings.helpOnce) {
          settings.helpOnce = false;
          cloned_target.append(' <span class="footnotify_click_help">Click outside to close.</span>');
          $('.footnotify_click_help').delay(3000).hide(500);
        }
              
        cloned_target.fadeIn(500);
        
        holder.fadeIn(300);
        lightbox.fadeIn(500);
        return false;        
      }            
    }
            
  });    
  
  if (document.load_footnotify_verbosely) {
    this.flashStatus();
  }  
    
};

// var clickHandler = function(event) {
//   var target = event.currentTarget;
// };
// document.addEventListener('click',clickHandler);

var isFootnotifyInstalled = function() {
  return document.footnotify_installed || document.footnotify || $("#footnotify_lightbox").length > 0;  
};

var footnotify_settings = {}
var messageHandler = function(event) {
  // console.log("injection",event)
  
  if (event.name == 'settings') {
    footnotify_settings = event.message
  }
  if (event.name == 'init') {
    if (!isFootnotifyInstalled()) {
      document.footnotify = new FootnotifySingleton(jQuery,footnotify_settings);
    }
  }
  
}
safari.self.addEventListener("message", messageHandler, false); 
safari.self.tab.dispatchMessage("footnotifyInit");


}
