// This javascript code will alert you and immediately book the slot whenever a slot opens up on the given date within the given pincodes.

// Steps to use
// 1. Update pincodes,age,district_id,beneficiaries,vaccine & vaccine_date. 
// 2. Login to https://selfregistration.cowin.gov.in/
// 3. Right Click on the website
// 4. Click on Inspect
// 5. Switch to the Console Tab on the recently opened Inspect window
// 6. Copy paste the contents of this entire file - cowin_vaccination_autobooking.js
// 8. Press Enter
// 9. This will generate the captcha and show it in a new window. Note the captcha and close the window.
// 10. Within few seconds, A prompt will show on screen asking you to enter the Captcha code. Type in the Captcha as noted.
// 11. It will run every 3 seconds and check for availability of slots. Once available, it will immediately book the slot. Refresh the page once you get the booking confirmation message.

// Change the pincodes as per your city
var pincodes = [781017, 123455]

// Change the age as per your requirement
var age = 18; //45,18

// Change the district id as per the city you are living in
var district_id = 50 //

// Keep the vaccine as per your need. Currently it will look for both the vaccines.
var vaccines = ["COVISHIELD"];//, "COVAXIN"];

// Enter dose no
var dose = 1
var lookForDose = 'available_capacity_dose' + dose
// Change the date to the date of slot booking
var vaccine_date = "23-05-2021"

// Reference id of the person you are booking a slot for. Can find it written beside your name after you log in. 
var beneficiaries = [84547108716330, 83455001003220, 93455660227340]

// Defined API Host endpoint
var host = "https://cdn-api.co-vin.in/api";

// Variable to keep track of whether slot is booked
var booked = false;

// Authorization token needed to book a slot - No Changes required
var authorizationToken = "Bearer " + sessionStorage.getItem("userToken").match(/"([^"]+)"/)[1];

var sleepNow = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
var trialCounter = 1;

(function () {
  var newscript = document.createElement('script');
  newscript.type = 'text/javascript';
  newscript.async = true;
  newscript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js';
  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(newscript);
})();

function httpGet(method, theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open(method, theUrl, false); // false for synchronous request
  xmlHttp.setRequestHeader("authorization", authorizationToken);
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

function getCaptcha() {
  var url = host + "/v2/auth/getRecaptcha";
  var data = JSON.parse(httpGet("POST", url)).captcha;

  var myWindow = window.open("", "MsgWindow", "width=200,height=100");
  myWindow.document.write(data);
}

async function fetchByDistrict(captcha) {
  if (captcha.length > 0) {
    console.log("Check: ", trialCounter++);
    url = host + "/v2/appointment/sessions/calendarByDistrict?district_id=" + district_id + "&date=" + vaccine_date;

    try {
      centers = JSON.parse(httpGet("GET", url)).centers;
    } catch (e) {
      console.log("error");
    }

    for (i in centers) {
      center = centers[i];
      for (j in center.sessions) {
        session = center.sessions[j];

        if (!booked && session.min_age_limit == age && /*session.available_capacity > 0 &&*/ vaccines.includes(session.vaccine) && pincodes.includes(center.pincode) && session[lookForDose] > 0) {
          console.log("Vaccines available at : ", center.pincode, center.name, center.center_id, session.available_capacity);

          data = {
            center_id: center.center_id,
            session_id: session.session_id,
            dose: dose,
            slot: session.slots[0],
            beneficiaries: beneficiaries,
            captcha: captcha
          }

          bookSlot(data);
        }
      }
    }
    
    if (!booked) {
      await sleepNow(10000);
      fetchByDistrict(captcha);
    }
  }
}


function bookSlot(data) {
  console.log('Booking Started');
  return $.ajax({
    type: "POST",
    url: host + "/v2/appointment/schedule",
    async: false,
    data: JSON.stringify(data),
    timeout: 10000,
    beforeSend: function (request) {
      request.setRequestHeader("authorization", authorizationToken);
      request.setRequestHeader("Content-Type", "application/json");
    },
    success: function (result) {
      booked = true;
      alert("Your appointment for the vaccine has been booked. \n\nAppointment No: " + result['appointment_confirmation_no']);
	console.log('Booking Success');

    }
  });
}

// Initiate Booking
getCaptcha();
setTimeout(function(){ 
  fetchByDistrict(prompt("Enter Captcha Code below:"));
}, 3100);
