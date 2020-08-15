/* EXTERNAL FUNCTIONS */
// function from https://paul.kinlan.me/waiting-for-an-element-to-be-created/
// wait for a element with a specific selector to exist and return a promise
// useful in the svg import function, to wait for all of the svg divs to be created
function waitForElement(selector) {
    return new Promise(function(resolve, reject) {
      var element = document.querySelector(selector);
  
      if(element) {
        resolve(element);
        return;
      }
  
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          var nodes = Array.from(mutation.addedNodes);
          for(var node of nodes) {
            if(node.matches && node.matches(selector)) {
              observer.disconnect();
              resolve(node);
              return;
            }
          };
        });
      });
  
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }
/*********************************************/

$("#downloadBtn").on('click', ()=>
{
    $("#downloadBtn").hide()
    $("#loadingSpan").show();
    let svgArray = [];
    $("svg").each( elem =>
    {
        svgArray.push({
            name: $($("svg")[elem]).attr("fileName"),
            svg : $("svg")[elem].outerHTML
        });
    });
    data = JSON.stringify(svgArray);
    fetch("/convert",
    {
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        method: "POST",
        body: data
    })
    .then(res => res.text() )
    .then(data => {
        $("#downloadBtn").show()
        $("#loadingSpan").hide();
        window.location.href = "http://" + window.location.host + data ;
    })
    .catch(function(res){ console.log(res) })
});

/* updateSelectedItems
 * with this exemple :
 *
 * /html
 *     /*svg
 *     /input targetAttribute=fill value=red class=mainInput
 * 
 * set the fill attribute of all the svg element
 * to red
*/
function updateSelectedItems(e)
{
    $eventTarget = $(e.currentTarget);
    $attr = $eventTarget.attr("targetAttribute");
    $value = $eventTarget.val()
    $(".active").attr($attr, $value)
}

/* updateSelectedItems
 * with this exemple :
 *
 * /html
 *     /input[example: text] id=input1
 *     /input[example: color] target=#input1 class=secondaryInput
 * 
 * as the secondary input value change, it refresh the first input
 * value to match
*/
function updateMainInput(e)
{
    $eventTarget = $(e.currentTarget);
    $target = $($eventTarget.attr("target"));
    $target.val($eventTarget.val())
    $target.trigger('change');
}

/*
 * set the text of #selectionSize text to the 
 * number of selected svg, so you can make smth like
 * <span id="selectionSize"></> selected elems
 * and it will render like :
 * 3 selected elems
*/
function refreshSelectionSize()
{
    $("#selectionSize").text( $("svg.active").length )
}

/*
 * select all of the svg element
*/
$("#selectAllBtn").on('click', ()=>
{
    $("svg").addClass("active");
    refreshSelectionSize();
});

/*
 * deselect all of the svg element
*/
$("#deselectAllBtn").on('click', ()=>
{
    $("svg.active").removeClass("active");
    refreshSelectionSize();
});

/*
 * toggle the select class for the clicked element
*/
function toggleSelection(event)
{
    let target = $(event.currentTarget);
    target.toggleClass("active");
    refreshSelectionSize();
}

/*
 * Some svg structure can have useless <g>%20</g> within them
 * this function removes them
*/
function clearSVG()
{
    $svgDiv = $("#svgViewer").children();
    $svgParts = $svgDiv.children();
    $svgParts.each(elem =>
    {
        $svgSegment = $svgParts[elem];
        if($svgSegment.innerHTML == "\n") $svgSegment.remove();
    })
}

async function readFile(fileObject)
{
    let fileName = fileObject.name;
    let id = `ELEM-${fileName.substr(0, fileName.indexOf('.'))}`;
    let selector = `#${id}`;
    let reader = new FileReader;
    let parser = new DOMParser;
    reader.addEventListener('load', function(){
        let result      = reader.result.replace(/<!--[^>]*>/gi, "")
        let newSVG      = parser.parseFromString(result, "image/svg+xml");
        newSVG.rootElement.setAttribute("id", id)
        newSVG.rootElement.setAttribute("fileName", fileName)
        $("#svgContainer").append(newSVG.documentElement)
        return;
    })
    reader.readAsText(fileObject, 'UTF-8');
    await waitForElement(selector);
    return;
}

function readAllFiles()
{
    $("#svgContainer").html("")
    let filesList = $("#fileInput")[0].files;
    let promises = [];
    for (let i=0; i<filesList.length; i++)
    {
        promises.push(readFile(filesList[i]));
    }
    Promise.all(promises).then(()=>
    {
        clearSVG()
        $("svg").on('click', toggleSelection)
        $(".files-only").show()
    })
}

$("#fileInputButton").on('click', ()=>{ $("#fileInput").trigger('click'); })
$("#fileInput").on('change', readAllFiles);
$(".secondaryInputs").on('change', updateMainInput);
$(".mainInput").on('change', updateSelectedItems);