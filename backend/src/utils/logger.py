import logging
import logging.config


# Logging has levels—use them correctly:

# DEBUG → detailed internal info
# INFO → normal operations
# WARNING → something unexpected but not breaking
# ERROR → failure
# CRITICAL → system-breaking issue


LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "default": {
            "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        },
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
        "file": {
            "class": "logging.FileHandler",
            "formatter": "default",
            "filename": "backend_api.log",
            "mode": "a",             # append mode
        },
    },

    "root": {
        "level": "INFO",
        "handlers": ["console", "file"],
    },
}

def setup_logging():
    logging.config.dictConfig(LOGGING_CONFIG)
