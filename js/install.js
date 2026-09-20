// The README's install lines, verbatim. If the installer moves, README.md and this change together.
export const COMMANDS = {
  unix: 'git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git && cd Noesis && python3 install.py',
  windows: 'git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git; cd Noesis; python install.py',
};

export function detectOS(platform = '') { return /win/i.test(platform) ? 'windows' : 'unix'; }

export function initInstall(root = document) {
  const code = root.querySelector('[data-install-command]');
  const buttons = [...root.querySelectorAll('[data-install-os]')];
  const copy = root.querySelector('[data-install-copy]');
  if (!code) return;
  const select = os => {
    code.textContent = COMMANDS[os];
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.installOs === os)));
  };
  buttons.forEach(b => b.addEventListener('click', () => select(b.dataset.installOs)));
  select(detectOS(navigator.userAgentData?.platform || navigator.platform));
  copy?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code.textContent); } catch { return; }
    copy.textContent = 'copied'; copy.dataset.state = 'copied';
    setTimeout(() => { copy.textContent = 'copy'; delete copy.dataset.state; }, 1200);
  });
}
