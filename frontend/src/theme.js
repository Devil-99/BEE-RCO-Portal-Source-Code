const deloitte_theme = {
    primary : '#F2F9F2', // lightgreen
    secondary : '#86BC25', // mediumgreen
    ternary : '#198529', // darkgreen
    white: '#FFFFFF', // white
    black: '#000', //black
    textPrimary : '#333', // black
    textSecondary : '#555', // Lightblack
    textHover : '#562fe0', // blue
    textWarning : '#FF0000', // red
    buttonPrimary : '#9ec951', // lightgreen
    buttonHoverPrimary: "#86BC25", // mediumgreen
    buttonSecondary : '#90cdf4', // blue.300
    buttonHoverSecondary : '#5c98bd', // blue
    buttonTernary: '#cbccca',
    buttonHoverTernary: '#a6a6a6',
    buttonWarning: '#e65353', //lightred
    buttonHoverWarning : '#a64949', //lightmaroon
    marginY: '0.25rem',
    paddingX: '1rem',
    paddingY: '0.5rem',
    gap:'1rem',
    formbackground : "green.50",
    formActiveNavbar : "green.500",
    borderColor : "gray.300",
    logicFormLeftBorder : "#38a169",
    colorScheme: "green",
    primaryColor: "#00704a",
    glassBackground: "rgba(255, 255, 255, 0.25)",
    glass: {
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        backgroundColor: "rgba(50, 50, 50, 0.50)",
        boxShadow: "none",
        borderRadius: "8px",
        border: "none",
        transition: "backdrop-filter 0.18s ease, -webkit-backdrop-filter 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease",
        color: "white",
        "&:hover, &:focus-within": {
            backdropFilter: "blur(7px)",
            WebkitBackdropFilter: "blur(7px)",
            backgroundColor: "rgba(50, 50, 50, 0.50)",
        },
    }
}

export default deloitte_theme;