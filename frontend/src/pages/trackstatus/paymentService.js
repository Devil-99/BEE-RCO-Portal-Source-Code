/**
 * Submit encrypted payment form to SBI
 * @param {string} encryptedValue - Encrypted payment data from backend
 * @param {string} merchantId - Merchant ID from backend
 * @param {string} sbiEndpoint - SBI API endpoint URL
 */
export const submitPaymentForm = (encryptedValue, merchantId, sbiEndpoint) => {
    const form = document.createElement("form");
    form.method = "POST";
    // form.target = "_blank";
    form.action = sbiEndpoint;

    const encField = document.createElement("input");
    encField.type = "hidden";
    encField.name = "EncryptTrans";
    encField.value = encryptedValue;

    const merchField = document.createElement("input");
    merchField.type = "hidden";
    merchField.name = "merchIdVal";
    merchField.value = merchantId;

    form.appendChild(encField);
    form.appendChild(merchField);

    document.body. appendChild(form);
    form.submit();
};
