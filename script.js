"use strict";

const storageKey = "bai5-profile-v1";
const form = document.querySelector("#profile-form");
const editButton = document.querySelector("#edit-button");
const controls = [...form.querySelectorAll("input, select")];
const toast = document.querySelector("#status");
let editing = false;
let toastTimer;
let saved = { fields: {}, emails: [] };
try {
  const parsed = JSON.parse(localStorage.getItem(storageKey));
  if (
    parsed &&
    typeof parsed.fields === "object" &&
    parsed.fields &&
    Array.isArray(parsed.emails)
  )
    saved = parsed;
} catch (_) {}

function announce(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}
function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
    return true;
  } catch (_) {
    return false;
  }
}
function updateSelects() {
  controls
    .filter((c) => c.tagName === "SELECT")
    .forEach((c) => c.classList.toggle("empty", !c.value));
}
for (const control of controls) {
  if (typeof saved.fields[control.name] === "string")
    control.value = saved.fields[control.name];
  control.addEventListener("change", updateSelects);
}
function updateName() {
  document.querySelector("#profile-name").textContent =
    saved.fields.fullName?.trim() || "Alexa Rawles";
}
updateSelects();
updateName();

function setEditing(value) {
  editing = value;
  editButton.textContent = value ? "Save" : "Edit";
  editButton.setAttribute("aria-pressed", String(value));
  controls.forEach((control) => {
    if (control.tagName === "SELECT") control.disabled = !value;
    else control.readOnly = !value;
  });
}
function saveProfile() {
  if (!form.reportValidity()) return;
  saved.fields = Object.fromEntries(
    controls.map((c) => [c.name, c.value.trim()]),
  );
  const stored = persist();
  updateName();
  setEditing(false);
  announce(
    stored
      ? "Profile saved on this browser."
      : "Profile updated. Browser storage is unavailable.",
  );
}
editButton.addEventListener("click", () => {
  if (editing) saveProfile();
  else {
    setEditing(true);
    controls[0].focus();
  }
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (editing) saveProfile();
});

const dialog = document.querySelector("#email-dialog");
const emailForm = document.querySelector("#email-form");
const newEmail = document.querySelector("#new-email");
const emailError = document.querySelector("#email-error");
const extraEmails = document.querySelector("#email-list");
function appendEmail(email) {
  const row = document.createElement("li");
  row.className = "email-item";
  const icon = document.createElement("span");
  icon.className = "email-icon";
  const image = document.createElement("img");
  image.src = "assets/email.svg";
  image.alt = "";
  image.width = 24;
  image.height = 24;
  icon.append(image);
  const copy = document.createElement("p");
  copy.className = "email-copy";
  const address = document.createElement("span");
  address.className = "email-address";
  address.textContent = email;
  const detail = document.createElement("span");
  detail.className = "email-date";
  detail.textContent = "Added on this browser";
  copy.append(address, detail);
  row.append(icon, copy);
  extraEmails.append(row);
}
saved.emails = saved.emails.filter(
  (email) => typeof email === "string" && email.length <= 254,
);
saved.emails.forEach(appendEmail);
document.querySelector("#add-email-button").addEventListener("click", () => {
  emailForm.reset();
  emailError.textContent = "";
  dialog.showModal();
  newEmail.focus();
});
document
  .querySelector("#cancel-email")
  .addEventListener("click", () => dialog.close());
emailForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = newEmail.value.trim();
  if (
    ["alexarawles@gmail.com", ...saved.emails].some(
      (e) => e.toLowerCase() === email.toLowerCase(),
    )
  ) {
    emailError.textContent = "This email address is already in your profile.";
    return;
  }
  saved.emails.push(email);
  const stored = persist();
  appendEmail(email);
  dialog.close();
  announce(
    stored
      ? "Email address added on this browser."
      : "Email address added. Browser storage is unavailable.",
  );
});
newEmail.addEventListener("input", () => {
  emailError.textContent = "";
});

const notificationButton = document.querySelector("#notifications-button");
const notifications = document.querySelector("#notifications");
notificationButton.addEventListener("click", () => {
  notifications.hidden = !notifications.hidden;
  notificationButton.setAttribute(
    "aria-expanded",
    String(!notifications.hidden),
  );
});

const search = document.querySelector("#search");
const results = document.querySelector("#search-results");
const searchableFields = [...document.querySelectorAll("[data-search]")];
function jumpToField(field) {
  results.hidden = true;
  if (!editing) setEditing(true);
  field.scrollIntoView({ block: "center" });
  field.querySelector("input, select").focus({ preventScroll: true });
  field.classList.add("highlight");
  setTimeout(() => field.classList.remove("highlight"), 2000);
}
function searchFields() {
  const query = search.value.trim().toLowerCase();
  results.replaceChildren();
  if (!query) {
    results.hidden = true;
    return [];
  }
  const matches = searchableFields.filter((field) =>
    field.dataset.search.toLowerCase().includes(query),
  );
  for (const field of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = field.dataset.search;
    button.addEventListener("click", () => jumpToField(field));
    results.append(button);
  }
  if (!matches.length) {
    const p = document.createElement("p");
    p.textContent = "No matching fields";
    results.append(p);
  }
  results.hidden = false;
  return matches;
}
search.addEventListener("input", searchFields);
document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const matches = searchFields();
  if (matches[0]) jumpToField(matches[0]);
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".notification-container")) {
    notifications.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }
  if (!event.target.closest(".search-container")) results.hidden = true;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    results.hidden = true;
    notifications.hidden = true;
    notificationButton.setAttribute("aria-expanded", "false");
  }
});
