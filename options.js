message = {};
message.show = function(msg) {
  document.getElementById("msg").innerHTML = msg;
  document.getElementById("msg").classList.remove("hidden");
};
message.error = function(msg) {
  document.getElementById("msg").classList.remove("success");
  document.getElementById("msg").classList.add("error");
  message.show(msg);
};
message.success = function(msg) {
  document.getElementById("msg").classList.remove("error");
  document.getElementById("msg").classList.add("success");
  message.show(msg);
};
message.hide = function() {
  document.getElementById("msg").classList.add("hidden");
};

function address_onChange(event) {
  if (!is_address_valid(event.target.value)) {
    event.target.classList.add("invalid");
  } else {
    event.target.classList.remove("invalid");
  }
}

function is_address_valid(address) {
  if (address.indexOf("osmo") == -1) {
    return false;
  }
  if (address.length != 43) {
    return false
  }
  return true;
}

function btnSave_onclick() {
  var address = document.getElementById("address");
  if (!is_address_valid(address.value)) {
    // show error
    message.error("Invalid Osmosis address specified!");
    return;
  }
  // remove error
  message.hide();
  addAddress(address.value);
}

function addAddress(address) {
  chrome.storage.sync.set({
    address: address
  }, function() {
    message.success("Wallet saved!");
  });
}

function restore_options() {
  chrome.storage.sync.get({
    address: ''
  }, function(res) {
    document.getElementById('address').value = res.address;
  });
}

function btnClear_onclick() {
  document.getElementById('address').value = "";
  message.success("Address cleared!");
  removeAddress();
}

function removeAddress() {
  chrome.storage.sync.clear("address");
  chrome.storage.local.clear("wallet"); // this is important... else frontend gets confused

}

function btnAutoderive_onClick() {
  show_promptConfirmDerive();
}

function btnCancelAutoderive_onClick() {
  hide_promptConfirmDerive();
}

function btnConfirmAutoderive_onClick() {
  hide_promptConfirmDerive();
  autoDerive();
}

function show_promptConfirmDerive() {
  document.getElementById("promptConfirmDerive").classList.remove("hidden");
}

function hide_promptConfirmDerive() {
  document.getElementById("promptConfirmDerive").classList.add("hidden");
}

function autoDerive() {
  var address = document.getElementById("address").value;
  document.getElementById("otherWallets").innerHTML = "";
  // Call SmartNodes API to get wallet prefixes
  companion.zones.get({
      "refresh": true
    })
    .then((res) => {
      var data = res.zones.data;
      console.log(data);

      // start looking through the api for prefixes,
      // and derive each addres into html template.
      // get HTML template for each address
      var template_dynamic_address = document.getElementById("template_dynamic_address");


      for (var zone in data) {
        // check if the chain is not the primary token in the chain
        if (!data[zone].chain.motherchain) {
          //  get prefix
          let prefix = data[zone].chain.prefix;

          var docFrag = template_dynamic_address.content.cloneNode(true);
          docFrag.querySelector("div.address").dataset.ticker = data[zone].ticker;
          docFrag.querySelector("label").innerHTML = data[zone].name;
          docFrag.querySelector("input").value = lookup(address, prefix);
          document.getElementById("otherWallets").appendChild(docFrag);

          // document.getElementById("otherWallets").innerHTML += prefix;
          // //  2.2) Derive from each prefix
          // document.getElementById("otherWallets").innerHTML += " - ";
          // document.getElementById("otherWallets").innerHTML +=
          // document.getElementById("otherWallets").innerHTML += "<br>";
        }
      }
      // add button listeners

      // EDIT BUTTON
      document.querySelectorAll("#otherWallets .button-edit").forEach((item, i) => {
        item.onclick = function() {
          item.parentElement.querySelector("input").disabled = false;
          item.classList.add("hidden");
          item.parentElement.querySelector(".button-save").classList.remove("hidden");
        };
      });

      // SAVE BUTTON
      document.querySelectorAll("#otherWallets .button-save").forEach((item, i) => {
        item.onclick = function() {
          item.parentElement.querySelector("input").disabled = true;
          item.classList.add("hidden");
          item.parentElement.querySelector(".button-edit").classList.remove("hidden");
        };
      });

      // DELETE BUTTON
      document.querySelectorAll("#otherWallets .button-delete").forEach((item, i) => {
        item.onclick = function() {
          item.parentElement.innerHTML = "";
        };
      });
    });
}


document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById("address").oninput = address_onChange;
  document.getElementById("btnSaveAddress").onclick = btnSave_onclick;
  document.getElementById("btnClearAddress").onclick = btnClear_onclick;

  // document.getElementById("btnAutoderive").onclick = btnAutoderive_onClick;
  // document.getElementById("btnCancelAutoderive").onclick = btnCancelAutoderive_onClick;
  // document.getElementById("btnConfirmAutoderive").onclick = btnConfirmAutoderive_onClick;


  restore_options();

  // var rates = await RATES.get(); // get rates

  // if(SETTINGS.get)

  // console.log(await RATES.exchange({
  //   "from": "usd",
  //   "to": "zar",
  //   "amount": 1,
  //   "rates": rates
  // }));
});
