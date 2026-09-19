"""Build source/history transfer ZIP without installed packages or local data."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'transfer-dist'
DIRECTORIES = {'apps', 'packages', 'database', 'desktop', 'docs', 'project', 'tests', 'tools', 'scripts', 'transfer', 'review_package', '.github'}
SKIP = {'node_modules', '.next', '.git', '__pycache__', 'test-results', 'playwright-report', 'private-data', 'private-evidence', 'uploads'}
ROOT_FILES = {'AGENTS.md', 'README.md', 'STANDALONE_READINESS.md', 'IMPLEMENTATION_DECISIONS.md', 'SETUP_CHATGPT_PROJECT.md', '.gitignore', 'package.json', 'package-lock.json', 'playwright.config.ts'}
EXTENSIONS = {'.md', '.ts', '.tsx', '.css', '.json', '.sql', '.py', '.ps1', '.sh', '.yml', '.yaml', '.cjs', '.mjs', '.cmd', '.txt'}
SECRET = re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bsk-[A-Za-z0-9_-]{32,}\b')

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], stderr=subprocess.PIPE)

def source_files():
    selected = []
    for directory, dirs, files in os.walk(ROOT):
        parent = Path(directory)
        dirs[:] = [d for d in dirs if d not in SKIP and not (parent / d).is_symlink()
                   and (parent != ROOT or d in DIRECTORIES)]
        for name in files:
            path = parent / name
            if path.is_symlink():
                continue
            rel = path.relative_to(ROOT)
            include = name in ROOT_FILES if len(rel.parts) == 1 else path.suffix in EXTENSIONS or name == '.env.example'
            if name.startswith('.env') and name != '.env.example':
                include = False
            if rel.parts[0] == 'project' and not (name.endswith('.template.md') or name == 'MED_ASSISTANT_SYSTEM_PROMPT.md'):
                include = False
            if include:
                data = path.read_bytes()
                if SECRET.search(data):
                    raise RuntimeError(f'Credential pattern found in {rel}; no value printed')
                selected.append((rel.as_posix(), data))
    return sorted(selected)

def build():
    OUT.mkdir(exist_ok=True)
    selected = source_files()
    ids = [line.split(b' ', 1)[0] for line in git('rev-list', '--objects', '--all').splitlines()]
    batch = subprocess.run(['git', '-C', str(ROOT), 'cat-file', '--batch'], input=b'\n'.join(ids)+b'\n', stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True).stdout
    offset = 0
    scanned = 0
    while offset < len(batch):
        end = batch.index(b'\n', offset)
        oid, kind, size = batch[offset:end].split()
        start = end + 1
        content = batch[start:start+int(size)]
        if kind == b'blob':
            scanned += 1
            if SECRET.search(content):
                raise RuntimeError('Credential pattern in Git history; transfer stopped, no value printed')
        offset = start + int(size) + 1
    bundle = OUT / 'med-assistant-history.bundle'
    subprocess.run(['git', '-C', str(ROOT), 'bundle', 'create', str(bundle), '--all'], check=True)
    bundle_bytes = bundle.read_bytes()
    manifest = {
        'format': 'med-assistant-transfer/v1', 'createdAt': datetime.now(timezone.utc).isoformat(),
        'baseCommit': git('rev-parse', 'HEAD').decode().strip(), 'workingTreeIncluded': True,
        'historyBundleSha256': hashlib.sha256(bundle_bytes).hexdigest(),
        'historicalBlobsPatternScanned': scanned,
        'scanLimitation': 'Known credential patterns only; not a formal secret or patient-data audit.',
        'files': [{'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)} for name, data in selected],
    }
    archive = OUT / 'Med-Assistant-Transfer.zip'
    prefix = 'Med-Assistant-Transfer/'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in selected:
            z.writestr(prefix+'source/med-assistant/'+name, data)
        z.writestr(prefix+'med-assistant-history.bundle', bundle_bytes)
        z.writestr(prefix+'MANIFEST.json', json.dumps(manifest, indent=2))
        for name in ['START_HERE.md', 'RESTORE_WINDOWS.ps1']:
            z.writestr(prefix+name, (ROOT/'transfer'/name).read_bytes())
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for item in manifest['files']:
            assert hashlib.sha256(z.read(prefix+'source/med-assistant/'+item['path'])).hexdigest() == item['sha256']
        assert not any('/.git/' in name or '/node_modules/' in name or '/.next/' in name or name.endswith('.env.local') for name in z.namelist())
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix('.zip.sha256').write_text(checksum+'  '+archive.name+'\n', encoding='utf-8')
    print(json.dumps({'archive': str(archive), 'sourceFiles': len(selected), 'historicalBlobsScanned': scanned, 'bytes': archive.stat().st_size, 'sha256': checksum}, indent=2))

if __name__ == '__main__':
    build()
