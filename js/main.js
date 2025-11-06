const form = document.getElementById("uploadForm");
const responseDiv = document.getElementById("response");
const submitSection = document.getElementById("submit-receipt");
const homeSection = document.getElementById("select-option");
const backBtn = document.getElementById("back-to-options");
const enterAmountBtn = document.getElementById("enter-amount");
const selectFile = document.getElementById("select-file");
const enterAmountSection = document.getElementById("enter-amount-section");
const selectCategory = document.getElementById("categoryInput");

enterAmountBtn.addEventListener("click", async () => {
  try {
    const statusRes = await fetch(
      `https://ocr-server-z1sy.onrender.com/api/auth-status`
    );
    const status = await statusRes.json();
    if (!status.authenticated) {
      // redirect to server auth route to show Google consent
      window.location = `https://ocr-server-z1sy.onrender.com/api/auth`;
      return;
    }
    // authenticated =>show manual entry UI
    enterAmountSection.style.display = "block";
    homeSection.style.display = "none";
    responseDiv.style.display = "none";
    submitSection.style.display = "none";
  } catch (err) {
    console.error("Auth check failed:", err);
    alert("Could not verify authentication. Try again.");
  }
});

selectFile.addEventListener("click", async () => {
  try {
    const statusRes = await fetch(
      `https://ocr-server-z1sy.onrender.com/api/auth-status`
    );
    const status = await statusRes.json();
    if (!status.authenticated) {
      // redirect to server auth route to show Google consent
      window.location = `https://ocr-server-z1sy.onrender.com/api/auth`;
      return;
    }
    // authenticated =>show manual entry UI
    enterAmountSection.style.display = "block";
    homeSection.style.display = "none";
    responseDiv.style.display = "none";
    submitSection.style.display = "none";
  } catch (err) {
    console.error("Auth check failed:", err);
    alert("Could not verify authentication. Try again.");
  }
  submitSection.style.display = "block";
  enterAmountSection.style.display = "none";
  homeSection.style.display = "none";
  responseDiv.style.display = "none";
});

backBtn.addEventListener("click", () => {
  submitSection.style.display = "none";
  enterAmountSection.style.display = "none";
  homeSection.style.display = "block";
  responseDiv.style.display = "none";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    responseDiv.style.display = "block";
    responseDiv.innerHTML =
      '<p class="error-message">Please select a file.</p>';
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  responseDiv.style.display = "block";
  responseDiv.innerHTML = "<p>Uploading and processing...</p>";

  try {
    const response = await fetch(
      "https://ocr-server-z1sy.onrender.com/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log("Server Response:", result);
    displayInvoiceData(result);
  } catch (error) {
    console.error("Error processing file:", error);
    responseDiv.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
  } finally {
    fileInput.value = "";
  }
});

const CATEGORIES = [
  "Select category",
  "Groceries",
  "Bebe (Cat)",
  "Entertainment",
  "Gifts",
  "Going out",
  "Hobbies",
  "Housing",
  "Meal",
  "Medical",
  "Parents",
  "Personal care",
  "Travel",
];

let itemsByCategory = {};

const tempSummary = {
  vendor: "",
  date: "",
  categories: [],
};

selectCategory.innerHTML = CATEGORIES.map((cat) => {
  return `<option value="${cat}">${cat}</option>`;
}).join("");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("amountForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dateInput = document.getElementById("dateInput").value;
    // Format date as MM-DD-YYYY for sending/display
    const formattedDate = dateInput
      ? new Date(dateInput).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })
      : "";
    const vendor = document.getElementById("vendorInput").value;
    const amount = document.getElementById("amountInput").value;
    const category = document.getElementById("categoryInput").value;
    const notes = document.getElementById("notesInput").value;

    const payload = { date: formattedDate, vendor, amount, category, notes };

    try {
      const response = await fetch(
        `https://ocr-server-z1sy.onrender.com/api/append`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert("Receipt submitted successfully!");
        form.reset();
      } else {
        console.error("Server error:", result);
        alert("Failed to submit receipt. Check console for details.");
      }
    } catch (err) {
      console.error("Request failed:", err);
      alert("Could not connect to server.");
    }
  });
});

/**
 * Displays the processed invoice/receipt data in the page.
 * @param {Object} data - The processed invoice/receipt data.
 * @property {Object} data.vendor - Vendor information.
 * @property {string} data.vendor.raw_name - The raw name of the vendor.
 * @property {string} [data.vendor.logo] - The URL of the vendor's logo.
 * @property {string} [data.category] - The predicted category of the item.
 * @property {string} [data.date] - The date of the item.
 * @property {number} [data.subtotal] - The subtotal of the item.
 * @property {number} [data.tax] - The tax of the item.
 * @property {number} [data.total] - The total of the item.
 * @property {string} [data.currency_code] - The currency code of the item.
 */ //TODO: improve display formatting, handle missing fields, function too long
function displayInvoiceData(data) {
  const responseDiv = document.getElementById("response");
  responseDiv.innerHTML = "<h2>Processed Invoice/Receipt Data</h2>";

  // Vendor info
  if (data.vendor) {
    responseDiv.innerHTML += `
      <div class="invoice-details">
        <p><strong>Vendor:</strong> ${data.vendor.raw_name}</p>
      </div>`;
    if (data.vendor.logo) {
      responseDiv.innerHTML += `
        <div class="invoice-details">
          <img src="${data.vendor.logo}" alt="Vendor Logo" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px;" />
        </div>`;
    }
    if (data.category) {
      responseDiv.innerHTML += `
        <div class="invoice-details">
          <p><strong>Predicted Category:</strong> ${data.category}</p>
        </div>`;
    }
    if (data.date)
      responseDiv.innerHTML += `<p><strong>Date:</strong> ${data.date}</p>`;
    if (data.total) {
      responseDiv.innerHTML += `
        <div class="invoice-details">
      <p><strong>Subtotal:</strong> ${data.subtotal} ${
        data.currency_code || ""
      }</p>
      <p><strong>Tax:</strong> ${data.tax || "N/A"} ${
        data.currency_code || ""
      }</p>
      <p><strong>Total:</strong> ${data.total || "N/A"} ${
        data.currency_code || ""
      }</p>
        </div>`;
    }
    // Fill vendor and date in temp summary
    tempSummary.vendor = data.vendor.name;
    // Use formatted date, not time
    tempSummary.date = new Date(data.date).toLocaleDateString();
  }

  // Group items, anything not 'food' goes to "Uncategorized"
  itemsByCategory = {};
  if (data.line_items && Array.isArray(data.line_items)) {
    data.line_items.forEach((item, idx) => {
      let category =
        item.type && item.type.toLowerCase() === "food"
          ? "Groceries"
          : "Uncategorized";
      item._index = idx; // track original index for updates
      if (!itemsByCategory[category]) itemsByCategory[category] = [];
      itemsByCategory[category].push(item);
    });

    // Summary container
    let summaryDiv = document.createElement("div");
    summaryDiv.id = "summaryDiv";
    responseDiv.appendChild(summaryDiv);
    updateSummary();

    const submitToSpreadsheetBtn = document.createElement("button");
    submitToSpreadsheetBtn.textContent = "Submit to Google";
    submitToSpreadsheetBtn.id = "google-submit";

    /**
     * Appends the given payload to the Google Sheets API.
     * @param {Object} payload - The payload to append to the spreadsheet.
     * @returns {Promise<Object>} - A promise resolving to an object containing ok, status, and body.
     *   ok: A boolean indicating whether the request was successful.
     *   status: The HTTP status code of the response.
     *   body: The JSON response body, or an empty object if an error occurred.
     */
    async function appendPayload(payload) {
      try {
        const res = await fetch(
          `https://ocr-server-z1sy.onrender.com/api/append`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const body = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, body };
      } catch (err) {
        return { ok: false, error: err };
      }
    }

    submitToSpreadsheetBtn.addEventListener("click", async () => {
      submitToSpreadsheetBtn.disabled = true;
      const originalText = submitToSpreadsheetBtn.textContent;
      submitToSpreadsheetBtn.textContent = "Submitting...";

      // build non-zero payloads
      const payloads = Object.entries(itemsByCategory)
        .map(([category, items]) => {
          const total = items.reduce(
            (s, it) => s + (parseFloat(it.total) || 0),
            0
          );
          if (total <= 0) return null;
          return {
            date: tempSummary.date,
            vendor: tempSummary.vendor,
            amount: total.toFixed(2),
            category,
            notes: "",
          };
        })
        .filter(Boolean);

      if (payloads.length === 0) {
        alert("No non-zero categories to submit.");
        submitToSpreadsheetBtn.disabled = false;
        submitToSpreadsheetBtn.textContent = originalText;
        return;
      }

      // send in parallel and gather results
      const results = await Promise.allSettled(
        payloads.map((p) => appendPayload(p))
      );

      let successCount = 0;
      const failures = [];

      results.forEach((r, idx) => {
        if (r.status === "fulfilled" && r.value && r.value.ok) {
          successCount++;
        } else {
          failures.push({
            payload: payloads[idx],
            error: r.reason || r.value || "unknown",
          });
        }
      });

      submitToSpreadsheetBtn.disabled = false;
      submitToSpreadsheetBtn.textContent =
        successCount === payloads.length ? "Submitted" : originalText;

      if (failures.length === 0) {
        alert(`All ${successCount} categories submitted successfully.`);
      } else {
        console.error("Some submissions failed:", failures);
        alert(
          `${successCount} succeeded, ${failures.length} failed. See console for details.`
        );
      }
    });

    summaryDiv.appendChild(submitToSpreadsheetBtn);

    // Detailed items container
    const detailsDiv = document.createElement("div");
    detailsDiv.id = "detailsDiv";
    responseDiv.appendChild(detailsDiv);

    for (const category in itemsByCategory) {
      createCategoryContainer(category, itemsByCategory[category], detailsDiv);
    }
  }
}

/**
 * Creates a category container element that contains a title and a list of items.
 * For "Uncategorized" items, a select and confirm button are appended to the item div.
 * When the confirm button is clicked, the item is moved to the selected category.
 * @param {string} category - The name of the category.
 * @param {array} items - An array of items to display in the category.
 * @param {HTMLElement} parentDiv - The parent element to append the category container to.
 */
function createCategoryContainer(category, items, parentDiv) {
  let categoryDiv = document.createElement("div");
  categoryDiv.className = "category";
  categoryDiv.dataset.category = category;

  let categoryTitle = document.createElement("h4");
  categoryTitle.textContent = category;

  let categoryItemsDiv = document.createElement("div");
  categoryItemsDiv.className = "category-items";

  categoryDiv.appendChild(categoryTitle);
  categoryDiv.appendChild(categoryItemsDiv);

  parentDiv.appendChild(categoryDiv);

  items.forEach((item) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "line-item";
    itemDiv.dataset.index = item._index;

    // Use a temporary div to parse and append the inner HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = `
      ${item.description ? `<p>${item.description}</p>` : ""}
      ${item.type ? `<p><strong>Type:</strong> ${item.type}</p>` : ""}
      ${item.total ? `<p><strong>Total:  ${item.total}</strong></p>` : ""}
    `;

    while (tempDiv.firstChild) {
      itemDiv.appendChild(tempDiv.firstChild);
    }

    if (category === "Uncategorized") {
      const select = document.createElement("select");
      CATEGORIES.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
      });

      const confirmBtn = document.createElement("button");
      confirmBtn.textContent = "Update";

      confirmBtn.addEventListener("click", () => {
        const selectedValue = select.value;
        if (selectedValue === "Select category") return;

        let newCategory = selectedValue;

        itemsByCategory["Uncategorized"] = itemsByCategory[
          "Uncategorized"
        ].filter((i) => i !== item);

        if (!itemsByCategory[newCategory]) {
          itemsByCategory[newCategory] = [];
          createCategoryContainer(
            newCategory,
            [],
            document.getElementById("detailsDiv")
          );
        }
        itemsByCategory[newCategory].push(item);

        const newCategoryDiv = document.querySelector(
          `.category[data-category="${newCategory}"] .category-items`
        );
        newCategoryDiv.appendChild(itemDiv);

        select.remove();
        confirmBtn.remove();
        updateSummary();
      });

      itemDiv.appendChild(select);
      itemDiv.appendChild(confirmBtn);
    }

    // Append the entire itemDiv, including the button, to the category items container
    categoryItemsDiv.appendChild(itemDiv);
  });
}

/**
 * Updates the summary section of the page with the total amount spent by category.
 * If an item is categorized as "Uncategorized" and there are no items in that category,
 * the category is removed from the summary.
 * If the submit button to Google Sheets already exists, it is appended to the summary section.
 */
function updateSummary() {
  const summaryDiv = document.getElementById("summaryDiv");

  // Save reference to existing submit button (if already created)
  let submitBtn = document.getElementById("google-submit");

  summaryDiv.innerHTML = "<h3>Summary by Category</h3><ul>";

  for (const category in itemsByCategory) {
    const total = itemsByCategory[category]
      .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0)
      .toFixed(2);

    // Skip empty uncategorized
    if (
      category === "Uncategorized" &&
      itemsByCategory[category].length === 0
    ) {
      delete itemsByCategory[category];
      const catDiv = document.querySelector(
        `.category[data-category="${category}"]`
      );
      if (catDiv) catDiv.remove();
      continue;
    }

    summaryDiv.innerHTML += `<li><strong>${category}:</strong> ${total}</li>`;
    console.log(`Category: ${category}, Total: ${total}`);
  }

  summaryDiv.innerHTML += "</ul>";

  if (submitBtn) {
    summaryDiv.appendChild(submitBtn);
  }
}
