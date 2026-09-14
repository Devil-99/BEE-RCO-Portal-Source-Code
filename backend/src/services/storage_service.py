import os
import uuid


class StorageService:
    def __init__(self, base_path="/var/www/storage"):
        self.base_path = base_path

    def _full_path(self, relative_path):
        return os.path.join(self.base_path, relative_path)

    def _safe_join(self, path):
        full_path = os.path.realpath(os.path.join(self.base_path, path))
        if not full_path.startswith(self.base_path):
            raise Exception("Invalid path")
        return full_path

    def save_file(self, file_bytes, filename, folder="uploads"):
        unique_name = f"{uuid.uuid4()}_{filename}"
        path = os.path.join(folder, unique_name)
        full_path = self._full_path(path)

        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        tmp_path = full_path + ".tmp"
        with open(tmp_path, "wb") as f:
            f.write(file_bytes)

        os.rename(tmp_path, full_path)

        return path

    def get_file_path(self, relative_path):
        return self._safe_join(relative_path)

    def delete_file(self, relative_path):
        path = self._safe_join(relative_path)
        if os.path.exists(path):
            os.remove(path)
    
storage = StorageService()

def get_storage():
    return storage