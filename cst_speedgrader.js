/* Enhancements to SpeedGrader.
- Remove DIV in upper left containing icons.
- Change "Grade" label to "Status" for pass/fail assignments.
05.05.2018 tps Add assignment navigation buttons to SpeedGrader.
               Line up navigation buttons with assignment name header using a table.
06.11.2018 tps Add popup for assignment description.
08.17.2018 tps Fix for DOM changes to "Grade" label.
08.23.2018 tps Hack assignment description HTML to reveal faculty-only DIV.
09.21.2018 tps Replace assignment details "Due: No Due Date" text.
*/

const FDB_API_BASE_URL = 'https://ourdomain.com/api/';

document.addEventListener("DOMContentLoaded", function(event) {
 
  if (location.href.includes('/gradebook/speed_grader?assignment_id=')) {

    // Extract a course ID from URL path like "/courses/197/gradebook/speed_grader"
    var courseId = document.location.pathname.split('/')[2];

    // Extract an assignment ID from URL query like "?assignment_id=2951"
    var assId = document.location.search.substr(1).split('=')[1];

    insertAssignmentNavigation(courseId, assId);

    // Remove the SpeedGrader icons from the UI
    const speedGraderIcons = document.getElementById('speedgrader-icons');
    if (speedGraderIcons) speedGraderIcons.remove();
    
    // Change label on grade pulldown for pass/fail type, if it exists.
    // Try to detect pass/fail pulldown.
    const gradingBoxNode = document.getElementById('grading-box-extended');
    if (gradingBoxNode
      && (gradingBoxNode.tagName === 'SELECT')
      && (gradingBoxNode.className === 'pass_fail_grading_type')) {

        // Change the label for pass/fail assignment
        // 08.17.2018 tps New code for DOM changes.
        var gradingBoxPoints = document.getElementById('grading-box-points-possible');
        if (gradingBoxPoints) {
          gradingBoxPoints.childNodes[0].textContent = gradingBoxPoints.childNodes[0].textContent.replace('Grade', 'Status');
        }

        // var gradeContainer = document.getElementById("grade_container");
        // if (gradeContainer) {
        //   gradeContainer.childNodes[1].childNodes[0].textContent = 'Status\n\n  \n';
        // }
    }

    // Add assignment description popup
    const gradebook_header = document.getElementById('gradebook_header');
    if (gradebook_header) {

      const div = document.createElement('DIV');
      div.innerHTML = '<A HREF="#" onclick="return popupAssignmentDesc();" class="statsMetric__Item-value">Assignment Description</A>';
      div.className = 'subheadContent';

      // Insert link next to assignment title
      gradebook_header.insertBefore(div, gradebook_header.childNodes[2]);
      
      // Add popup div for display of assignment desscription
      const popupDiv = document.createElement('DIV');
      document.body.appendChild(popupDiv);
      popupDiv.outerHTML =
      '<DIV class="cst-modal" id="cstAssignmentPopup">\
        <FORM class="cst-modal-content cst-animate" onSubmit="return false;" id="cstAssignmentPopupForm">\
          <SPAN class="cst-close" onclick="document.getElementById(\'cstAssignmentPopup\').style.display=\'none\'" title="Close Modal">&times;</SPAN>\
          <DIV class="cst-container">\
            <H2 ID="cstAssignmentTitle">Assignment Description</H2>\
            <DIV ID="cstAssignmentHtml" class="cst-scrollable-content">\
              <P>Assignment description from Canvas goes here</P>\
            </DIV>\
          </DIV>\
        </FORM>\
      </DIV>';

      loadAssignmentDescription(courseId, assId);
    }

    // Replace "Due: No Due Date" text
    const assignmentDetails = document.getElementsByClassName("assignmentDetails__Info");
    if ( (assignmentDetails[0])
      && (assignmentDetails[0].childNodes[1])
      && (assignmentDetails[0].childNodes[1].innerText === "Due: No Due Date")
    ) {
      assignmentDetails[0].childNodes[1].innerText = "Due: Per Pacing Guide";
    }
    
  } // end on SpeedGrader page
}); // end DOMContentLoaded


/**
 * Retrieve prev/next assignment IDs via AJAX.
 */
function insertAssignmentNavigation(courseId, assignmentId) {
   
  var httpRequest = new XMLHttpRequest();
  if (!httpRequest) {
    alert('Giving up :( Cannot create an XMLHTTP instance');
    return false;
  }

  httpRequest.onreadystatechange = insertAssNavHandler;
  httpRequest.open('GET', FDB_API_BASE_URL + 'courses/' + courseId + '/assignments/' + assignmentId + '/nav', true);
  httpRequest.send();

  function insertAssNavHandler() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        const nav = JSON.parse(httpRequest.responseText);
        
        // We might not get any navigation data
        if (nav.err) {
          return console.log('FDB API err:', nav.err);
        }

        return addAssignmentNavigationArrows(nav.prev, nav.next);

      } else {
        return console.log('FDB AJAX status err:', httpRequest.status);
      }
    } // end request ready
  } // end request handler
} // end function


/**
 * Mess with the DOM & add prev/next assignment navigation buttons.
 */
function addAssignmentNavigationArrows(prevAssignmentId, nextAssignmentId) {
  
  // Define prev assignment button
  var prevBtn = document.createElement('button');
  prevBtn.setAttribute("id", "prev-assignment-button");
  prevBtn.setAttribute("class", "Button Button--icon-action gradebookMoveToNext prev");
  prevBtn.setAttribute("type", "button");
  prevBtn.setAttribute("aria-label", "Previous");
  prevBtn.innerHTML = '<i class="icon-arrow-left prev" aria-hidden="true"></i>';
  prevBtn.onclick = function() { redirectAssignmentLocation(prevAssignmentId); };

  // Define next assignment button
  var nextBtn = document.createElement('button');
  nextBtn.setAttribute("id", "next-assignment-button");
  nextBtn.setAttribute("class", "Button Button--icon-action gradebookMoveToNext next");
  nextBtn.setAttribute("type", "button");
  nextBtn.setAttribute("aria-label", "Next");
  nextBtn.innerHTML = '<i class="icon-arrow-right next" aria-hidden="true"></i>';
  nextBtn.onclick = function() { redirectAssignmentLocation(nextAssignmentId); };

  // Table row to put navigation buttons on same line as assignment title
  var table = document.createElement('TABLE');
  table.setAttribute("STYLE", "margin-left:-12px;");  // Shove it over to line up with the next line
  var row = table.insertRow();
  var prevCell = row.insertCell();
  var nameCell = row.insertCell();
  var nextCell = row.insertCell();

  // Try inserting the arrow buttons
  var assAnchor = document.getElementById('assignment_url');
  if (assAnchor) {
    var assDetailsDiv = assAnchor.parentNode;
    var assInfo = assAnchor.nextSibling;  // So we know where to insert new div

    prevCell.appendChild(prevBtn);
    nameCell.appendChild(assAnchor);
    nextCell.appendChild(nextBtn);
    assDetailsDiv.insertBefore(table, assInfo);

  }
}

/**
 * Redirect browser to another assignment.
 * Build prev & next assignment links by substituting assignment ID query in current URL, which looks like:
 * "https://ourdomain.instructure.com/courses/201/gradebook/speed_grader?assignment_id=3379#%7B%22student_id%22%3A%222047%22%7D"
 */
function redirectAssignmentLocation(assignmentId) {
  window.location.href
    = document.location.href.replace(/assignment_id=\d+/, 'assignment_id=' + assignmentId);
}


function popupAssignmentDesc() {

  // Modal add form behavior:
  // When the user clicks anywhere outside of the modal form, close it
  var assignmentPopup = document.getElementById('cstAssignmentPopup');
  window.onclick = function(event) {
    if (event.target == assignmentPopup) {
      assignmentPopup.style.display = "none";
    }
  }
  assignmentPopup.style.display = 'block';
  
  return false; // Prevent default behavior of anchor tag
}

/**
 * Retrieve assignment description HTML via AJAX.
 */
function loadAssignmentDescription(courseId, assignmentId) {

  var httpRequest = new XMLHttpRequest();
  if (!httpRequest) {
    alert('Giving up :( Cannot create an XMLHTTP instance');
    return false;
  }

  httpRequest.onreadystatechange = loadAssDescHandler;
  httpRequest.open('GET', FDB_API_BASE_URL + 'courses/' + courseId + '/assignments/' + assignmentId + '/desc', true);
  httpRequest.send();

  function loadAssDescHandler() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {

        // Load the assignment description HTML into the popup
        let html = httpRequest.responseText;
        const div = document.getElementById('cstAssignmentHtml');
        if (div) {
          // 08.23.2018 tps Reveal faculty-only DIV
          html = html.replace('style="display: none;"', 'style="display: inline;"');
          div.innerHTML = html;
        }

        // Grab the assignment title from the DOM
        var assAnchor = document.getElementById('assignment_url');
        if (assAnchor) {
          const assignmentTitle = assAnchor.children[0].textContent;
          const h2 = document.getElementById('cstAssignmentTitle');
          if (h2) {
            h2.textContent = assignmentTitle;
          }
        }

      } else {
        return console.log('FDB AJAX status err:', httpRequest.status);
      }
    } // end request ready
  } // end request handler
}