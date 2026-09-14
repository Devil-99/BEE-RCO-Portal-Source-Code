export const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
};

export const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';

    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString("en-GB");
};

export const formatDateTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString("en-GB");
};

export const formatTime = (time) => {
    if (!time) return 'N/A';
    const timewithoutzone = new Date(time).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
    return timewithoutzone
}