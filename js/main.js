const form = document.getElementById("uploadForm");
const responseDiv = document.getElementById("response");

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

function displayInvoiceData(data) {
  responseDiv.innerHTML = "<h2>Processed Invoice/Receipt Data</h2>";

  if (data.vendor) {
    responseDiv.innerHTML += `
      <div class="invoice-details">
        <p><strong>Vendor:</strong> ${data.vendor.raw_name} 
        <button class="btn-copy" onclick="copyToClipboard('${data.vendor.raw_name}')">📋</button></p>
      </div>`;
  }
  if (data.vendor && data.vendor.logo) {
    responseDiv.innerHTML += `
      <div class="invoice-details">
        <img src="${data.vendor.logo}" alt="Vendor Logo" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px;" />
      </div>`;
  }
  if (data.invoice_number) {
    responseDiv.innerHTML += `
      <p><strong>Invoice Number:</strong> ${data.invoice_number} 
      <button class="btn-copy" onclick="copyToClipboard('${data.invoice_number}')">📋</button></p>`;
  }
  if (data.category) {
    responseDiv.innerHTML += `
      <p><strong>Category:</strong> ${data.category} 
      <button class="btn-copy" onclick="copyToClipboard('${data.category}')">📋</button></p>`;
  }
  if (data.date) {
    responseDiv.innerHTML += `
      <p><strong>Date:</strong> ${data.date} 
      <button class="btn-copy" onclick="copyToClipboard('${data.date}')">📋</button></p>`;
  }
  if (data.currency) {
    responseDiv.innerHTML += `
      <p><strong>Currency:</strong> ${data.currency} 
      <button class="btn-copy" onclick="copyToClipboard('${data.currency}')">📋</button></p>`;
  }

  if (
    data.line_items &&
    Array.isArray(data.line_items) &&
    data.line_items.length > 0
  ) {
    responseDiv.innerHTML += '<h3 class="line-items-title">Line Items</h3>';
    data.line_items.forEach((item) => {
      if (item.description) {
        responseDiv.innerHTML += `
          <p><strong>Description:</strong> ${item.description}`;
      }
      if (item.total) {
        responseDiv.innerHTML += `
          <p><strong>Total:</strong> ${item.total}`;
      }
      if (item.quantity) {
        responseDiv.innerHTML += `
          <p><strong>Quantity:</strong> ${item.quantity}`;
      }
      if (item.upc) {
        responseDiv.innerHTML += `
          <p><strong>UPC:</strong> ${item.upc} 
          <button class="btn-copy" onclick="copyToClipboard('${item.upc}')">📋</button></p>`;
      }
      responseDiv.innerHTML += `</div>`;
      responseDiv.innerHTML += `<hr style="border: 0.2px solid #102E50; margin: 10px 0;">`;
    });
  }

  if (data.subtotal || data.tax || data.total) {
    responseDiv.innerHTML += '<div class="total-amount">';
    if (data.subtotal) {
      responseDiv.innerHTML += `
        <p><strong>Subtotal:</strong> ${data.subtotal} 
        <button class="btn-copy" onclick="copyToClipboard('${data.subtotal}')">📋</button></p>`;
    }
    if (data.tax) {
      responseDiv.innerHTML += `
        <p><strong>Tax:</strong> ${data.tax} 
        <button class="btn-copy" onclick="copyToClipboard('${data.tax}')">📋</button></p>`;
    }
    if (data.total) {
      responseDiv.innerHTML += `
        <p><strong>Total:</strong> ${data.total} 
        <button class="btn-copy" onclick="copyToClipboard('${data.total}')">📋</button></p>`;
    }
    responseDiv.innerHTML += "</div>";
  } else {
    responseDiv.innerHTML += "<h2>Raw OCR Output</h2>";
    responseDiv.innerHTML += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Copied to clipboard: " + text);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}
