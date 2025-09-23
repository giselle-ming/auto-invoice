const form = document.getElementById("uploadForm");
const responseDiv = document.getElementById("response");
const submitSection = document.getElementById("submit-receipt");
const homeSection = document.getElementById("select-option");
const backBtn = document.getElementById("back-to-options");
const enterAmountBtn = document.getElementById("enter-amount");
const selectFile = document.getElementById("select-file");
const enterAmountSection = document.getElementById("enter-amount-section");
const selectCategory = document.getElementById("categoryInput");

enterAmountBtn.addEventListener("click", () => {
  enterAmountSection.style.display = "block";
  homeSection.style.display = "none";
  responseDiv.style.display = "none";
  submitSection.style.display = "none";
});

selectFile.addEventListener("click", () => {
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

    // Detailed items container
    const detailsDiv = document.createElement("div");
    detailsDiv.id = "detailsDiv";
    responseDiv.appendChild(detailsDiv);

    for (const category in itemsByCategory) {
      createCategoryContainer(category, itemsByCategory[category], detailsDiv);
    }
  }
}

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

function updateSummary() {
  const summaryDiv = document.getElementById("summaryDiv");
  summaryDiv.innerHTML = "<h3>Summary by Category</h3><ul>";
  for (const category in itemsByCategory) {
    const total = itemsByCategory[category]
      .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0)
      .toFixed(2);
    summaryDiv.innerHTML += `<li><strong>${category}:</strong> ${total}</li>`;
    console.log(`Category: ${category}, Total: ${total}`);
    // Delete uncategorized if empty
    if (
      category === "Uncategorized" &&
      itemsByCategory[category].length === 0
    ) {
      // remove li from summary
      summaryDiv.innerHTML = summaryDiv.innerHTML.replace(
        `<li><strong>${category}:</strong> ${total}</li>`,
        ""
      );
      delete itemsByCategory[category];
      const catDiv = document.querySelector(
        `.category[data-category="${category}"]`
      );
      if (catDiv) catDiv.remove();
    }
  }
  summaryDiv.innerHTML += "</ul>";
}
