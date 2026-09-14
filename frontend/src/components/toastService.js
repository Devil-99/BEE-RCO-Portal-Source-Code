let toastRef = null;

export const setToastInstance = (toastInstance) => {
  toastRef = toastInstance;
};

export const showToast = ({ title, description = '', status = "info", duration = 5000, isClosable = true }) => {
  if (toastRef) {
    toastRef({
      title,
      description,
      status,
      duration,
      isClosable,
    });
  } else {
    console.warn("Toast has not been initialized yet.");
  }
};
