# main.spec
# Run with: pyinstaller main.spec

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('uploads', 'uploads'),
        ('src/routes', 'src/routes'),
        ('src/models', 'src/models'),
        ('src/schemas', 'src/schemas'),
        ('src/create_table.py', 'src'),
        ('src/settings.py', 'src'),
        ('src/database.py', 'src'),
        ('src/utils', 'src/utils'),
        ('.env', '.')
    ],
    hiddenimports=[
        'passlib.handlers.bcrypt',
        'starlette.templating',
        'starlette.routing',
        'starlette.datastructures',
        'fastapi.middleware',
        'sqlalchemy.ext.declarative',
        'sqlalchemy.orm',
        'bcrypt',
        'uvicorn',
        'slowapi',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='fastapi_app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='fastapi_app'
)
