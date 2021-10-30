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
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("address").oninput = address_onChange;
  document.getElementById("btnSaveAddress").onclick = btnSave_onclick;
  document.getElementById("btnClearAddress").onclick = btnClear_onclick;
  restore_options();
});
